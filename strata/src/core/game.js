// Game controller: owns the save state and every action that changes it. Pure (no DOM, no network, clock and random are injected).
// The browser app only draws this state and calls these actions.
import { FAMILY_IDS } from '../settings/definitions.js';
import { computeMastery, computeVisibility, allowedTier, domFam } from './fog.js';
import { ratingXp, pointsFromXp, levelFromXp, restedPoolAfter } from './xp.js';
import { makeSimilarity, predictRating, recommend, sharesFamily, creditNames } from './recs.js';
import { extendThreads, startThread, threadList } from './threads.js';
import { territoryDays } from './recency.js';
import { tasteSignature, territoryReveal, levelTitle } from './stats.js';
import { familiesFromTags, tierFromListeners, makeWorkId, autoLink } from './library.js';
import { bundleId, activeBundles, collapseBundles, remapEdges } from './bundles.js';
import * as Sync from './sync.js';
import * as Q from './quests.js';
import * as Shop from './shop.js';

const DAY = 864e5;

// demo = true puts the starter catalogue on the map. false is a blank canvas (the starter works can be switched on later with setDemo).
export function freshState(baseWorks, cfg, now, demo = true) {
  const works = {};
  if (demo) for (const w of baseWorks) { const t = w.heard ? now - w.daysAgo * DAY : 0; works[w.id] = { heard: !!w.heard, rating: w.heard ? w.rating : 0, last: t, first: t, ratedAt: t }; }
  return {
    v: 2, demo, xp: 0, points: cfg.get('shop.startPoints'), rested: 0, lastActive: now, works, added: [], addedEdges: [], bundles: [],
    threads: [], threadSeq: 0, activeThread: null, longestChain: 0,
    scouted: [], flares: [], dowse: null, via: {}, revealed: {}, charters: { family: {}, sub: {} },
    chronicles: {}, quests: {}, foundations: {},
    unlocks: {}, charges: { lens: cfg.get('shop.startLensCharges'), flare: 0, dowse: 0, roll: 0 }, slotTokens: 0, slotsLost: 0, lastBigUnlock: 0,
    placed: demo ? baseWorks.filter((w) => w.heard).map((w) => w.id) : [], creditLookups: 0, dayXp: { day: 0, xp: 0 }, stats: { ratings: 0, surprises: 0 },
    ...Sync.syncDefaults()
  };
}

