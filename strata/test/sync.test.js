import test from 'node:test';
import assert from 'node:assert/strict';
import { plainSettings } from '../src/settings/store.js';
import * as P from '../src/core/syncparse.js';
import * as F from './fixtures.js';
const network = F.network;
import { createHttp, SyncError } from '../src/sync/http.js';
import { loadAccounts, saveAccounts, setAccountField, ACCOUNTS_KEY } from '../src/sync/accounts.js';
import { createGame } from '../src/core/game.js';
import { createEngine } from '../src/sync/engine.js';
import { WORKS, EDGES, SUBGENRES } from '../src/data/seed.js';
import { CHRONICLES } from '../src/data/chronicles.js';
import { exportState } from '../src/core/persist.js';
import { deriveSubgenres, buildSyncEdges, syncDefaults, enrichmentQueue } from '../src/core/sync.js';
import { workKey } from '../src/core/library.js';

const cfg0 = plainSettings(), T0 = Date.UTC(2026, 9, 12, 12), DAY = 864e5;
const fast = { 'sync.delayMs.musicbrainz': 0, 'sync.delayMs.listenbrainz': 0, 'sync.delayMs.lastfm': 0, 'sync.delayMs.discogs': 0, 'sync.delayMs.wikidata': 0 };
const base = () => ({ works: WORKS.map((w) => ({ ...w })), edges: EDGES, subgenres: SUBGENRES, chronicles: CHRONICLES });

// ------------------------------------------------------------------ parsers
test('parsers: ListenBrainz, Last.fm and Discogs pages become records; Discogs merges pressings and cleans names', () => {
  const lb = P.parseListenBrainzGroups(F.lbPage); assert.equal(lb.items.length, 2); assert.equal(lb.items[0].mbid, 'rg-illmatic'); assert.equal(lb.total, 2);
  assert.deepEqual(P.parseListenBrainzGroups(null).items, []);
  const lf = P.parseLastfmTopAlbums(F.lastfmPage); assert.equal(lf.items[0].listens, 12); assert.equal(lf.items[0].mbid, null); assert.deepEqual(lf.items[0].artistMbids, ['a-nas']);
  const d = P.parseDiscogsCollection(F.discogsPage); assert.equal(d.items.length, 2, 'two pressings of master 500 merge');
  const ill = d.items.find((x) => x.sourceId === 'm500'); assert.equal(ill.rating, 4); assert.equal(ill.year, 1996);
  assert.equal(d.items.find((x) => x.title === 'Solo Thing').artist, 'Someone', 'Discogs "(2)" suffix removed');
});

test('parsers: MusicBrainz release group, earliest official release, credits, samples, artist, area', () => {
  const rg = P.parseReleaseGroup(F.mbRg['rg-illmatic']);
  assert.equal(rg.year, 1994); assert.equal(rg.artist, 'Nas'); assert.deepEqual(rg.artistMbids, ['a-nas']); assert.equal(rg.genres[0].name, 'hip hop');
  assert.equal(P.pickRelease(rg.releases), 'rel-first', 'official beats bootleg and earliest wins');
  assert.equal(P.pickRelease([{ id: 'x', date: '', status: 'official' }, { id: 'y', date: '1999', status: 'official' }]), 'y');
  const rel = P.parseRelease(F.mbRelease, cfg0);
  assert.deepEqual(rel.credits.producers, ['DJ Premier'], 'engineer not counted, duplicate producer merged case-insensitively');
  assert.deepEqual(rel.credits.players, ['Olu Dara · trumpet']);
  assert.deepEqual(rel.recordings, ['rec-1']); assert.equal(rel.sampleRels[0].to, 'rec-sampled'); assert.equal(rel.sampleRels[0].from, 'rec-1');
  const a = P.parseArtist(F.mbArtist, cfg0);
  assert.equal(a.beginArea.id, 'area-nyc'); assert.equal(a.wikidata, 'Q1'); assert.deepEqual(a.rels.map((r) => r.mbid), ['a-new'], 'only configured relation types');
  assert.deepEqual(P.parseArea(F.mbArea), { id: 'area-nyc', name: 'New York', type: 'City', wikidata: 'Q60' });
  assert.equal(P.parseReleaseGroup(null), null); assert.equal(P.parseArtist({}, cfg0), null);
  assert.equal(P.parseSearch(F.mbSearchHit)[0].score, 100);
});

