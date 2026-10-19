import test from 'node:test';
import assert from 'node:assert/strict';
import { plainSettings } from '../src/settings/store.js';
import { SETTINGS } from '../src/settings/definitions.js';
import { ratingFromFraction } from '../src/core/rating.js';
import { makeLattice } from '../src/core/hex.js';
import { ringFraction } from '../src/core/recency.js';
import { chain, spotlight } from '../src/core/spotlight.js';
import { computeMastery, allowedTier, computeVisibility } from '../src/core/fog.js';
import { ratingXp, levelFromXp } from '../src/core/xp.js';
import { WORKS, EDGES } from '../src/data/seed.js';

const cfg = plainSettings();

test('settings: unique keys, defaults inside min/max, every key has help text', () => {
  const seen = new Set();
  for (const s of SETTINGS) {
    assert.ok(!seen.has(s.key), 'duplicate ' + s.key); seen.add(s.key);
    assert.ok(s.help && s.label, 'missing text for ' + s.key);
    if (s.type === 'number') { if (s.min != null) assert.ok(s.default >= s.min, s.key); if (s.max != null) assert.ok(s.default <= s.max, s.key); }
  }
  assert.ok(SETTINGS.length > 250);
});

test('rating bar: thirds, borders and ordering', () => {
  const at = (f) => ratingFromFraction(f, cfg);
  assert.equal(at(0.7167).label, 'light 8');
  assert.equal(at(0.75).label, 'decent 8');
  assert.equal(at(0.7833).label, 'strong 8');
  assert.equal(at(0.7333).label, 'light/decent 8');
  assert.equal(at(0.7667).label, 'decent/strong 8');
  assert.equal(at(0.8).label, 'strong 8 / light 9');
  assert.equal(at(0).label, 'light 1');
  assert.equal(at(1).label, 'strong 10');
  let prev = -Infinity;
  for (let f = 0; f <= 1; f += 0.001) { const v = at(f).value; assert.ok(v >= prev - 1e-9, 'not monotonic at ' + f); prev = v; }
});

test('hex lattice: round trip and nearest free', () => {
  const L = makeLattice(100);
  for (const [q, r] of [[0, 0], [3, -2], [-4, 5]]) { const p = L.pointOf(q, r); assert.deepEqual(L.toAxial(p.x, p.y), { q, r }); }
  const occ = new Set([L.key(0, 0)]);
  const n = L.nearestFree(1, 1, occ);
  assert.notDeepEqual([n.q, n.r], [0, 0]);
  assert.equal(L.dist({ q: 0, r: 0 }, { q: 1, r: 0 }), 1);
  assert.equal(L.dist({ q: 0, r: 0 }, { q: 2, r: -1 }), 2);
});

test('recency ring: full, half, floor', () => {
  assert.equal(ringFraction(0, cfg), 1);
  assert.ok(Math.abs(ringFraction(60, cfg) - 0.5) < 1e-9);
  assert.equal(ringFraction(5000, cfg), cfg.get('recency.minRing'));
});

test('spotlight: chain depth and relation toggles', () => {
  const types = ['precedent', 'inspired', 'contemporary', 'personnel', 'sample', 'other'];
  const c1 = chain(['ill'], EDGES, 1, new Set(types));
  assert.ok(c1.works.has('pif') && c1.works.has('rd') && c1.works.has('gk'));
  assert.ok(!c1.works.has('fs'));
  const c2 = chain(['ill'], EDGES, 2, new Set(types));
  assert.ok(c2.works.has('fs'));
  const noPrec = chain(['ill'], EDGES, 1, new Set(['inspired']));
  assert.ok(!noPrec.works.has('pif') && noPrec.works.has('rd'));
  const s = spotlight({ hoverWork: 'sm', selected: ['ill'], edges: EDGES, cfg, allTypes: types });
  assert.ok(s.works.has('sm') && s.works.has('pc') && s.works.has('ill'));
  const multi = spotlight({ selected: ['ill', 'sm'], edges: EDGES, cfg, allTypes: types });
  assert.ok(multi.works.has('pc') && multi.works.has('pif'));
});