export function createGame({ base, cfg, state = null, now = () => Date.now(), rand = Math.random }) {
  const t0 = now();
  let S = state || freshState(base.works, cfg, t0);
  const g = { get state() { return S; } };
  const demoOn = () => S.demo !== false;
  const bundles = () => (S.bundles ||= []);
  const allBase = () => [...(demoOn() ? base.works : []), ...S.added];
  // Base facts, then verified facts laid over them (see core/sync.js overlayWork). Two passes: the first finds verified genres,
  // the second labels each work with the subgenres those genres became.
  let derived = [];
  const rawWorks = () => { const t = now(); return allBase().map((w) => { const st = S.works[w.id] || { heard: false, rating: 0, last: 0, first: 0 }; return { ...w, heard: st.heard, rating: st.heard ? st.rating : 0, last: st.last, first: st.first, ratedAt: st.ratedAt ?? st.last, daysAgo: st.heard ? (t - st.last) / DAY : 9999 }; }); };
  const resolved = () => {
    const raw = rawWorks(), p1 = raw.map((w) => Sync.overlayWork(w, S, cfg, null));
    derived = Sync.deriveSubgenres(p1.filter((w) => !w.pending), cfg);
    const map = new Map(derived.map((d) => [d.key, d.id]));
    return raw.map((w) => Sync.overlayWork(w, S, cfg, map));
  };
  const hide = () => cfg.get('sync.unverifiedSeed') === 'hide';
  g.pendingWorks = () => resolved().filter((w) => w.pending);
  // every work with bundles left unfolded: what sync, chronicles and duplicate checks need
  g.allWorks = () => resolved().filter((w) => !w.pending && !(hide() && w.source === 'seed' && !w.verified && !w.heard && !S.scouted.includes(w.id)));
  // what the map shows: bundled works appear as one
  g.works = () => collapseBundles(g.allWorks(), bundles(), S, now());
  g.edges = () => remapEdges([...(hide() || !demoOn() ? [] : base.edges), ...S.addedEdges, ...S.syncEdges], activeBundles(g.allWorks(), bundles()));
  g.subgenres = () => { g.works(); return [...(hide() || !demoOn() ? [] : base.subgenres), ...derived]; };
  const chron = () => { const ids = new Set(g.allWorks().map((w) => w.id)); return base.chronicles.filter((c) => c.works.every((id) => ids.has(id))); };
  g.chronicles = chron;
  const edges = () => g.edges();

  // time away banks rested XP
  S.rested = restedPoolAfter(S.rested, Math.max(0, (t0 - S.lastActive) / DAY), cfg); S.lastActive = t0;
  g.replaceState = (s) => { S = s; g.syncChronicles(); };
  g.byId = () => Object.fromEntries(g.works().map((w) => [w.id, w]));
  g.sim = () => makeSimilarity(edges(), cfg);
  g.predicted = (id) => { const ws = g.works(), w = ws.find((x) => x.id === id); return w ? predictRating(w, ws.filter((x) => x.heard), g.sim(), cfg) : null; };
  g.level = () => levelTitle(S.xp, cfg);
  g.syncChronicles = () => Q.syncChronicles(S, chron(), g.allWorks(), now());
  g.syncChronicles();

  // Opening or playing a work counts as engagement and refreshes its recency ring.
  g.touch = (id) => { const st = S.works[id]; if (st && st.heard) st.last = now(); S.lastActive = now(); };

  g.rate = (id, value, opts = {}) => {
    const t = now(), ws = g.works(), w = ws.find((x) => x.id === id);
    if (!w) return { ok: false, reason: g.pendingWorks().some((x) => x.id === id) ? 'Choose a genre family for this work first.' : 'Unknown work.' };
    const st = (S.works[id] ||= { heard: false, rating: 0, last: 0, first: 0 });
    const wasHeard = st.heard, first = !wasHeard, ratedAt = st.ratedAt ?? st.last;
    const isReRate = wasHeard && (t - ratedAt) / DAY >= cfg.get('xp.reRateDelayDays');
    const heardList = ws.filter((x) => x.heard && x.id !== id), heardBefore = new Set(heardList.map((x) => x.id));
    const events = [];
    if (wasHeard && !isReRate) { st.rating = value; st.last = t; S.lastActive = t; return { ok: true, xp: 0, events, note: 'rating updated, no XP until the re-listen delay passes' }; }
    const sim = g.sim(), predicted = predictRating(w, heardList, sim, cfg), dom = domFam(w);
    const famCountBefore = heardList.filter((x) => domFam(x) === dom).length;
    const firstInFamily = first && famCountBefore === 0;
    const firstInSub = first && (w.subs || []).some((s) => !heardList.some((x) => (x.subs || []).includes(s)));
    let coolFam = null, coolDays = -1;
    for (const f of FAMILY_IDS) { const d = territoryDays(heardList.filter((x) => (x.fam[FAMILY_IDS.indexOf(f)] || 0) >= 0.5).map((x) => x.daysAgo), cfg); if (d > coolDays) { coolDays = d; coolFam = f; } }
    const ref = heardList.filter((x) => x.rating >= cfg.get('quests.counterpointMinRating')).sort((a, b) => b.ratedAt - a.ratedAt)[0] || null;
    const byId = Object.fromEntries(ws.map((x) => [x.id, x]));
    const ext = first ? extendThreads(S, w, heardBefore, edges(), byId, cfg, t, value) : null;
    const viaCredit = opts.viaCredit ?? S.via[id] === 'credit';
    const r = ratingXp({ work: w, rating: value, predicted, chainLen: ext ? ext.links : 0, restedPool: S.rested, firstInFamily, firstInSub, isReRate, lineageDepth: ext ? ext.lineageDepth : 0, viaCredit }, cfg);
    let xp = r.xp; const cap = cfg.get('xp.dailyXpCap');
    if (cap > 0) { const day = Math.floor(t / DAY); if (S.dayXp.day !== day) S.dayXp = { day, xp: 0 }; xp = Math.max(0, Math.min(xp, cap - S.dayXp.xp)); S.dayXp.xp += xp; }
    const lvBefore = levelFromXp(S.xp, cfg).level;
    st.heard = true; st.rating = value; st.last = t; st.ratedAt = t; st.first = st.first || t;
    if (S.dowse && S.dowse.id === id) S.dowse = null;
    if (cfg.get('slots.enabled') && first) Shop.place(S, id, cfg);
    const after = g.works();
    const q = Q.onRated(S, chron(), { work: w, works: after, first, isReRate, viaCredit, ref, coolFam, famCountBefore, sim }, cfg, t);
    const total = xp + q.xp;
    S.xp += total; S.points += pointsFromXp(xp, cfg) + q.points; S.charges.lens += q.lens; S.rested = Math.max(0, S.rested - r.restedUsed);
    S.stats.ratings++; if (predicted != null && Math.abs(value - predicted) >= cfg.get('xp.surpriseThreshold')) S.stats.surprises++;
    S.lastActive = t;
    const lvAfter = levelFromXp(S.xp, cfg).level; if (lvAfter > lvBefore) events.push({ type: 'levelUp', level: lvAfter });
    return { ok: true, xp: total, baseXp: xp, predicted, first, isReRate, firstInFamily, firstInSub, thread: ext ? { label: ext.thread.label, links: ext.links } : null, events: [...q.events, ...events] };
  };

  // ---- growing the tree. kind: precedent | inspired | contemporary | personnel | sample | credit (name required)
  g.growCandidates = (srcId, kind, name = null) => {
    const ws = g.works(), src = ws.find((w) => w.id === srcId), by = Object.fromEntries(ws.map((w) => [w.id, w]));
    let ids = [];
    if (kind === 'credit') ids = ws.filter((w) => w.id !== srcId && creditNames(w).some((n) => n.toLowerCase() === String(name).toLowerCase())).map((w) => w.id);
    else for (const e of edges()) {
      if (kind === 'precedent' && e.type === 'influence' && e.b === srcId) ids.push(e.a);
      else if (kind === 'inspired' && e.type === 'influence' && e.a === srcId) ids.push(e.b);
      else if (e.type === kind) { if (e.a === srcId) ids.push(e.b); else if (e.b === srcId) ids.push(e.a); }
    }
    const open = !cfg.get('recs.wormholesRequired') || Shop.has(S, 'wormholes');
    return [...new Set(ids)].map((i) => by[i]).filter((w) => w && (open || sharesFamily(src, w)));
  };
  g.grow = (srcId, kind, name = null) => {
    const ws = g.works(), cands = g.growCandidates(srcId, kind, name).filter((w) => !w.heard);
    if (!cands.length) return { ok: false, reason: 'Nothing new that way yet.', added: [] };
    const picks = recommend(cands, ws.filter((w) => w.heard), g.sim(), cfg, { year: new Date(now()).getUTCFullYear() });
    const added = [];
    for (const w of picks) { if (!S.scouted.includes(w.id)) { S.scouted.push(w.id); added.push(w.id); } if (kind === 'credit') S.via[w.id] = 'credit'; }
    return { ok: true, added, shown: picks.map((w) => w.id) };
  };

  // ---- credits panel
  g.credits = (id) => {
    const w = g.works().find((x) => x.id === id), c = w?.credits || {}, rv = S.revealed[id] || {}, lens = Shop.has(S, 'creditsLens');
    const free2 = S.creditLookups >= cfg.get('shop.secondaryCreditsUses'), wellspring = (w?.badges || []).includes('wellspring');
    const sec = (key, label, items, open) => ({ key, label, items: items || [], open: open && lens || (key === 'samples' && wellspring && lens), canReveal: lens && !open && (items || []).length > 0, free: key === 'players' && free2 });
    return {
      lens, charges: S.charges.lens,
      sections: [sec('producers', 'Producers', c.producers, !!rv.producers), sec('players', 'Guests and players', c.players, !!rv.players || free2), sec('samples', 'Sampled', c.samples, !!rv.samples)],
      label: c.label || null, scene: c.scene || null
    };
  };
  g.revealCredit = (id, key) => {
    if (!Shop.has(S, 'creditsLens')) return { ok: false, reason: 'Needs the Credits Lens.' };
    const sec = g.credits(id).sections.find((s) => s.key === key);
    if (!sec || !sec.items.length) return { ok: false, reason: 'No data for this work yet.' };
    if (sec.open) return { ok: true };
    const free = key === 'players' && S.creditLookups >= cfg.get('shop.secondaryCreditsUses');
    if (!free && !Shop.useCharge(S, 'lens')) return { ok: false, reason: 'No lens charges left.' };
    (S.revealed[id] ||= {})[key] = true; S.creditLookups++; return { ok: true };
  };

  // ---- shop and consumables
  g.shopItems = () => Shop.shopItems(S, g.works(), g.subgenres(), cfg, now());
  g.buy = (id) => {
    const r = Shop.buy(S, g.works(), g.subgenres(), id, cfg, now());
    if (r.ok && id.startsWith('family:')) S.charters.family[id.slice(7)] = true;
    if (r.ok && id.startsWith('sub:')) S.charters.sub[id.slice(4)] = true;
    return r;
  };
  g.useFlare = (hex) => { if (!Shop.useCharge(S, 'flare')) return { ok: false, reason: 'No flares left.' }; S.flares.push({ q: hex.q, r: hex.r }); return { ok: true }; };
  g.useDowse = (originHex, hexPos, lattice) => {
    if ((S.charges.dowse || 0) <= 0) return { ok: false, reason: 'No dowsing rods left.' };
    const ws = g.works(), heard = ws.filter((w) => w.heard), sim = g.sim();
    const hit = Shop.pickDowse(ws, hexPos, lattice, originHex, (w) => predictRating(w, heard, sim, cfg), cfg);
    if (!hit) return { ok: false, reason: 'Nothing nearby is predicted that high yet.' };
    Shop.useCharge(S, 'dowse'); if (!S.scouted.includes(hit.id)) S.scouted.push(hit.id); S.dowse = { id: hit.id, predicted: hit.predicted };
    return { ok: true, id: hit.id, predicted: hit.predicted };
  };
  g.useRoll = (fam = null) => {
    if ((S.charges.roll || 0) <= 0) return { ok: false, reason: 'No rarity rolls left.' };
    const ws = g.works(), ms = computeMastery(ws, cfg), allowed = {};
    for (const f of FAMILY_IDS) allowed[f] = Math.max(allowedTier(f, ms, cfg), S.charters.family[f] ? 1 : 0);
    const id = Shop.pickRoll(ws, ms, allowed, rand, cfg, fam);
    if (!id) return { ok: false, reason: 'No rarer work to find in that family.' };
    Shop.useCharge(S, 'roll'); if (!S.scouted.includes(id)) S.scouted.push(id); return { ok: true, id };
  };

  // ---- quests and threads
  g.board = () => Q.questBoard(S, chron(), g.works(), cfg, now());
  g.beginChronicle = (id) => { const c = chron().find((x) => x.id === id); return c ? Q.beginChronicle(S, c, cfg) : { ok: false, reason: 'That chronicle is not available.' }; };
  g.threads = () => threadList(S, cfg);
  g.startThread = (id) => { const w = g.works().find((x) => x.id === id); return w ? startThread(S, w, cfg, now()) : null; };

  // ---- library: add a work the user has heard (or wants to). def: {title, artist, year, tags?, fam?, tier?, have?, mbid?, rating?, heard?}
  g.addWork = (def) => {
    const ws = g.allWorks(), key = (a, b) => (a + '|' + b).toLowerCase();
    const dup = ws.find((w) => key(w.artist, w.title) === key(def.artist, def.title)); if (dup) return { ok: false, reason: 'Already in your library.', id: dup.id };
    const fam = def.fam || familiesFromTags(def.tags, cfg); if (!fam) return { ok: false, reason: 'Pick a genre family.' };
    const id = makeWorkId(def.title, def.artist, new Set(ws.map((w) => w.id)));
    const work = { id, title: def.title, artist: def.artist, year: def.year, fam, tier: def.tier ?? tierFromListeners(def.listeners, cfg), badges: [], subs: [], mbid: def.mbid || null, user: true, source: 'user', famPinned: !!def.fam, heard: false, rating: 0, daysAgo: 9999 };
    S.added.push(work); S.works[id] = { heard: false, rating: 0, last: 0, first: 0 };
    const links = autoLink(work, ws, g.sim(), cfg); S.addedEdges.push(...links);
    if (def.heard && def.rating) { const r = g.rate(id, def.rating); return { ok: true, id, links: links.length, rate: r }; }
    S.scouted.push(id); return { ok: true, id, links: links.length };
  };

  // Take a work you added or imported out of the library, with everything that points at it. Starter works are not removable:
  // they go away together when the demo catalogue is switched off.
  g.removeWork = (id) => {
    if (bundles().some((b) => b.id === id)) return g.unbundle(id);
    if (!S.added.some((x) => x.id === id)) return { ok: false, reason: 'Only works you added or imported can be removed. The starter works go away with the demo switch.' };
    S.added = S.added.filter((x) => x.id !== id);
    for (const k of ['works', 'facts', 'imports', 'via', 'revealed']) delete S[k][id];
    S.placed = S.placed.filter((x) => x !== id); S.scouted = S.scouted.filter((x) => x !== id);
    S.addedEdges = S.addedEdges.filter((e) => e.a !== id && e.b !== id); S.syncEdges = S.syncEdges.filter((e) => e.a !== id && e.b !== id);
    S.threads = S.threads.map((t) => ({ ...t, ids: t.ids.filter((x) => x !== id) })).filter((t) => t.ids.length > 0);
    if (!S.threads.some((t) => t.id === S.activeThread)) S.activeThread = null;
    if (S.dowse && S.dowse.id === id) S.dowse = null;
    S.bundles = bundles().map((b) => ({ ...b, ids: b.ids.filter((x) => x !== id) })).filter((b) => { if (b.ids.length >= 2) return true; delete S.works[b.id]; return false; });
    g.afterSync(); return { ok: true };
  };
  g.removeMany = (ids) => { let n = 0, reason = null; for (const id of ids) { const r = g.removeWork(id); if (r.ok) n++; else reason = r.reason; } return { ok: n > 0, removed: n, reason }; };

  // The starter catalogue on or off. Turning it off only hides it: ratings you gave starter works are kept for next time.
  g.setDemo = (on) => {
    S.demo = !!on;
    if (S.demo) {
      const t = now();
      for (const w of base.works) if (!S.works[w.id]) {
        const tt = w.heard ? t - w.daysAgo * DAY : 0;
        S.works[w.id] = { heard: !!w.heard, rating: w.heard ? w.rating : 0, last: tt, first: tt, ratedAt: tt };
        if (w.heard && !S.placed.includes(w.id)) S.placed.push(w.id);
      }
    }
    g.afterSync(); return { ok: true, on: S.demo };
  };
  g.demo = () => demoOn();

  // ---- bundles: treat several works as one. The parts stay in the save; unbundling gives them back.
  g.bundles = () => activeBundles(g.allWorks(), bundles()).map((b) => ({ id: b.id, name: b.name, ids: b.present }));
  g.makeBundle = (ids, name) => {
    ids = [...new Set(ids || [])]; name = String(name || '').trim();
    if (ids.length < 2) return { ok: false, reason: 'Pick at least two works to bundle. Shift-click works on the map to select several.' };
    if (!name) return { ok: false, reason: 'Give the bundle a name.' };
    const have = new Set(g.allWorks().map((w) => w.id)), inBundle = new Set(bundles().flatMap((b) => b.ids));
    for (const id of ids) {
      if (id.startsWith('b:')) return { ok: false, reason: 'A bundle cannot go inside another bundle. Unbundle it first.' };
      if (!have.has(id)) return { ok: false, reason: 'One of those works is not on the map.' };
      if (inBundle.has(id)) return { ok: false, reason: 'One of those works is already in a bundle.' };
    }
    const id = bundleId(name, new Set([...bundles().map((b) => b.id), ...have]));
    bundles().push({ id, name, ids });
    return { ok: true, id };
  };
  g.unbundle = (id) => {
    if (!bundles().some((b) => b.id === id)) return { ok: false, reason: 'That is not a bundle.' };
    S.bundles = bundles().filter((b) => b.id !== id); delete S.works[id];
    S.scouted = S.scouted.filter((x) => x !== id); S.placed = S.placed.filter((x) => x !== id);
    return { ok: true };
  };

  // ---- sync: imports and verified facts. Imports never award XP; only rating does.
  g.importRecords = (records, provider, opts = {}) => {
    const all = allBase().map((w) => ({ id: w.id, title: w.title, artist: w.artist, mbid: w.mbid }));
    const res = Sync.importRecords(S, records, all, cfg, now(), { provider, ...opts });
    Sync.logRun(S, { at: now(), provider, fetched: records.length, added: res.added.length, matched: res.matched.length, skipped: res.skipped });
    g.afterSync(); return res;
  };
  g.afterSync = () => { const r = Sync.buildSyncEdges(S, g.allWorks(), cfg); g.syncChronicles(); return r; };
  g.setFamilies = (id, fam) => {
    const w = S.added.find((x) => x.id === id); if (!w) return { ok: false, reason: 'Only added works can be classified by hand.' };
    if (!fam || !Object.keys(fam).length) return { ok: false, reason: 'Pick at least one family.' };
    w.fam = fam; w.famPinned = true; g.afterSync(); return { ok: true };
  };
  g.syncSummary = () => Sync.syncSummary(S, g.allWorks());
  g.provenance = (id) => { const w = g.works().find((x) => x.id === id), f = S.facts[id]; return { id, source: w?.source || null, verified: !!w?.verified, at: f?.at || null, steps: f ? Object.keys(f.steps) : [], imports: Object.keys(S.imports[id]?.sources || {}), unmatched: !!f?.unmatched }; };

  g.place = (id) => Shop.place(S, id, cfg);
  g.unplace = (id) => Shop.unplace(S, id, cfg);
  g.slots = () => Shop.slotInfo(S, cfg);
  g.viewOpen = (v) => Shop.viewOpen(v, S, cfg);

  // ---- visibility and stats
  g.visibility = (hexPos, lattice) => {
    const ws = g.works(), v = computeVisibility(ws, hexPos, lattice, cfg, { scouted: S.scouted, flares: S.flares, charters: S.charters });
    const placed = (w) => S.placed.includes(w.id) || (w.bundleOf || []).some((i) => S.placed.includes(i));
    if (cfg.get('slots.enabled')) for (const w of ws) if (w.heard && !placed(w)) v.visible.delete(w.id);
    return v;
  };
  g.taste = () => ({ now: tasteSignature(g.works(), cfg), before: tasteSignature(g.works(), cfg, now() - cfg.get('taste.compareDays') * DAY) });
  g.reveal = (visible) => territoryReveal(g.works(), visible);
  g.chroniclesDone = () => Q.chroniclesDone(S);
  return g;
}
