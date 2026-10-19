import test from 'node:test';
import assert from 'node:assert/strict';
import { plainSettings } from '../src/settings/store.js';
import { layout, anchorsFor } from '../src/core/layout.js';
import { routeEdges, AXES } from '../src/core/routing.js';
import { WORKS, EDGES } from '../src/data/seed.js';

const cfg = plainSettings();
const works = WORKS.map((w) => ({ ...w }));
const L = layout({ works, edges: EDGES, cfg });

test('layout: every work rests on a unique lattice point', () => {
  const keys = new Set(Object.values(L.hex).map((h) => h.q + ',' + h.r));
  assert.equal(keys.size, WORKS.length);
  for (const id of Object.keys(L.pos)) {
    const h = L.hex[id], p = L.lattice.pointOf(h.q, h.r);
    assert.ok(Math.hypot(p.x - L.pos[id].x, p.y - L.pos[id].y) < 1e-6);
  }
});
test('layout: deterministic and anchors fixed', () => {
  const L2 = layout({ works: WORKS.map((w) => ({ ...w })), edges: EDGES, cfg });
  assert.deepEqual(L2.hex, L.hex);
  assert.deepEqual(anchorsFor(cfg), L.anchors);
});
test('layout: heard works stay out of the center hub', () => {
  for (const p of Object.values(L.pos)) assert.ok(Math.hypot(p.x, p.y) >= cfg.get('layout.hubRadius'));
});
test('layout: genre families land in distinct regions', () => {
  const d = (a, b) => Math.hypot(L.pos[a].x - L.pos[b].x, L.pos[a].y - L.pos[b].y);
  assert.ok(d('ill', 'gk') < d('ill', 'ko'), 'hip hop works cluster together, away from ambient');
  assert.ok(d('ty', 'bh') < d('ty', 'sm'));
});
test('layout: weakly related links sit farther apart than strongly related ones, on average', () => {
  const lat = L.lattice; let strong = [], weak = [];
  for (const e of EDGES) (e.sim >= 0.7 ? strong : e.sim <= 0.4 ? weak : []).push(lat.dist(L.hex[e.a], L.hex[e.b]));
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  assert.ok(avg(weak) >= avg(strong), `weak ${avg(weak)} should be >= strong ${avg(strong)}`);
});

const half = () => cfg.get('layout.tileSize') / 2;
const routes = routeEdges({ centers: L.pos, halfOf: () => half(), edges: EDGES, lattice: L.lattice, cfg });

function angleOK(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y; if (Math.hypot(dx, dy) < 0.01) return true;
  let deg = Math.atan2(dy, dx) * 180 / Math.PI; deg = ((deg % 180) + 180) % 180;
  return [0, 60, 120, 90, 30, 150, 180].some((t) => Math.abs(deg - t) < 0.5);
}
test('routing: every segment runs along a hex axis or its perpendicular (stub)', () => {
  routes.forEach((r, i) => { for (let k = 1; k < r.points.length; k++) assert.ok(angleOK(r.points[k - 1], r.points[k]), `edge ${i} seg ${k}`); });
});
test('routing: lanes never come near a tile', () => {
  const centers = Object.values(L.pos), clear = half() + 4;
  routes.forEach((r, i) => {
    for (let k = 1; k < r.points.length - 2; k++) { // lane legs only (skip first and last stub)
      const a = r.points[k], b = r.points[k + 1];
      for (const c of centers) {
        const abx = b.x - a.x, aby = b.y - a.y, t = Math.max(0, Math.min(1, ((c.x - a.x) * abx + (c.y - a.y) * aby) / (abx * abx + aby * aby || 1)));
        const d = Math.hypot(a.x + abx * t - c.x, a.y + aby * t - c.y);
        assert.ok(d >= clear, `edge ${i} lane passes ${d.toFixed(1)}px from a tile`);
      }
    }
  });
});
test('routing: fan-out bundles share a trunk (same stub and first lane point)', () => {
  const idx = EDGES.map((e, i) => (e.a === 'ill' && e.type === 'influence' ? i : -1)).filter((i) => i >= 0);
  assert.ok(idx.length >= 3);
  const first = routes[idx[0]];
  for (const i of idx) { assert.ok(routes[i].bundle); assert.deepEqual(routes[i].points[0], first.points[0]); assert.deepEqual(routes[i].points[1], first.points[1]); }
});
test('routing: fan-in bundles share a trunk at the hub end', () => {
  const idx = EDGES.map((e, i) => (e.b === 'let' && e.type === 'influence' ? i : -1)).filter((i) => i >= 0);
  assert.ok(idx.length >= 2);
  const end = (r) => r.points[r.points.length - 1];
  for (const i of idx) assert.deepEqual(end(routes[i]), end(routes[idx[0]]));
});
test('routing: bundling off gives each edge its own route', () => {
  const c2 = plainSettings({ 'routing.bundle': false });
  const r2 = routeEdges({ centers: L.pos, halfOf: () => half(), edges: EDGES, lattice: L.lattice, cfg: c2 });
  assert.ok(r2.every((r) => r.bundle === null));
});