test('parsers: Wikidata coordinates and influence, popularity, Last.fm similar', () => {
  const wd = P.parseWikidata(F.wikidata, cfg0); assert.equal(wd.Q60.lat, 40.7); assert.deepEqual(wd.Q1.influencedBy, ['Q2']); assert.equal(wd.Q2.lat, null);
  assert.deepEqual(P.parsePopularity(F.popularity), { 'rg-illmatic': { listens: 100000, listeners: 30000 } });
  assert.deepEqual(P.parseLastfmSimilar(F.lastfmSimilar).map((x) => x.match), [0.8, 0.1]);
  assert.equal(P.qidFromUrl('https://www.wikidata.org/wiki/Q42'), 'Q42'); assert.equal(P.qidFromUrl('nope'), null);
});

// ------------------------------------------------------------------ http client
test('http: spaces requests per host, retries 429 using Retry-After, treats 204 and allowed 404 as null', async () => {
  let clock = 0; const sleeps = [];
  const cfg = plainSettings({ ...fast, 'sync.delayMs.musicbrainz': 1100 });
  let n = 0;
  const f = F.fakeFetch([[/musicbrainz/, () => ({ json: { ok: ++n } })], [/limited/, () => (n++ < 1 ? { status: 429, headers: { 'Retry-After': '5' } } : { json: { done: 1 } })], [/empty/, () => ({ status: 204 })], [/gone/, () => ({ status: 404 })]]);
  const http = createHttp({ cfg, fetchFn: f, now: () => clock, sleep: async (ms) => { sleeps.push(ms); clock += ms; } });
  await http.request('musicbrainz', 'https://musicbrainz.org/a'); await http.request('musicbrainz', 'https://musicbrainz.org/b'); await http.request('musicbrainz', 'https://musicbrainz.org/c');
  assert.ok(sleeps.filter((s) => s >= 1100).length === 2, 'second and third request each wait 1.1 s: ' + sleeps);
  n = 0; assert.deepEqual(await http.request('discogs', 'https://x/limited'), { done: 1 });
  assert.equal(await http.request('listenbrainz', 'https://x/empty'), null);
  assert.equal(await http.request('musicbrainz', 'https://x/gone', { allow404: true }), null);
  await assert.rejects(http.request('musicbrainz', 'https://x/gone'), (e) => e.kind === 'http' && e.status === 404);
});

test('http: errors are classified, proxy template wraps the url, abort stops', async () => {
  const cfg = plainSettings({ ...fast, 'sync.retries': 1, 'sync.proxyTemplate': 'https://proxy.example/?u={url}' });
  const f = F.fakeFetch([[/auth/, () => ({ status: 401 })], [/rate/, () => ({ status: 429 })], [/offline/, () => ({ throw: new TypeError('Failed to fetch') })], [/badjson/, () => ({ badJson: true })], [/.*/, () => ({ json: {} })]]);
  const http = createHttp({ cfg, fetchFn: f, now: () => 0, sleep: async () => {} });
  await assert.rejects(http.request('discogs', 'https://x/auth'), (e) => e.kind === 'auth');
  await assert.rejects(http.request('discogs', 'https://x/rate'), (e) => e.kind === 'rate');
  await assert.rejects(http.request('discogs', 'https://x/offline'), (e) => e.kind === 'network' && /CORS/.test(e.message));
  await assert.rejects(http.request('discogs', 'https://x/badjson'), (e) => e.kind === 'parse');
  await http.request('discogs', 'https://x/ok?a=1'); assert.equal(f.calls.at(-1).url, 'https://proxy.example/?u=' + encodeURIComponent('https://x/ok?a=1'));
  const ac = new AbortController(); ac.abort();
  await assert.rejects(http.request('discogs', 'https://x/ok', { signal: ac.signal }), (e) => e.kind === 'aborted');
});

