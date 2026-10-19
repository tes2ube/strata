// Connection routing on the hex lattice.
// Straight runs travel along the three hex axes (0, 60, 120 degrees) in "lanes" half a row away from the tiles,
// so they never cross a work. A route is: short perpendicular stub out of a tile -> lane -> (turn) -> lane -> stub into the other tile.
// Lines that share a work (fan-out or fan-in) are bundled: they use the same stub and the same first lane, and branch off where they must.
const S3 = Math.sqrt(3) / 2;
export const AXES = [{ x: 1, y: 0 }, { x: 0.5, y: S3 }, { x: -0.5, y: S3 }];
const normalOf = (a) => ({ x: -a.y, y: a.x });
const add = (p, q, k = 1) => ({ x: p.x + q.x * k, y: p.y + q.y * k });
const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
const dot = (p, q) => p.x * q.x + p.y * q.y;
const cross = (p, q) => p.x * q.y - p.y * q.x;
const len = (p) => Math.hypot(p.x, p.y);
const near = (p, q) => Math.hypot(p.x - q.x, p.y - q.y) < 0.01;

// Lane legs (everything between the first and last stub) as {ax, lane, t0, t1}
function laneLegs(points) {
  const out = [];
  for (let k = 1; k < points.length - 2; k++) {
    const a = points[k], b = points[k + 1], d = sub(b, a), l = len(d); if (l < 1) continue;
    const u = { x: d.x / l, y: d.y / l };
    const ax = AXES.findIndex((A) => Math.abs(cross(A, u)) < 0.01); if (ax < 0) continue;
    const A = AXES[ax], t0 = dot(a, A), t1 = dot(b, A);
    out.push({ ax, lane: cross(A, a), t0: Math.min(t0, t1), t1: Math.max(t0, t1) });
  }
  return out;
}
function overlapLength(points, placed, key) {
  let total = 0;
  for (const L of laneLegs(points)) for (const q of placed) {
    if (q.ax !== L.ax || Math.abs(q.lane - L.lane) > 1 || (key && q.key === key)) continue;
    total += Math.max(0, Math.min(L.t1, q.t1) - Math.max(L.t0, q.t0));
  }
  return total;
}

function combos() { const o = []; for (let ax = 0; ax < 3; ax++) for (const side of [1, -1]) o.push({ ax, side }); return o; }
const COMBOS = combos();

function endpoint(c, half, combo, h) {
  const n = normalOf(AXES[combo.ax]);
  return { port: add(c, n, combo.side * (half + 2)), gate: add(c, n, combo.side * h), ax: combo.ax, side: combo.side };
}

// Route from S to T with fixed combos. Returns {points, cost} or null.
function routeFixed(S, T, es, et, p) {
  const d1 = AXES[es.ax], d2 = AXES[et.ax], G1 = es.gate, G2 = et.gate;
  const toT = sub(T.c, S.c);
  let pts, legs = 0, back = 0, turns;
  if (es.ax === et.ax) {
    if (Math.abs(cross(sub(G2, G1), d1)) > 1) return null; // different parallel lanes
    pts = [es.port, G1, G2, et.port]; legs = len(sub(G2, G1)); turns = 2;
    if (dot(sub(G2, G1), toT) < 0) back = legs;
  } else {
    const cr = cross(d1, d2), w = sub(G2, G1);
    const t = cross(w, d2) / cr, u = cross(w, d1) / cr;
    const X = add(G1, d1, t);
    pts = [es.port, G1, X, G2, et.port]; legs = Math.abs(t) + Math.abs(u); turns = 3;
    if (dot({ x: d1.x * t, y: d1.y * t }, toT) < 0) back += Math.abs(t);
    if (dot({ x: -d2.x * u, y: -d2.y * u }, toT) < 0) back += Math.abs(u);
  }
  const clean = [pts[0]];
  for (let i = 1; i < pts.length; i++) if (!near(pts[i], clean[clean.length - 1])) clean.push(pts[i]);
  const stub = len(sub(es.gate, es.port)) + len(sub(et.gate, et.port));
  const ov = p.placed.length ? overlapLength(clean, p.placed, p.key) : 0;
  return { points: clean, cost: legs + stub + p.turn * turns + p.back * back + p.overlap * ov };
}

