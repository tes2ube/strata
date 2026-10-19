import test from 'node:test';
import assert from 'node:assert/strict';
import { plainSettings } from '../src/settings/store.js';
import { createGame, freshState } from '../src/core/game.js';
import { WORKS, EDGES, SUBGENRES } from '../src/data/seed.js';
import { CHRONICLES } from '../src/data/chronicles.js';
import { layout } from '../src/core/layout.js';
import { makeSimilarity, predictRating } from '../src/core/recs.js';
import { periodKey } from '../src/core/quests.js';
import { familiesFromTags, tierFromListeners } from '../src/core/library.js';
import { tasteSignature } from '../src/core/stats.js';
import { viewLayout, creditEdges } from '../src/core/views.js';
import { loadState, saveState, exportState, importState, STATE_KEY } from '../src/core/persist.js';

const DAY = 864e5, T0 = Date.UTC(2026, 9, 12, 12);
const base = { works: WORKS.map((w) => ({ ...w })), edges: EDGES, subgenres: SUBGENRES, chronicles: CHRONICLES };
function mk(over = {}, clock = { t: T0 }) {
  const cfg = plainSettings(over);
  const game = createGame({ base, cfg, now: () => clock.t, rand: () => 0 });
  return { game, cfg, clock };
}

test('rate: first rating earns XP, a quick re-rate earns none, a late re-rate earns re-rate XP', () => {
  const { game, clock } = mk();
  const r = game.rate('pif', 8); assert.ok(r.ok && r.xp > 0);
  const again = game.rate('pif', 9); assert.equal(again.xp, 0);
  clock.t += 61 * DAY;
  const late = game.rate('pif', 7); assert.ok(late.xp > 0 && late.isReRate);
});

test('rate: leap bonus for the first work in a never-rated family', () => {
  const { game, cfg } = mk();
  const jazz = game.rate('kb', 8), another = game.rate('bb', 8);
  assert.ok(jazz.firstInFamily && !another.firstInFamily);
  assert.ok(jazz.baseXp >= cfg.get('xp.leapBase'));
});

test('rate: points follow XP and levels can rise', () => {
  const { game } = mk({ 'xp.levelBase': 10 });
  const r = game.rate('kb', 9);
  assert.ok(game.state.points > 0);
  assert.ok(r.events.some((e) => e.type === 'levelUp'));
});

test('rate: daily XP cap truncates', () => {
  const { game } = mk({ 'xp.dailyXpCap': 30 });
  game.rate('kb', 9); game.rate('bb', 9);
  assert.ok(game.state.dayXp.xp <= 30);
});

test('threads: rating along a line extends one thread and a jump elsewhere pauses it', () => {
  const { game } = mk();
  game.rate('sj', 8);                       // start
  const a = game.rate('tf', 8);             // sj -> tf influence
  assert.equal(a.thread.links, 1);
  const b = game.rate('let', 8);            // tf -> let influence (but let is already heard in seed)
  assert.ok(b.xp === 0);                    // let was heard already
  const c = game.rate('kb', 8);             // jump: no thread, nothing resets
  assert.equal(c.thread, null);
  const t = game.threads();
  assert.ok(t.length >= 1 && t.find((x) => x.links === 1));
});

test('threads: chain bonus grows with links and a thread keeps its length after a jump', () => {
  const { game } = mk();
  game.rate('ra', 8);                       // punk seed
  game.rate('nm', 8);                       // ra -> nm
  const third = game.rate('cl', 8);         // nm contemporary cl, different kind: starts its own thread
  assert.ok(third.thread);
  game.rate('kb', 8);
  const lens = game.threads().map((x) => x.links);
  assert.ok(lens.includes(1));
});

test('chronicles: finishing the story pays once and grants lens charges', () => {
  const { game, cfg } = mk();
  const lensBefore = game.state.charges.lens; let done = null;
  for (const id of CHRONICLES.find((c) => c.id === 'berlin').works) { const r = game.rate(id, 8); done ||= r.events.find((e) => e.type === 'chronicleDone'); }
  assert.ok(done);
  assert.equal(game.state.charges.lens - lensBefore, cfg.get('quests.chronicleLensCharges'));
  assert.equal(game.chroniclesDone(), 1);
  const again = game.rate('low', 9); assert.ok(!again.events.some((e) => e.type === 'chronicleDone'));
});