test('xp: tier multiplier, surprise, chain cap', () => {
  const w = { tier: 3, badges: [] };
  const base = ratingXp({ work: w, rating: 8, predicted: 8 }, cfg).xp;
  const surprise = ratingXp({ work: w, rating: 8, predicted: 4 }, cfg).xp;
  assert.ok(surprise > base);
  const capped = ratingXp({ work: w, rating: 8, predicted: 8, chainLen: 1000 }, cfg).chainBonus;
  assert.equal(capped, cfg.get('xp.chainCap'));
  assert.ok(ratingXp({ work: { tier: 5, badges: [] }, rating: 8, predicted: 8 }, cfg).xp > base);
  assert.equal(levelFromXp(0, cfg).level, 1);
  assert.ok(levelFromXp(1000, cfg).level > 2);
});

// helpers for fog scenarios
let uid = 0;
const mk = (tier, rating, fam = { 0: 1 }, heard = true) => ({ id: 'w' + uid++, heard, rating, tier, fam, badges: [] });
const L = makeLattice(120);
function place(works) { const hp = {}; works.forEach((w, i) => { hp[w.id] = { q: i % 5 - 2, r: Math.floor(i / 5) - 2 }; }); return hp; }

test('fog: a few mainstream hits unlock essential, not cult or deeper', () => {
  const heard = [mk(0, 8), mk(0, 8), mk(0, 8)];
  const cands = [mk(1, 0, { 0: 1 }, false), mk(2, 0, { 0: 1 }, false), mk(4, 0, { 0: 1 }, false)];
  const works = [...heard, ...cands]; const hp = place(works);
  for (const c of cands) hp[c.id] = { q: 1, r: 0 }; for (const h of heard) hp[h.id] = { q: 0, r: 0 };
  const v = computeVisibility(works, hp, L, cfg);
  assert.ok(v.visible.has(cands[0].id), 'essential should be visible');
  assert.ok(!v.visible.has(cands[1].id), 'cult should be hidden');
  assert.ok(!v.visible.has(cands[2].id), 'deep cut should be hidden');
});

test('fog: a pile of niches does not unlock deep cuts without the tiers below', () => {
  const heard = Array.from({ length: 12 }, () => mk(3, 8));
  const deep = mk(4, 0, { 0: 1 }, false), niche = mk(3, 0, { 0: 1 }, false);
  const works = [...heard, deep, niche]; const hp = {};
  heard.forEach((h) => { hp[h.id] = { q: 0, r: 0 }; }); hp[deep.id] = { q: 1, r: 0 }; hp[niche.id] = { q: 1, r: 0 };
  const ms = computeMastery(works, cfg);
  assert.ok(allowedTier('hiphop', ms, cfg) < 3, 'niche should still be locked without lower tiers');
  assert.ok(!computeVisibility(works, hp, L, cfg).visible.has(deep.id));
});

test('fog: depth across tiers pushes the fog back and shows rarer works', () => {
  const heard = [];
  for (let t = 0; t < 5; t++) for (let i = 0; i < 14; i++) heard.push(mk(t, 9));
  const ghost = mk(5, 0, { 0: 1 }, false); const deep = mk(4, 0, { 0: 1 }, false);
  const works = [...heard, ghost, deep]; const hp = {};
  heard.forEach((h) => { hp[h.id] = { q: 0, r: 0 }; });
  hp[ghost.id] = { q: 2, r: 0 }; hp[deep.id] = { q: 2, r: 0 };
  const shallowReach = computeVisibility([...heard.filter((h) => h.tier < 2), ghost], hp, L, cfg);
  assert.ok(!shallowReach.visible.has(ghost.id));
  const v = computeVisibility(works, hp, L, cfg);
  assert.ok(v.visible.has(deep.id), 'deep cut visible when deep in the genre');
});

test('seed data: computes sensible visibility without throwing', () => {
  const hp = {}; WORKS.forEach((w, i) => { hp[w.id] = { q: (i % 8) - 4, r: Math.floor(i / 8) - 2 }; });
  const v = computeVisibility(WORKS, hp, L, cfg);
  assert.ok(v.visible.size >= WORKS.filter((w) => w.heard).length);
});