export function routeEdges({ centers, halfOf, edges, lattice, cfg }) {
  const h = lattice.dy / 2;
  const p = { turn: cfg.get('routing.turnPenalty'), back: cfg.get('routing.backtrackPenalty'), port: cfg.get('routing.portPenalty'), overlap: cfg.get('routing.overlapPenalty'), placed: [], key: null };
  const register = (points, key) => { for (const L of laneLegs(points)) p.placed.push({ ...L, key }); };
  const bundle = cfg.get('routing.bundle');
  const used = new Map(); // "id|ax|side" -> count
  const ukey = (id, c) => `${id}|${c.ax}|${c.side}`;
  const ends = (id) => COMBOS.map((cb) => ({ cb, ep: endpoint(centers[id], halfOf(id), cb, h) }));
  const E = new Map(); const endsOf = (id) => { if (!E.has(id)) E.set(id, ends(id)); return E.get(id); };
  const node = (id) => ({ c: centers[id] });

  const outdeg = {}, indeg = {};
  edges.forEach((e) => { (outdeg[e.type + '|' + e.a] = (outdeg[e.type + '|' + e.a] || 0) + 1); (indeg[e.type + '|' + e.b] = (indeg[e.type + '|' + e.b] || 0) + 1); });
  const groups = new Map(); const singles = [];
  edges.forEach((e, i) => {
    const o = outdeg[e.type + '|' + e.a], n = indeg[e.type + '|' + e.b];
    let hub = null, src = true;
    if (bundle && o >= 2 && o >= n) { hub = e.a; src = true; } else if (bundle && n >= 2) { hub = e.b; src = false; }
    if (hub == null) { singles.push(i); return; }
    const k = `${e.type}|${hub}|${src}`;
    if (!groups.has(k)) groups.set(k, { hub, src, idx: [], key: k });
    groups.get(k).idx.push(i);
  });

  const routes = new Array(edges.length).fill(null);
  const claim = (id, cb) => used.set(ukey(id, cb), (used.get(ukey(id, cb)) || 0) + 1);

  for (const g of groups.values()) {
    p.key = g.key;
    let best = null;
    for (const hc of endsOf(g.hub)) {
      let sum = 0, ok = true;
      for (const i of g.idx) {
        const leaf = g.src ? edges[i].b : edges[i].a;
        let m = Infinity;
        for (const lc of endsOf(leaf)) { const r = routeFixed(node(g.hub), node(leaf), hc.ep, lc.ep, p); if (r && r.cost < m) m = r.cost; }
        if (m === Infinity) { ok = false; break; }
        sum += m;
      }
      if (ok && (!best || sum < best.sum)) best = { hc, sum };
    }
    if (!best) { g.idx.forEach((i) => singles.push(i)); continue; }
    claim(g.hub, best.hc.cb);
    for (const i of g.idx) {
      const leaf = g.src ? edges[i].b : edges[i].a;
      let bl = null;
      for (const lc of endsOf(leaf)) {
        const r = routeFixed(node(g.hub), node(leaf), best.hc.ep, lc.ep, p);
        if (!r) continue;
        const c = r.cost + p.port * (used.get(ukey(leaf, lc.cb)) || 0);
        if (!bl || c < bl.c) bl = { c, r, lc };
      }
      claim(leaf, bl.lc.cb);
      register(bl.r.points, g.key);
      routes[i] = { points: g.src ? bl.r.points : bl.r.points.slice().reverse(), bundle: g.key, hub: g.hub };
    }
  }
  p.key = null;
  for (const i of singles) {
    const e = edges[i]; let best = null;
    for (const sc of endsOf(e.a)) for (const tc of endsOf(e.b)) {
      const r = routeFixed(node(e.a), node(e.b), sc.ep, tc.ep, p);
      if (!r) continue;
      const c = r.cost + p.port * ((used.get(ukey(e.a, sc.cb)) || 0) + (used.get(ukey(e.b, tc.cb)) || 0));
      if (!best || c < best.c) best = { c, r, sc, tc };
    }
    if (!best) { routes[i] = { points: [centers[e.a], centers[e.b]], bundle: null, hub: null }; continue; }
    claim(e.a, best.sc.cb); claim(e.b, best.tc.cb);
    register(best.r.points, null);
    routes[i] = { points: best.r.points, bundle: null, hub: null };
  }
  return routes;
}

// Rounded polyline as an SVG/Canvas path description: returns array of commands.
export function roundedCommands(points, radius) {
  const cmds = [{ op: 'M', x: points[0].x, y: points[0].y }];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], v = points[i], b = points[i + 1];
    const l1 = len(sub(v, a)), l2 = len(sub(b, v));
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const p1 = add(v, sub(a, v), r / l1), p2 = add(v, sub(b, v), r / l2);
    cmds.push({ op: 'L', x: p1.x, y: p1.y }, { op: 'Q', cx: v.x, cy: v.y, x: p2.x, y: p2.y });
  }
  const last = points[points.length - 1];
  cmds.push({ op: 'L', x: last.x, y: last.y });
  return cmds;
}
export function pathString(points, radius) {
  return roundedCommands(points, radius).map((c) => c.op === 'Q' ? `Q${c.cx} ${c.cy} ${c.x} ${c.y}` : `${c.op}${c.x} ${c.y}`).join(' ');
}
export function endDirection(points) {
  const a = points[points.length - 2], b = points[points.length - 1]; const d = sub(b, a); const l = len(d) || 1; return { x: d.x / l, y: d.y / l };
}