test('chronicles: begin scouts the works so they become visible', () => {
  const { game } = mk();
  const L = layout({ works: game.works(), edges: game.edges(), cfg: plainSettings() });
  const hidden = CHRONICLES.find((c) => c.id === 'berlin').works.filter((id) => !game.visibility(L.hex, L.lattice).visible.has(id));
  assert.ok(hidden.length > 0, 'some berlin works start in the fog');
  assert.ok(game.beginChronicle('berlin').ok);
  const vis = game.visibility(L.hex, L.lattice).visible;
  assert.ok(hidden.every((id) => vis.has(id)));
  assert.ok(!game.beginChronicle('berlin').ok);
});

test('repeatables: blind spot, gateway and re-listen complete and then wait for their period', () => {
  const { game, clock } = mk();
  const first = game.rate('to', 8);         // jazz mainstream, jazz never visited and tier 0
  const ids = first.events.filter((e) => e.type === 'questDone').map((e) => e.id);
  assert.ok(ids.includes('blindSpot') && ids.includes('weeklyGateway'));
  const second = game.rate('mi', 8);
  assert.ok(!second.events.some((e) => e.id === 'weeklyGateway'), 'weekly gateway done for this week');
  clock.t += 8 * DAY;
  const nextWeek = game.rate('al', 8);
  assert.ok(nextWeek.events.some((e) => e.id === 'weeklyGateway') || game.board().repeatables.find((r) => r.id === 'weeklyGateway'));
  const rl = game.rate('ill', 9); // heard 0 days ago in seed: too soon
  assert.equal(rl.xp, 0);
  clock.t += 70 * DAY;
  const re = game.rate('ill', 8);
  assert.ok(re.events.some((e) => e.id === 'reListen'));
});

test('quest period keys: weekly rolls on the reset day, monthly on the reset day of month', () => {
  const cfg = plainSettings({ 'quests.weeklyResetDay': 1 });
  const mon = Date.UTC(2026, 9, 12), sun = Date.UTC(2026, 9, 11), nextMon = Date.UTC(2026, 9, 19);
  assert.equal(periodKey('weekly', mon, cfg), periodKey('weekly', mon + 3 * DAY, cfg));
  assert.notEqual(periodKey('weekly', sun, cfg), periodKey('weekly', mon, cfg));
  assert.notEqual(periodKey('weekly', mon, cfg), periodKey('weekly', nextMon, cfg));
  assert.equal(periodKey('monthly', Date.UTC(2026, 9, 5), cfg), periodKey('monthly', Date.UTC(2026, 9, 28), cfg));
});

test('foundations: finishing a genre set pays XP once', () => {
  const { game } = mk({ 'quests.foundationsSize': 3 });
  const set = game.board().foundations.find((f) => f.fam === 'jazz');
  assert.equal(set.total, 3);
  let got = 0;
  for (const id of set.ids) { const r = game.rate(id, 8); got += r.events.filter((e) => e.type === 'foundationsDone').length; }
  assert.equal(got, 1);
});

test('shop: points gate purchases, prerequisites hold, owning is permanent', () => {
  const { game } = mk();
  assert.ok(!game.buy('creditsLens').ok);
  game.state.points = 99999;
  assert.ok(game.buy('creditsLens').ok);
  assert.ok(!game.buy('creditsLens').ok);
  assert.ok(!game.buy('wormholes').ok, 'needs chronicles');
  assert.ok(!game.buy('placeOverlay').ok, 'needs era lens');
  assert.ok(game.buy('eraLens').ok && game.buy('placeOverlay').ok);
  assert.ok(game.viewOpen('time') && game.viewOpen('place') && !game.viewOpen('credits'));
});

test('shop: charters need Foundations in the parents, family charter opens mainstream and essential', () => {
  const { game } = mk({ 'shop.charterFoundations': 2, 'quests.foundationsSize': 3 });
  game.state.points = 99999;
  assert.ok(!game.buy('sub:punk').ok);
  for (const id of game.board().foundations.find((f) => f.fam === 'rock').ids.slice(0, 2)) game.rate(id, 8);
  assert.ok(game.buy('sub:punk').ok);
  assert.ok(game.state.charters.sub.punk);
  assert.ok(game.buy('family:ambient').ok && game.state.charters.family.ambient);
});

test('shop: time gates stretch big unlocks apart when on', () => {
  const { game, clock } = mk({ 'shop.unlockTimeGates': true, 'shop.minDaysBetweenBigUnlocks': 7, 'shop.wormholesChronicles': 0, 'shop.personnelChronicles': 0 });
  game.state.points = 99999; game.buy('creditsLens');
  assert.ok(game.buy('wormholes').ok);
  assert.ok(!game.buy('personnelGraph').ok);
  clock.t += 8 * DAY;
  assert.ok(game.buy('personnelGraph').ok);
});

