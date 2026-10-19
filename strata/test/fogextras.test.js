import test from 'node:test';
import assert from 'node:assert/strict';
import { plainSettings } from '../src/settings/store.js';
import { makeLattice } from '../src/core/hex.js';
import { computeVisibility } from '../src/core/fog.js';

const cfg = plainSettings(), L = makeLattice(120);
const w = (id, tier, heard, fam = { 3: 1 }, subs = []) => ({ id, tier, heard, rating: heard ? 8 : 0, fam, badges: [], subs });
const far = { q: 8, r: 0 };

test('charter: a chartered subgenre shows works up to the unlocked tier, and no further', () => {
  const works = [w('h', 0, true), w('easy', 1, false, { 3: 1 }, ['punk']), w('deep', 4, false, { 3: 1 }, ['punk']), w('other', 1, false)];
  const hex = { h: { q: 0, r: 0 }, easy: far, deep: far, other: far };
  const plain = computeVisibility(works, hex, L, cfg);
  assert.ok(!plain.visible.has('easy'));
  const ch = computeVisibility(works, hex, L, cfg, { charters: { family: { rock: true }, sub: { punk: true } } });
  assert.ok(ch.visible.has('easy'), 'tier 1 allowed through the family charter');
  assert.ok(!ch.visible.has('deep'), 'deep cut still locked');
  assert.ok(!ch.visible.has('other'), 'works outside the subgenre stay hidden');
});

test('flare: everything within the flare radius shows, nothing outside it', () => {
  const works = [w('h', 0, true), w('near', 5, false), w('away', 5, false)];
  const hex = { h: { q: 0, r: 0 }, near: { q: 9, r: 0 }, away: { q: 20, r: 0 } };
  const v = computeVisibility(works, hex, L, cfg, { flares: [{ q: 9, r: 0 }] });
  assert.ok(v.visible.has('near') && !v.visible.has('away'));
  assert.ok(v.reveals.some((r) => r.hex && r.hex.q === 9));
});