test('accounts: stored apart from settings and the save, so exports never contain a token', () => {
  const store = new Map(), storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const acc = {}; setAccountField(acc, 'lastfm', 'apiKey', ' SECRET-KEY '); setAccountField(acc, 'lastfm', 'username', 'me'); saveAccounts(storage, acc);
  assert.equal(loadAccounts(storage).lastfm.apiKey, 'SECRET-KEY'); assert.ok(store.has(ACCOUNTS_KEY));
  setAccountField(acc, 'lastfm', 'username', ''); assert.equal(acc.lastfm.username, undefined);
  const { game } = mk(); assert.ok(!exportState(game.state).includes('SECRET-KEY'));
  const settings = plainSettings(); assert.ok(!JSON.stringify(settings.all()).includes('SECRET-KEY'));
  assert.ok(!Object.keys(settings.all()).some((k) => /^(data|sync)\./.test(k) && /(Token|Key)$/.test(k)), 'no credential settings exist');
});

// ------------------------------------------------------------------ import
function mk(over = {}, clock = { t: T0 }) {
  const cfg = plainSettings({ ...fast, ...over });
  const game = createGame({ base: base(), cfg, now: () => clock.t, rand: () => 0 });
  return { game, cfg, clock };
}

test('import: matches by title ignoring edition brackets, adds new works unrated, awards no XP', () => {
  const { game } = mk();
  const recs = P.parseListenBrainzGroups(F.lbPage).items;
  const r = game.importRecords(recs, 'listenbrainz');
  assert.equal(r.matched.length, 1); assert.equal(r.added.length, 1);
  assert.equal(game.state.xp, 0); assert.equal(game.state.points, 0);
  const added = game.state.added.find((w) => w.artist === 'Test Artist');
  assert.equal(added.mbid, 'rg-new'); assert.equal(game.state.works[added.id].heard, true); assert.equal(game.state.works[added.id].rating, 0);
  assert.equal(game.state.facts.ill.mbid, 'rg-illmatic', 'source-supplied id is kept on the matched starter work');
  assert.ok(game.pendingWorks().some((w) => w.id === added.id), 'no recognisable genre yet, so it waits for a family');
  assert.ok(!game.works().some((w) => w.id === added.id));
  assert.match(game.rate(added.id, 8).reason, /genre family/);
});

test('import: Discogs ratings scale to 1-10, no rating is invented, undated imports get the configured recency', () => {
  const { game, clock } = mk({ 'sync.unknownRecencyDays': 100 });
  game.importRecords(P.parseDiscogsCollection(F.discogsPage).items, 'discogs');
  const solo = game.state.added.find((w) => w.title === 'Solo Thing');
  assert.equal(game.state.works[solo.id].rating, 10, '5 stars x 2');
  const ill = game.state.works.ill; assert.equal(ill.rating, 9, 'existing rating is not overwritten'); // seed rating stays
  const { game: g2 } = mk({ 'sync.importRatings': false }); g2.importRecords(P.parseDiscogsCollection(F.discogsPage).items, 'discogs');
  assert.equal(g2.state.works[g2.state.added.find((w) => w.title === 'Solo Thing').id].rating, 0);
  const lf = mk({ 'sync.unknownRecencyDays': 100 }); lf.game.importRecords([{ source: 'lastfm', title: 'Nothing Known', artist: 'Nobody', listens: 3, genres: [{ name: 'jazz', count: 1 }] }], 'lastfm');
  const w = lf.game.works().find((x) => x.title === 'Nothing Known'); assert.ok(Math.abs(w.daysAgo - 100) < 0.01);
  void clock;
});

test('import: respects the cap, skips records without title or artist, can add as unheard', () => {
  const { game } = mk({ 'sync.maxImport': 2 });
  const recs = [1, 2, 3, 4].map((i) => ({ source: 'lastfm', title: 'T' + i, artist: 'A' + i, genres: [{ name: 'rock', count: 1 }] }));
  const r = game.importRecords([{ title: '', artist: 'x' }, ...recs], 'lastfm'); assert.equal(r.added.length, 2); assert.equal(r.skipped, 1); assert.equal(r.cappedAt, 2);
  const g2 = mk().game; g2.importRecords([recs[0]], 'lastfm', { asHeard: false });
  assert.equal(g2.works().find((w) => w.title === 'T1').heard, false); assert.ok(g2.state.scouted.length === 1);
});

