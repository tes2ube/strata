import test from 'node:test';
import assert from 'node:assert/strict';
import { plainSettings } from '../src/settings/store.js';
import { createGame, freshState } from '../src/core/game.js';
import { WORKS, EDGES, SUBGENRES } from '../src/data/seed.js';
import { CHRONICLES } from '../src/data/chronicles.js';
import { migrate } from '../src/core/persist.js';
import { activeBundles, collapseBundles, bundleId } from '../src/core/bundles.js';

const T0 = Date.UTC(2026, 9, 12, 12);
const base = { works: WORKS.map((w) => ({ ...w })), edges: EDGES, subgenres: SUBGENRES, chronicles: CHRONICLES };
function mk(demo) { const cfg = plainSettings(), clock = { t: T0 }; return { cfg, game: createGame({ base, cfg, state: freshState(WORKS, cfg, T0, demo), now: () => clock.t, rand: () => 0 }) }; }

test('demo switch: a blank canvas has nothing, the switch brings the starter works and keeps your ratings', () => {
  const { game } = mk(false);
  assert.equal(game.works().length, 0); assert.equal(game.edges().length, 0); assert.equal(game.board().chronicles.length, 0); assert.equal(game.demo(), false);
  game.setDemo(true);
  assert.equal(game.works().length, WORKS.length); assert.ok(game.works().find((w) => w.id === 'ill').heard);
  game.rate('kb', 8); game.setDemo(false); assert.equal(game.works().length, 0);
  game.setDemo(true); assert.equal(game.works().find((w) => w.id === 'kb').rating, 8, 'rating survives the round trip');
});

test('blank canvas: a work can be added and removed, starter works cannot be removed', () => {
  const { game } = mk(false);
  const r = game.addWork({ title: 'A', artist: 'B', year: 2000, fam: { 0: 1 }, tier: 2 });
  assert.ok(r.ok); assert.equal(game.works().length, 1);
  assert.ok(game.removeWork(r.id).ok); assert.equal(game.works().length, 0); assert.equal(game.state.added.length, 0);
  const d = mk(true).game; assert.ok(!d.removeWork('ill').ok);
});

test('saves from before the demo switch load with the demo on', () => {
  assert.equal(migrate({ v: 2, xp: 0, works: {} }).demo, true);
  assert.equal(migrate({ v: 2, demo: false, works: {} }).demo, false);
  assert.equal(migrate({ xp: 5, works: {} }).demo, true);
});

test('bundles: parts collapse into one work with averaged rating, merged info and remapped connections', () => {
  const { game } = mk(true);
  const r = game.makeBundle(['ill', 'gk'], 'Two classics'); assert.ok(r.ok);
  const ws = game.works(), b = ws.find((w) => w.id === r.id);
  assert.ok(b && !ws.some((w) => w.id === 'ill' || w.id === 'gk'));
  assert.equal(b.rating, 8.5); assert.equal(b.year, 1994); assert.equal(b.artist, 'Nas / Kendrick Lamar'); assert.ok(b.heard);
  assert.ok(b.badges.includes('canon')); assert.equal(b.members.length, 2);
  assert.ok(game.edges().every((e) => e.a !== e.b), 'no line from a bundle to itself');
  assert.ok(game.edges().some((e) => e.b === r.id || e.a === r.id), 'the parts connections now belong to the bundle');
  assert.ok(!game.makeBundle(['ill', 'fs'], 'again').ok, 'a part cannot join a second bundle');
  assert.ok(!game.makeBundle(['fs'], 'solo').ok); assert.ok(!game.makeBundle(['fs', 'pif'], '  ').ok);
  assert.ok(game.unbundle(r.id).ok); assert.ok(game.works().some((w) => w.id === 'ill') && !game.works().some((w) => w.id === r.id));
});

test('bundles: rating the bundle overrides the average, removing a part dissolves a two-part bundle', () => {
  const { game } = mk(false);
  const a = game.addWork({ title: 'Part 1', artist: 'X', year: 2001, fam: { 0: 1 }, tier: 2, heard: true, rating: 8 }), b = game.addWork({ title: 'Part 2', artist: 'X', year: 2002, fam: { 0: 1 }, tier: 2, heard: true, rating: 6 });
  const bun = game.makeBundle([a.id, b.id], 'X, both parts');
  assert.equal(game.works().length, 1); assert.equal(game.works()[0].rating, 7); assert.equal(game.works()[0].artist, 'X');
  game.removeWork(a.id); assert.equal(game.bundles().length, 0); assert.equal(game.works().length, 1); assert.equal(game.works()[0].id, b.id);
  void bun;
});

test('bundle helpers: ids are unique, a bundle missing members is ignored', () => {
  assert.equal(bundleId('Two parts', new Set()), 'b:two-parts'); assert.equal(bundleId('Two parts', new Set(['b:two-parts'])), 'b:two-parts-2');
  const raw = [{ id: 'a' }, { id: 'b' }];
  assert.equal(activeBundles(raw, [{ id: 'b:x', name: 'x', ids: ['a', 'zzz'] }]).length, 0);
  assert.equal(collapseBundles(raw, [{ id: 'b:x', name: 'x', ids: ['a', 'zzz'] }], { works: {} }, 0), raw);
});