test('consumables: packs add charges, flare lifts fog, roll scouts one rarer work, dowse points at a likely favourite', () => {
  const { game } = mk();
  game.state.points = 99999;
  for (const id of ['lensPack', 'flarePack', 'dowsePack', 'rollPack']) assert.ok(game.buy(id).ok);
  assert.equal(game.state.charges.flare, 4);
  const L = layout({ works: game.works(), edges: game.edges(), cfg: plainSettings() });
  const before = game.visibility(L.hex, L.lattice).visible.size;
  assert.ok(game.useFlare(L.hex.sj).ok);
  assert.ok(game.visibility(L.hex, L.lattice).visible.size > before);
  const roll = game.useRoll(); assert.ok(roll.ok && game.state.scouted.includes(roll.id));
  assert.ok(!game.useRoll().ok);
  const d = game.useDowse(L.hex.ill, L.hex, L.lattice);
  assert.ok(d.ok ? d.predicted >= 8 : d.reason);
});

test('credits: lens required, reveal spends a charge, secondary credits go free after enough lookups', () => {
  const { game } = mk({ 'shop.secondaryCreditsUses': 2 });
  assert.ok(!game.revealCredit('ill', 'producers').ok);
  game.state.points = 500; game.buy('creditsLens');
  const c0 = game.state.charges.lens;
  assert.ok(game.revealCredit('ill', 'producers').ok);
  assert.equal(game.state.charges.lens, c0 - 1);
  assert.ok(game.credits('ill').sections[0].open);
  assert.ok(game.revealCredit('low', 'producers').ok);
  assert.ok(game.credits('ill').sections[1].open, 'players free after two lookups');
  const before = game.state.charges.lens;
  assert.ok(game.revealCredit('let', 'players').ok);
  assert.equal(game.state.charges.lens, before, 'free secondary credits cost no charge');
});

test('grow: follows relations, respects wormholes, marks credit-scouted works for the credit-hop bonus', () => {
  const { game } = mk();
  const g1 = game.grow('ill', 'inspired');
  assert.ok(g1.ok && g1.shown.length > 0);
  const cross = game.growCandidates('tee', 'inspired');
  assert.equal(cross.filter((w) => w.id === 'ram').length, 1, 'electronic to funk/pop/electronic shares a family');
  const none = game.growCandidates('sc', 'inspired').map((w) => w.id);
  assert.ok(none.includes('gk'));
  const c = game.grow('low', 'credit', 'Brian Eno'); assert.ok(c.ok);
  const id = c.shown[0]; assert.equal(game.state.via[id], 'credit');
  const plain = mk().game, viaR = game.rate(id, 8), noVia = plain.rate(id, 8);
  assert.ok(viaR.baseXp > noVia.baseXp);
});

test('add work: classify tags, tier from popularity, auto-link, duplicates refused, heard work earns XP', () => {
  const { game, cfg } = mk();
  assert.deepEqual(Object.keys(familiesFromTags(['boom bap', 'hip hop', 'jazz'], cfg)).sort(), ['0', '6']);
  assert.equal(familiesFromTags(['polka'], cfg), null);
  assert.equal(tierFromListeners(5e6, cfg), 0); assert.equal(tierFromListeners(10, cfg), 5); assert.equal(tierFromListeners(null, cfg), cfg.get('data.defaultTier'));
  const r = game.addWork({ title: 'Madvillainy', artist: 'Madvillain', year: 2004, tags: ['hip hop', 'underground hip hop'], listeners: 5000, heard: true, rating: 9 });
  assert.ok(r.ok && r.rate.xp > 0 && r.links > 0);
  assert.ok(game.works().find((w) => w.id === r.id).heard);
  assert.ok(!game.addWork({ title: 'Madvillainy', artist: 'MADVILLAIN', year: 2004, fam: { 0: 1 } }).ok);
  assert.ok(!game.addWork({ title: 'X', artist: 'Y', year: 2000, tags: ['polka'] }).ok);
});

test('recs: prediction sits near ratings of similar works', () => {
  const cfg = plainSettings(), sim = makeSimilarity(EDGES, cfg), ws = WORKS.map((w) => ({ ...w, heard: w.heard }));
  const heard = ws.filter((w) => w.heard), rd = ws.find((w) => w.id === 'rd'), ko = ws.find((w) => w.id === 'ko');
  assert.ok(sim(rd, ws.find((w) => w.id === 'ill')) > sim(rd, ws.find((w) => w.id === 'kb')));
  const p = predictRating(rd, heard, sim, cfg); assert.ok(p > 6 && p <= 10);
  assert.equal(predictRating(ko, [], sim, cfg), null);
});

