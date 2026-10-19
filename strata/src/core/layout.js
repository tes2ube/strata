// Layout: fixed genre anchors + force simulation to find rough positions, then snap each work to the nearest free hex point.
// Relatedness sets spring length: weakly related works end up a few hex points apart.
import { FAMILY_IDS } from '../settings/definitions.js';
import { makeLattice } from './hex.js';

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function anchorsFor(cfg) {
  const R = cfg.get('genres.ringRadius'); const n = FAMILY_IDS.length;
  return FAMILY_IDS.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return { x: R * Math.cos(a), y: R * Math.sin(a) }; });
}

export function layout({ works, edges, cfg, prev = null }) {
  const lattice = makeLattice(cfg.get('layout.spacing'));
  const sp = cfg.get('layout.spacing'); const rand = rng(cfg.get('layout.seed'));
  const anchors = anchorsFor(cfg);
  const idx = new Map(works.map((w, i) => [w.id, i]));
  const target = works.map((w) => { let x = 0, y = 0, s = 0; for (const [f, wt] of Object.entries(w.fam)) { x += anchors[f].x * wt; y += anchors[f].y * wt; s += wt; } return { x: x / s, y: y / s }; });
  const P = works.map((w, i) => prev && prev[w.id] ? { ...prev[w.id] } : { x: target[i].x + (rand() - 0.5) * sp, y: target[i].y + (rand() - 0.5) * sp });
  const mass = works.map((w) => w.heard ? 1 + cfg.get('layout.massScale') * ((w.rating || 6) - 5) : 1);
  const iters = cfg.get('layout.iterations'), cool = cfg.get('layout.cooling');
  const range = cfg.get('layout.repulsionRange') * sp, rep = cfg.get('layout.repulsion'), well = cfg.get('genres.wellStrength');
  const k = cfg.get('layout.linkStrength'), base = cfg.get('layout.linkRest') * sp, stretch = cfg.get('layout.relatednessStretch');
  let alpha = 1;
  for (let it = 0; it < iters; it++) {
    const F = works.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < works.length; i++) {
      F[i].x += (target[i].x - P[i].x) * well; F[i].y += (target[i].y - P[i].y) * well;
      for (let j = i + 1; j < works.length; j++) {
        const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, d = Math.hypot(dx, dy) || 0.01;
        if (d < range) { const f = rep * (range - d) / range * sp * 0.1; const ux = dx / d, uy = dy / d; F[i].x += ux * f * Math.sqrt(mass[j]); F[i].y += uy * f * Math.sqrt(mass[j]); F[j].x -= ux * f * Math.sqrt(mass[i]); F[j].y -= uy * f * Math.sqrt(mass[i]); }
      }
    }
    for (const e of edges) {
      const i = idx.get(e.a), j = idx.get(e.b); if (i == null || j == null) continue;
      const rest = base * (1 + stretch * (1 - (e.sim ?? 0.7)));
      const dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, d = Math.hypot(dx, dy) || 0.01, f = k * (d - rest);
      F[i].x += dx / d * f; F[i].y += dy / d * f; F[j].x -= dx / d * f; F[j].y -= dy / d * f;
    }
    for (let i = 0; i < works.length; i++) { if (works[i].pinned) continue; P[i].x += Math.max(-sp * .3, Math.min(sp * .3, F[i].x)) * alpha; P[i].y += Math.max(-sp * .3, Math.min(sp * .3, F[i].y)) * alpha; }
    alpha *= cool;
  }
  const { hex, pos } = snapToLattice(works, P, mass, lattice, cfg.get('layout.hubRadius'));
  return { pos, hex, lattice, anchors, raw: Object.fromEntries(works.map((w, i) => [w.id, P[i]])) };
}

// Snap each work to the nearest free lattice point: heavy and heard works first, then by closeness to the center.
// hub > 0 keeps a disc in the middle free for the shelf hub.
export function snapToLattice(works, P, mass, lattice, hub = 0) {
  const order = works.map((w, i) => i).sort((a, b) => ((works[b].heard ? 1 : 0) - (works[a].heard ? 1 : 0)) || (mass[b] - mass[a]) || (Math.hypot(P[a].x, P[a].y) - Math.hypot(P[b].x, P[b].y)));
  const occ = new Set(); const hex = {}, pos = {};
  for (const i of order) {
    const r = lattice.nearestFree(P[i].x, P[i].y, occ, (pt) => hub > 0 && Math.hypot(pt.x, pt.y) < hub);
    occ.add(lattice.key(r.q, r.r)); hex[works[i].id] = { q: r.q, r: r.r }; pos[works[i].id] = { x: r.p.x, y: r.p.y };
  }
  return { hex, pos };
}