// ------------------------------------------------------------------ facts overlay
test('overlay: verified facts replace remembered year, credits and place; unverified starter works are flagged', () => {
  const { game } = mk();
  const before = game.works().find((w) => w.id === 'ill'); assert.equal(before.verified, false); assert.equal(before.source, 'seed'); assert.ok(before.credits.producers.length > 0 && before.place);
  const st = game.state, t = T0;
  st.facts.ill = { steps: { rg: t, credits: t }, genres: [{ name: 'hip hop', count: 3 }], tags: [], artistMbids: ['a-nas'], mbid: 'rg-illmatic', year: 1993, title: 'Illmatic', artist: 'Nas', credits: { producers: [], players: [] }, sampleRels: [] };
  st.artists['a-nas'] = { mbid: 'a-nas', area: null, beginArea: { id: 'nowhere', name: 'Unknown' }, steps: { artist: t, place: t } };
  const after = game.works().find((w) => w.id === 'ill');
  assert.equal(after.verified, true); assert.equal(after.year, 1993);
  assert.deepEqual(after.credits.producers, [], 'remembered credits are dropped, not kept alongside');
  assert.equal(after.place, undefined, 'remembered place dropped when the source has none');
});

test('overlay: reclassify from verified genres, but a hand-picked family stays', () => {
  const { game } = mk();
  game.importRecords([{ source: 'listenbrainz', title: 'Mystery', artist: 'Someone', mbid: 'rg-m' }], 'listenbrainz');
  const id = game.state.added[0].id; assert.ok(game.pendingWorks().length === 1);
  game.state.facts[id] = { steps: { rg: T0 }, genres: [{ name: 'techno', count: 5 }], tags: [], artistMbids: [], mbid: 'rg-m', year: 2001 };
  assert.deepEqual(Object.keys(game.works().find((w) => w.id === id).fam), ['4']);
  assert.ok(game.setFamilies(id, { 5: 1 }).ok); assert.deepEqual(Object.keys(game.works().find((w) => w.id === id).fam), ['5'], 'pinned');
  assert.ok(!game.setFamilies('ill', { 0: 1 }).ok);
});

test('policy: hiding the unverified starter catalogue removes unheard starter works, starter edges and chronicles', () => {
  const { game } = mk({ 'sync.unverifiedSeed': 'hide' });
  const ids = new Set(game.works().map((w) => w.id));
  assert.ok(ids.has('ill') && !ids.has('hr'), 'heard starter works stay, unheard ones go');
  assert.equal(game.edges().length, 0);
  assert.equal(game.chronicles().length, 0, 'a chronicle needs all of its works');
  assert.equal(game.board().chronicles.length, 0);
});

test('subgenres: verified genres carried by enough works become charters; family words are skipped', () => {
  const mkw = (id, genres, fam = { 0: 1 }) => ({ id, genres, fam });
  const ws = [mkw('a', ['hip hop', 'jazz rap']), mkw('b', ['jazz rap']), mkw('c', ['jazz rap', 'boom bap']), mkw('d', ['boom bap'])];
  const subs = deriveSubgenres(ws, cfg0);
  assert.deepEqual(subs.map((s) => s.name), ['jazz rap'], 'boom bap has only 2 works; hip hop is a family word');
  assert.deepEqual(subs[0].parents, ['hiphop']); assert.equal(subs[0].id, 'g:jazz-rap');
  assert.equal(deriveSubgenres(ws, plainSettings({ 'sync.subgenreMinWorks': 2 })).length, 2);
});

test('edges: built only from sourced relations; samples need two known, different years', () => {
  const st = { ...syncDefaults() };
  const w = (id, artist, year, mbids) => ({ id, artist, year, heard: true });
  const works = [w('n1', 'Nas', 1994, ['a-nas']), w('n2', 'Nas', 2012, ['a-nas']), w('t1', 'Test Artist', 2000, ['a-new']), w('s1', 'Sampler', 1996), w('s2', 'Source', 1980), w('s3', 'Same', 1996)];
  st.facts = { n1: { artistMbids: ['a-nas'], steps: {} }, n2: { artistMbids: ['a-nas'], steps: {} }, t1: { artistMbids: ['a-new'], steps: {} },
    s1: { artistMbids: [], steps: {}, sampleRels: [{ from: 'r1', to: 'r2' }, { from: 'r1', to: 'r3' }], recordings: ['r1'] }, s2: { artistMbids: [], steps: {}, recordings: ['r2'] }, s3: { artistMbids: [], steps: {}, recordings: ['r3'] } };
  st.artists = { 'a-nas': { mbid: 'a-nas', wikidata: 'Q1', rels: [{ type: 'collaboration', mbid: 'a-new' }], similar: [{ mbid: 'a-new', name: 'Test Artist', match: 0.8 }, { mbid: 'a-weak', name: 'Weak', match: 0.1 }], steps: {} }, 'a-new': { mbid: 'a-new', wikidata: 'Q9', rels: [], steps: {} } };
  st.wd = { Q1: { influencedBy: ['Q9'] } };
  const r = buildSyncEdges(st, works, cfg0);
  const by = (type) => st.syncEdges.filter((e) => e.type === type);
  assert.equal(by('personnel').length, 1); assert.equal(by('other').length, 1, 'weak similarity ignored');
  const infl = by('influence')[0]; assert.equal(infl.a, 't1', 'influencer first'); assert.equal(infl.b, 'n2', 'the influenced artist\'s nearest work that is not earlier than the influencer');
  assert.equal(by('sample').length, 1); assert.deepEqual([by('sample')[0].a, by('sample')[0].b], ['s2', 's1'], 'earlier work first'); assert.equal(r.skippedSamples, 1);
});

