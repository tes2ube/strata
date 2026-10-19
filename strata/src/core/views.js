// Alternate layouts over the same data: time (x = year, a lane per family), credits (shared people pull works together), place (by city).
// Each returns {pos, hex, lattice, hidden, ...extras}. hidden lists works the view cannot place. Genre is the normal layout.
import { FAMILY_IDS } from '../settings/definitions.js';
import { makeLattice } from './hex.js';
import { layout, snapToLattice } from './layout.js';
import { domFam } from './fog.js';
import { creditNames } from './recs.js';

export function creditEdges(works, cfg) {
  const byName = new Map();
  for (const w of works) for (const n of creditNames(w)) { const k = n.toLowerCase(); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(w.id); }
  const seen = new Set(), out = [];
  for (const ids of byName.values()) for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const k = ids[i] + '|' + ids[j]; if (seen.has(k)) continue; seen.add(k);
    out.push({ a: ids[i], b: ids[j], type: 'personnel', sim: cfg.get('views.creditsStrength') });
  }
  return out;
}

function snapTargets(works, targets, cfg) {
  const lattice = makeLattice(cfg.get('layout.spacing'));
  const P = works.map((w) => targets[w.id]), mass = works.map(() => 1);
  const { hex, pos } = snapToLattice(works, P, mass, lattice, 0);
  return { hex, pos, lattice };
}

export function viewLayout({ view, works, edges, cfg, prev = null }) {
  if (view === 'time') {
    const dated = works.filter((w) => Number.isFinite(w.year)); const undated = new Set(works.filter((w) => !Number.isFinite(w.year)).map((w) => w.id)); works = dated;
    const ys = works.map((w) => w.year), min = Math.min(...ys), max = Math.max(...ys), span = Math.max(1, max - min), W = cfg.get('views.timeWidth'), H = cfg.get('views.laneHeight');
    const x = (y) => (y - min) / span * W - W / 2, laneY = (f) => (f - (FAMILY_IDS.length - 1) / 2) * H;
    const targets = {}; for (const w of works) targets[w.id] = { x: x(w.year), y: laneY(FAMILY_IDS.indexOf(domFam(w))) };
    const L = snapTargets(works, targets, cfg);
    const decades = []; for (let d = Math.ceil(min / 10) * 10; d <= max; d += 10) decades.push({ year: d, x: x(d) });
    return { ...L, hidden: undated, decades, lanes: FAMILY_IDS.map((f, i) => ({ fam: f, y: laneY(i) })) };
  }
  if (view === 'place') {
    const placed = works.filter((w) => w.place), k = cfg.get('views.placeScale');
    const targets = {}; for (const w of placed) targets[w.id] = { x: w.place.lon * k, y: -w.place.lat * k };
    const L = snapTargets(placed, targets, cfg);
    return { ...L, hidden: new Set(works.filter((w) => !w.place).map((w) => w.id)) };
  }
  if (view === 'credits') {
    const L = layout({ works: works.map((w) => ({ ...w })), edges: [...edges, ...creditEdges(works, cfg)], cfg, prev });
    return { pos: L.pos, hex: L.hex, lattice: L.lattice, raw: L.raw, hidden: new Set() };
  }
  const L = layout({ works: works.map((w) => ({ ...w })), edges, cfg, prev });
  return { ...L, hidden: new Set() };
}
