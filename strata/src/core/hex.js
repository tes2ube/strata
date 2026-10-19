// Hex lattice. Works rest on lattice points ("snaps"). Rows are horizontal; neighbors sit at 0, 60, 120... degrees.
const S3 = Math.sqrt(3) / 2;
export function makeLattice(spacing, origin = { x: 0, y: 0 }) {
  const dx = spacing, dy = spacing * S3;
  const pointOf = (q, r) => ({ x: origin.x + dx * (q + r / 2), y: origin.y + dy * r });
  const toAxial = (x, y) => {
    const r = (y - origin.y) / dy, q = (x - origin.x) / dx - r / 2;
    let cx = Math.round(q), cz = Math.round(r), cy = Math.round(-q - r);
    const ex = Math.abs(cx - q), ez = Math.abs(cz - r), ey = Math.abs(cy + q + r);
    if (ex > ey && ex > ez) cx = -cy - cz; else if (ez > ey) cz = -cx - cy;
    return { q: cx, r: cz };
  };
  const key = (q, r) => q + ',' + r;
  const dist = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  // nearest unoccupied lattice point to (x,y), searching rings outward
  function nearestFree(x, y, occupied, blocked = () => false) {
    const c = toAxial(x, y);
    let best = null;
    for (let k = 0; k < 40; k++) {
      for (const h of ring(c, k)) {
        if (occupied.has(key(h.q, h.r))) continue;
        const p = pointOf(h.q, h.r);
        if (blocked(p)) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if (!best || d < best.d) best = { ...h, d, p };
      }
      if (best && best.d <= (k + 0.5) * dy * 0.9) break; // nothing farther ring can beat it
    }
    return best;
  }
  function ring(c, k) {
    if (k === 0) return [c];
    const dirs = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
    const out = [];
    let q = c.q + dirs[4][0] * k, r = c.r + dirs[4][1] * k;
    for (let s = 0; s < 6; s++) for (let i = 0; i < k; i++) { out.push({ q, r }); q += dirs[s][0]; r += dirs[s][1]; }
    return out;
  }
  return { dx, dy, origin, pointOf, toAxial, key, dist, nearestFree, ring };
}