test('surprise XP: a rating far from the prediction pays more', () => {
  const a = mk().game, b = mk().game;
  const pred = a.predicted('rd');
  const calm = a.rate('rd', Math.round(pred)), shock = b.rate('rd', 1);
  assert.ok(shock.baseXp > calm.baseXp || shock.baseXp >= calm.baseXp);
});

test('taste signature: six axes in range, dashed baseline excludes recent ratings', () => {
  const { game, clock, cfg } = mk();
  const sig = game.taste().now; assert.equal(sig.length, 6); for (const v of sig) assert.ok(v >= 0 && v <= 1);
  const before = JSON.stringify(game.taste().before);
  clock.t += 40 * DAY; game.rate('kb', 10); game.rate('bb', 10);
  const t = game.taste();
  assert.notEqual(JSON.stringify(t.now), JSON.stringify(t.before));
  assert.equal(tasteSignature([], cfg), null);
  assert.ok(before);
});

test('slots: off by default, when on the shelf stays free but placement costs and refunds', () => {
  const { game } = mk();
  assert.equal(game.slots().enabled, false);
  const on = mk({ 'slots.enabled': true, 'slots.initial': 24 }).game;
  assert.equal(on.slots().capacity >= 24, true);
  const used = on.slots().used;
  on.rate('kb', 8); assert.equal(on.slots().used, used + 1);
  on.unplace('kb'); assert.equal(on.slots().used, used);
  const tight = mk({ 'slots.enabled': true, 'slots.initial': 0 }).game;
  tight.state.placed = [];
  assert.ok(!tight.place('kb').ok);
});

test('rested XP: time away banks a pool that is spent on ratings', () => {
  const clock = { t: T0 }, cfg = plainSettings();
  const g1 = createGame({ base, cfg, now: () => clock.t });
  const saved = JSON.parse(JSON.stringify(g1.state));
  clock.t += 10 * DAY;
  const g2 = createGame({ base, cfg, state: saved, now: () => clock.t });
  assert.ok(g2.state.rested >= 99);
  const r = g2.rate('kb', 8);
  const g3 = createGame({ base, cfg, now: () => clock.t }); const plain = g3.rate('kb', 8);
  assert.ok(r.baseXp > plain.baseXp);
});

test('views: time lays works by year in family lanes, place hides works without a city, credits pull shared names together', () => {
  const cfg = plainSettings(), ws = WORKS.map((w) => ({ ...w }));
  const t = viewLayout({ view: 'time', works: ws, edges: EDGES, cfg });
  assert.ok(t.pos.kb.x < t.pos.gk.x, '1959 sits left of 2012');
  assert.equal(new Set(Object.values(t.hex).map((h) => h.q + ',' + h.r)).size, ws.length);
  const noPlace = ws.map((w) => (w.id === 'sl' ? w : w));
  const p = viewLayout({ view: 'place', works: noPlace, edges: EDGES, cfg });
  assert.ok(p.hidden.has('sl') && !p.hidden.has('ill'));
  assert.ok(creditEdges(ws, cfg).some((e) => [e.a, e.b].includes('low') && [e.a, e.b].includes('hr')));
  const c = viewLayout({ view: 'credits', works: ws, edges: EDGES, cfg });
  const L = c.lattice, d = (a, b) => L.dist(c.hex[a], c.hex[b]);
  assert.ok(d('low', 'hr') <= 3);
});

test('persistence: save and load round trip, v1 saves migrate, export and import', () => {
  const store = new Map(), storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const { game, cfg } = mk(); game.rate('kb', 8);
  assert.ok(saveState(storage, game.state, cfg));
  const baseState = game.state;
  const loaded = loadState(storage, baseState); assert.equal(loaded.xp, game.state.xp);
  storage.setItem('strata.state.v1', JSON.stringify({ xp: 55, points: 4, chain: 2, works: { kb: { heard: true, rating: 9, last: 1 } } })); store.delete(STATE_KEY);
  const mig = loadState(storage, game.state); assert.equal(mig.xp, 55); assert.ok(Array.isArray(mig.threads));
  assert.equal(importState(exportState(game.state), game.state).xp, game.state.xp);
  assert.throws(() => importState('{"a":1}', game.state));
});

test('fog extras: scouted works and charters show up, flares lift fog', () => {
  const cfg = plainSettings();
  const g = mk().game, L = layout({ works: g.works(), edges: g.edges(), cfg });
  g.state.scouted.push('up'); assert.ok(g.visibility(L.hex, L.lattice).visible.has('up'));
});
