// Sync engine: runs imports from accounts and the verification queue. Network goes through the injected http client,
// state changes go through core/sync.js. Resumable: what has been verified is stored in the save, so a stopped run picks up where it left off.
import { SyncError } from './http.js';
import { PROVIDERS } from './providers.js';
import * as Sync from '../core/sync.js';
import { parseSearch, parseReleaseGroup, pickRelease, parseRelease, parseArtist, parseArea, parseWikidata, parsePopularity, parseLastfmSimilar, parseMbReleaseGroups } from '../core/syncparse.js';
import { normText, workKey } from '../core/library.js';

const enc = encodeURIComponent, MB = 'https://musicbrainz.org/ws/2';
const chunk = (xs, n) => { const o = []; for (let i = 0; i < xs.length; i += n) o.push(xs.slice(i, i + n)); return o; };

export function createEngine({ game, accounts, cfg, http, now = () => Date.now(), onProgress = () => {}, onCheckpoint = () => {} }) {
  let ctl = null;
  const S = () => game.state;
  const acct = (id) => accounts[id] || {};
  const mb = (path, signal, allow404 = true) => http.request('musicbrainz', `${MB}/${path}${path.includes('?') ? '&' : '?'}fmt=json`, { signal, allow404, headers: PROVIDERS.musicbrainz.headers(acct('musicbrainz')) });
  const lbHeaders = () => (acct('listenbrainz').token ? { Authorization: `Token ${acct('listenbrainz').token}` } : {});

  const engine = {
    get running() { return !!ctl; },
    cancel() { ctl?.abort(); },
    missing(id) { const p = PROVIDERS[id]; return p.required.filter((k) => !acct(id)[k]); },

    async testAccount(id) {
      const p = PROVIDERS[id], miss = engine.missing(id); if (miss.length) return { ok: false, message: `Fill in: ${miss.join(', ')}.` };
      try { return await p.test({ account: acct(id), http, cfg }); } catch (e) { return { ok: false, message: e.message }; }
    },
    async listCollections() { return PROVIDERS.musicbrainz.listCollections({ account: acct('musicbrainz'), http }); },

    // Pull your library from one provider and add it to the save. Awards no XP. Returns {ok, ...counts} or {ok:false, message}.
    async importFrom(id, { asHeard } = {}) {
      const p = PROVIDERS[id], miss = engine.missing(id); if (miss.length) return { ok: false, message: `Fill in: ${miss.join(', ')}.` };
      ctl = new AbortController();
      try {
        const { records, note } = await p.fetchLibrary({ account: acct(id), http, cfg, signal: ctl.signal, onProgress: (x) => onProgress({ phase: 'import', provider: id, ...x }) });
        const res = game.importRecords(records, id, asHeard == null ? {} : { asHeard });
        onCheckpoint(); return { ok: true, fetched: records.length, added: res.added.length, matched: res.matched.length, skipped: res.skipped, unclassified: res.unclassified.length, capped: res.cappedAt, note };
      } catch (e) { return { ok: false, message: e.message, kind: e.kind }; } finally { ctl = null; }
    },

    // One work through the steps it still needs. Returns nothing; failures are recorded by the caller.
    async verifyWork(item, signal) {
      const st = S(), t = now(), w = game.works().find((x) => x.id === item.id) || game.pendingWorks().find((x) => x.id === item.id); if (!w) return;
      const steps = new Set(item.steps);
      if (steps.has('match')) {
        const q = encodeURIComponent(`releasegroup:"${w.title}" AND artist:"${w.artist}"`);
        const cands = parseSearch(await mb(`release-group/?query=${q}&limit=5`, signal));
        const want = workKey(w.artist, w.title, cfg);
        const hit = cands.find((c) => c.score >= cfg.get('sync.matchMinScore') && workKey(c.artist, c.title, cfg) === want);
        if (!hit) { Sync.markUnmatched(st, w.id, t); return; }
        Sync.applyMatch(st, w.id, hit.mbid, hit.score, t); steps.add('rg');
      }
      const mbid = st.facts[w.id]?.mbid || w.mbid;
      if (steps.has('rg') && mbid) {
        const rg = parseReleaseGroup(await mb(`release-group/${mbid}?inc=artist-credits+genres+tags+releases`, signal));
        if (!rg) { Sync.markUnmatched(st, w.id, t); return; }
        Sync.applyReleaseGroup(st, w.id, rg, t);
      }
      const f = st.facts[w.id];
      if (steps.has('credits') && f?.steps?.rg) {
        const rid = pickRelease(f.releases || []);
        if (!rid) Sync.skipStep(st, w.id, 'credits', t);
        else { const rel = parseRelease(await mb(`release/${rid}?inc=artist-credits+artist-rels+recordings+recording-rels+recording-level-rels`, signal), cfg); if (rel) Sync.applyRelease(st, w.id, rel, t); else Sync.skipStep(st, w.id, 'credits', t); }
      }
      const am = f?.artistMbids?.[0];
      if (steps.has('artist') && am && !st.artists[am]?.steps?.artist) {
        const a = parseArtist(await mb(`artist/${am}?inc=genres+tags+artist-rels+url-rels`, signal), cfg);
        if (a) {
          Sync.applyArtist(st, a, t);
          if (cfg.get('sync.fetchPlaces')) {
            const order = cfg.get('sync.placeSource') === 'area' ? [a.area, a.beginArea] : [a.beginArea, a.area];
            const area = order.find((x) => x); let areaId = null;
            if (area) { areaId = area.id; if (!st.places[area.id]) { const ar = parseArea(await mb(`area/${area.id}?inc=url-rels`, signal)); Sync.applyArea(st, ar || { id: area.id, name: area.name, type: null, wikidata: null }, t); } }
            Sync.applyPlaceStep(st, am, areaId, t);
          }
        }
      }
    },

    // Work through the queue, then the phases that batch across works. opts: {scope, limit}
    async verify({ scope = 'library', limit = Infinity } = {}) {
      if (ctl) return { ok: false, message: 'A sync is already running.' };
      ctl = new AbortController(); const signal = ctl.signal, st0 = S();
      const queue = Sync.enrichmentQueue(st0, [...game.works(), ...game.pendingWorks()], cfg, scope).slice(0, limit);
      const sum = { ok: true, total: queue.length, done: 0, failed: 0, stopped: false, phases: {} };
      let net = 0;
      try {
        for (const item of queue) {
          if (signal.aborted) { sum.stopped = true; break; }
          onProgress({ phase: 'works', done: sum.done, total: queue.length, label: item.id });
          try { await engine.verifyWork(item, signal); net = 0; delete S().sync.failures[item.id]; }
          catch (e) {
            if (e.kind === 'aborted') { sum.stopped = true; break; }
            S().sync.failures[item.id] = { step: item.steps.join('+'), message: e.message, kind: e.kind, at: now() }; sum.failed++;
            if (e.kind === 'auth' || e.kind === 'rate') { sum.ok = false; sum.message = e.message; break; }
            if (e.kind === 'network' && ++net >= 3) { sum.ok = false; sum.message = e.message; break; }
          }
          sum.done++; onCheckpoint();
        }
        if (!sum.stopped && sum.ok) { Object.assign(sum.phases, await engine.globalPhases(signal)); }
      } catch (e) { sum.ok = false; sum.stopped = e.kind === 'aborted'; sum.message = e.message; }
      finally { ctl = null; }
      S().sync.lastVerify = now(); game.afterSync(); onCheckpoint();
      Sync.logRun(S(), { at: now(), provider: 'verify', fetched: queue.length, added: 0, matched: sum.done - sum.failed, skipped: sum.failed });
      return sum;
    },

    // popularity (ListenBrainz, batched), Wikidata coordinates and influence (batched), similar artists (Last.fm, one call per artist)
    async globalPhases(signal) {
      const st = S(), t = now(), out = {};
      if (cfg.get('sync.fetchPopularity')) {
        const ids = Sync.needPopularity(st); let got = 0;
        for (const part of chunk(ids, 50)) {
          onProgress({ phase: 'popularity', done: got, total: ids.length });
          try { const j = await http.request('listenbrainz', 'https://api.listenbrainz.org/1/popularity/release-group', { method: 'POST', body: { release_group_mbids: part }, headers: lbHeaders(), signal }); Sync.applyPopularity(st, parsePopularity(j), t, part); got += part.length; }
          catch (e) { if (e.kind === 'aborted') throw e; out.popularityError = e.message; break; }
        }
        out.popularity = got;
      }
      const qs = Sync.needWikidata(st, cfg); let wd = 0;
      for (const part of chunk(qs, 50)) {
        onProgress({ phase: 'wikidata', done: wd, total: qs.length });
        try { const j = await http.request('wikidata', `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${part.join('|')}&props=claims&format=json&origin=*`, { signal }); Sync.applyWikidata(st, parseWikidata(j, cfg), part, t); wd += part.length; }
        catch (e) { if (e.kind === 'aborted') throw e; out.wikidataError = e.message; break; }
      }
      out.wikidata = wd;
      if (cfg.get('sync.fetchSimilar') && acct('lastfm').apiKey) {
        const list = Sync.needSimilar(st).filter((a) => a.mbid); let n = 0;
        for (const a of list) {
          onProgress({ phase: 'similar', done: n, total: list.length });
          try { const j = await PROVIDERS.lastfm.similar({ account: acct('lastfm'), http, mbid: a.mbid, signal }); Sync.applySimilar(st, a.mbid, parseLastfmSimilar(j), t); n++; onCheckpoint(); }
          catch (e) { if (e.kind === 'aborted') throw e; out.similarError = e.message; if (e.kind === 'auth' || e.kind === 'rate') break; }
        }
        out.similar = n;
      }
      return out;
    },

    // ListenBrainz unique listeners for a list of release-group ids, used to guess a tier before a work is verified.
    async popularity(mbids, signal) {
      const j = await http.request('listenbrainz', 'https://api.listenbrainz.org/1/popularity/release-group', { method: 'POST', body: { release_group_mbids: mbids }, headers: lbHeaders(), signal });
      return parsePopularity(j);
    },

    // The artist's albums and EPs from MusicBrainz that are not in the library yet. Returns records ready for game.importRecords.
    async discography(workId) {
      const am = S().facts[workId]?.artistMbids?.[0]; if (!am) return { ok: false, reason: 'Verify this work first so its artist is known.' };
      ctl = new AbortController(); const signal = ctl.signal, lim = cfg.get('sync.discographyLimit'), out = [];
      try {
        for (let offset = 0; out.length < lim; offset += 100) {
          const j = await mb(`release-group?artist=${am}&type=album|ep&inc=artist-credits+genres+tags&limit=100&offset=${offset}`, signal);
          const p = parseMbReleaseGroups(j, 'musicbrainz'); out.push(...p.items);
          if (!p.items.length || (j['release-groups'] || []).length < 100) break;
        }
      } catch (e) { return { ok: false, reason: e.message }; } finally { ctl = null; }
      const have = new Set(game.works().concat(game.pendingWorks()).flatMap((w) => [w.mbid, workKey(w.artist, w.title, cfg)]).filter(Boolean));
      const keep = out.filter((r) => !r.secondary.some((s) => s === 'Live' || (s === 'Compilation' && !cfg.get('recs.includeCompilations'))) && !have.has(r.mbid) && !have.has(workKey(r.artist, r.title, cfg))).slice(0, lim);
      return { ok: true, records: keep, total: out.length };
    },

    // Rough time for the queue, so the screen can say how long it will take.
    estimate(queue) {
      const per = { match: 1, rg: 1, credits: 1, artist: 1.5 }; let calls = 0; for (const q of queue) for (const s of q.steps) calls += per[s] || 1;
      return Math.round(calls * cfg.get('sync.delayMs.musicbrainz') / 1000);
    }
  };
  return engine;
}
export { SyncError, normText };