// ------------------------------------------------------------------ engine, against a fake network
function rig(over = {}, extra = [], accounts = { listenbrainz: { username: 'me' }, lastfm: { username: 'me', apiKey: 'k' } }) {
  const m = mk(over), f = network(extra), http = createHttp({ cfg: m.cfg, fetchFn: f, now: () => 0, sleep: async () => {} });
  return { ...m, f, accounts, engine: createEngine({ game: m.game, accounts, cfg: m.cfg, http, now: () => m.clock.t }) };
}

test('engine: import from ListenBrainz, then verify fills genres, year, credits, artist, place, tier and connections', async () => {
  const { game, engine, f } = rig();
  const imp = await engine.importFrom('listenbrainz'); assert.ok(imp.ok); assert.equal(imp.added, 1); assert.equal(imp.matched, 1);
  const sum = await engine.verify(); assert.ok(sum.ok, JSON.stringify(sum)); assert.equal(sum.failed, 0);
  const ill = game.works().find((w) => w.id === 'ill');
  assert.equal(ill.verified, true); assert.equal(ill.year, 1994); assert.deepEqual(ill.credits.producers, ['DJ Premier']); assert.deepEqual(ill.credits.players, ['Olu Dara · trumpet']);
  assert.deepEqual(ill.credits.samples, ['Some Sampled Track']);
  assert.deepEqual(ill.place, { city: 'New York', lat: 40.7, lon: -74 }, 'begin-area, coordinates from Wikidata');
  assert.equal(ill.tier, 2, '30000 listeners sits between the cult (20000) and essential (100000) thresholds');
  assert.ok(game.state.syncEdges.some((e) => e.type === 'influence') === false, 'Q2 is not an artist in the library, so no influence edge is invented');
  assert.ok(game.state.artists['a-nas'].similar.length === 2);
  const urls = f.calls.map((c) => c.url);
  assert.ok(urls.some((u) => /inc=artist-credits\+genres\+tags\+releases/.test(u)) && urls.some((u) => /recording-level-rels/.test(u)));
});

test('engine: verification is resumable, a second run asks the services for nothing it already has', async () => {
  const { engine, f, game } = rig();
  await engine.importFrom('listenbrainz'); await engine.verify();
  const first = f.calls.length; const again = await engine.verify();
  assert.equal(again.total, 0); assert.equal(f.calls.length, first, 'no new requests: all in the save');
  assert.ok(game.state.sync.lastVerify > 0);
});

test('engine: unmatched works are recorded, not invented; failures are recorded per work and the run continues', async () => {
  const bad = [/ws\/2\/release-group\/rg-new/, () => ({ status: 500, json: { error: 'boom' } })];
  const { game, engine } = rig({}, [bad]);
  game.importRecords([{ source: 'lastfm', title: 'No Such Album', artist: 'Ghost Band', genres: [{ name: 'rock', count: 1 }] }], 'lastfm');
  await engine.importFrom('listenbrainz');
  const sum = await engine.verify();
  const ghost = game.state.added.find((w) => w.artist === 'Ghost Band');
  assert.ok(game.state.facts[ghost.id].unmatched, 'not found in MusicBrainz so left as it was');
  const w = game.works().find((x) => x.id === ghost.id); assert.equal(w.verified, false); assert.equal(w.year, null);
  assert.ok(sum.failed >= 1 && Object.keys(game.state.sync.failures).length >= 1);
  assert.ok(game.works().find((x) => x.id === 'ill').verified, 'other works still verified');
});

test('engine: the Solo Thing search match needs score, title and artist to agree', async () => {
  const { game, engine } = rig({ 'sync.matchMinScore': 95 }, [], { discogs: { username: 'me' } });
  game.importRecords(P.parseDiscogsCollection(F.discogsPage).items, 'discogs');
  await engine.verify({ limit: 100 });
  const solo = game.state.added.find((w) => w.title === 'Solo Thing'); assert.equal(game.state.facts[solo.id]?.mbid, 'rg-found'); assert.equal(game.state.facts[solo.id].match.score, 100);
  const strict = rig({ 'sync.matchMinScore': 100 }); strict.game.importRecords([{ source: 'discogs', title: 'Solo Thing', artist: 'Different Person' }], 'discogs');
  await strict.engine.verify({ limit: 100 });
  assert.ok(strict.game.state.facts[strict.game.state.added[0].id].unmatched, 'artist disagrees, so no match');
});

test('engine: cancel stops the run, three network failures in a row abort it, auth failure stops it with the message', async () => {
  const off = rig({}, [[/ws\/2\//, () => ({ throw: new TypeError('Failed to fetch') })]]);
  await off.engine.importFrom('listenbrainz'); const s = await off.engine.verify({ scope: 'all', limit: 10 });
  assert.equal(s.ok, false); assert.match(s.message, /CORS|offline/);
  const denied = rig({}, [[/ws\/2\//, () => ({ status: 401 })]]); await denied.engine.importFrom('listenbrainz');
  const s2 = await denied.engine.verify(); assert.equal(s2.ok, false); assert.match(s2.message, /refused/);
  const slow = rig(); await slow.engine.importFrom('listenbrainz'); const p = slow.engine.verify(); slow.engine.cancel(); const s3 = await p; assert.equal(s3.stopped, true);
  assert.equal(slow.engine.running, false);
});

test('engine: missing account fields are reported before any request; discography skips what is already in the library', async () => {
  const { engine, f, game } = rig({}, [[/release-group\?artist=a-nas/, () => ({ json: { 'release-groups': [{ id: 'rg-illmatic', title: 'Illmatic', 'primary-type': 'Album', 'secondary-types': [], 'artist-credit': [{ name: 'Nas', artist: { id: 'a-nas' } }], 'first-release-date': '1994' }, { id: 'rg-two', title: 'It Was Written', 'primary-type': 'Album', 'secondary-types': [], 'artist-credit': [{ name: 'Nas', artist: { id: 'a-nas' } }], 'first-release-date': '1996' }, { id: 'rg-live', title: 'Live Thing', 'primary-type': 'Album', 'secondary-types': ['Live'], 'artist-credit': [{ name: 'Nas', artist: { id: 'a-nas' } }], 'first-release-date': '2000' }] } })]], { discogs: {} });
  const r = await engine.importFrom('discogs'); assert.equal(r.ok, false); assert.match(r.message, /username/); assert.equal(f.calls.length, 0);
  assert.equal((await engine.discography('ill')).ok, false, 'artist unknown until verified');
  game.state.facts.ill = { steps: { rg: 1 }, genres: [], tags: [], artistMbids: ['a-nas'], mbid: 'rg-illmatic', title: 'Illmatic', artist: 'Nas' };
  const d = await engine.discography('ill'); assert.deepEqual(d.records.map((x) => x.title), ['It Was Written']);
  const res = game.importRecords(d.records, 'musicbrainz', { asHeard: false }); assert.equal(res.added.length, 1);
});

test('queue: heard works first; steps follow the settings; works without a match target use search first', () => {
  const { game, cfg } = mk({ 'sync.fetchCredits': false, 'sync.fetchArtists': false });
  const q = enrichmentQueue(game.state, game.works(), cfg, 'all'); assert.ok(q[0].heard && q.every((x) => x.steps.length === 1 && x.steps[0] === 'match'));
  assert.equal(workKey('Nas', 'Illmatic (Deluxe Edition)', cfg), workKey('NAS', 'Illmatic', cfg));
  assert.notEqual(workKey('Nas', 'Illmatic (Live)', cfg), workKey('Nas', 'Illmatic', cfg), 'only edition words are stripped');
});
