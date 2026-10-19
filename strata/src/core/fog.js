// Mastery (how deep you are in a genre) and fog-of-war visibility.
// Rules: a genre unlocks rarer tiers as mastery grows AND as you hear enough works in the tier below (or any rarer tier).
// A heard work pushes the fog back further the rarer it is, scaled by how deep you are in that genre.
import { TIER_IDS, FAMILY_IDS } from '../settings/definitions.js';

export function ratingFactor(rating, cfg) {
  const floor = cfg.get('tiers.ratingFloor'), ceil = cfg.get('tiers.ratingCeil'), top = cfg.get('tiers.ratingTopFactor');
  if (rating <= floor) return 0;
  if (rating >= ceil) return top;
  return top * (rating - floor) / (ceil - floor);
}

export const ratingFactorFor = (rating, cfg) => ratingFactor(rating, cfg);

export function computeMastery(works, cfg) {
  const acc = {}; // fam -> tier -> {sum, cnt}
  for (const f of FAMILY_IDS) acc[f] = TIER_IDS.map(() => ({ sum: 0, cnt: 0 }));
  for (const w of works) {
    if (!w.heard) continue;
    let bm = 1;
    for (const b of w.badges || []) if (cfg.get(`badges.${b}.enabled`)) bm *= cfg.get(`badges.${b}.masteryMult`);
    const val = cfg.get(`tiers.${TIER_IDS[w.tier]}.masteryValue`) * ratingFactor(w.rating, cfg) * bm;
    for (const [fam, wt] of Object.entries(w.fam)) {
      const slot = acc[FAMILY_IDS[fam]][w.tier];
      slot.sum += val * wt; slot.cnt += wt;
    }
  }
  const exp = cfg.get('tiers.diminishing');
  const mastery = {}, counts = {};
  for (const f of FAMILY_IDS) {
    let m = 0; counts[f] = [];
    acc[f].forEach((s, t) => { counts[f][t] = s.cnt; if (s.cnt > 0) m += (s.sum / s.cnt) * Math.pow(s.cnt, exp); });
    mastery[f] = m;
  }
  return { mastery, counts };
}

export function allowedTier(fam, ms, cfg) {
  let k = 0;
  for (let t = 1; t < TIER_IDS.length; t++) {
    const id = TIER_IDS[t];
    const needM = cfg.get(`tiers.${id}.unlockMastery`), needN = cfg.get(`tiers.${id}.prereqWorks`);
    if (ms.mastery[fam] >= needM && ms.counts[fam].slice(t - 1).reduce((a, b) => a + b, 0) >= needN - 1e-9) k = t; else break;
  }
  return k;
}
export const depthFactor = (fam, ms, cfg) => Math.min(1, ms.mastery[fam] / cfg.get('fog.depthReference'));

export const famsOf = (w, min = 0.3) => Object.entries(w.fam).filter(([, wt]) => wt >= min).map(([i]) => FAMILY_IDS[i]);
export const domFam = (w) => FAMILY_IDS[Object.entries(w.fam).sort((a, b) => b[1] - a[1])[0][0]];

// hexPos: id -> {q,r}. Returns visible ids and reveal circles in lattice steps.
// extras (all optional): scouted = ids made visible by growing, flares = [{q,r}] hex centers, charters = {family:{fam:true}, sub:{subId:true}}.
// A reveal is {id, steps} (centered on a work) or {hex:{q,r}, steps} (a flare).
export function computeVisibility(works, hexPos, lattice, cfg, extras = {}) {
  const ms = computeMastery(works, cfg);
  const scouted = new Set(extras.scouted || []), flares = extras.flares || [], ch = extras.charters || { family: {}, sub: {} };
  const visible = new Set(), reveals = [];
  const heard = works.filter((w) => w.heard), unheard = works.filter((w) => !w.heard);
  if (!cfg.get('fog.enabled')) { works.forEach((w) => visible.add(w.id)); return { visible, reveals, ms }; }
  for (const w of heard) visible.add(w.id);
  const allowed = {};
  for (const f of FAMILY_IDS) allowed[f] = Math.max(allowedTier(f, ms, cfg), ch.family?.[f] ? 1 : 0);
  const tierCap = (c) => Math.max(...famsOf(c, 0.3).map((f) => allowed[f]));
  const cap = cfg.get('fog.maxVisiblePerHeard');
  for (const w of heard) {
    const df = depthFactor(domFam(w), ms, cfg);
    const steps = cfg.get('fog.baseSteps') + cfg.get(`tiers.${TIER_IDS[w.tier]}.fogRadiusBonus`) * df;
    const maxTier = w.tier + cfg.get('fog.tierAhead');
    const cands = [];
    for (const c of unheard) {
      const d = lattice.dist(hexPos[w.id], hexPos[c.id]);
      if (d > steps + 1e-9) continue;
      if (c.tier > maxTier) continue;
      if (c.tier > tierCap(c)) continue;
      cands.push({ c, d });
    }
    cands.sort((a, b) => a.d - b.d);
    (cap > 0 ? cands.slice(0, cap) : cands).forEach(({ c }) => visible.add(c.id));
    reveals.push({ id: w.id, steps });
  }
  // charters: a chartered subgenre shows its works up to the tier its families have unlocked
  for (const c of unheard) if ((c.subs || []).some((s) => ch.sub?.[s]) && c.tier <= tierCap(c)) visible.add(c.id);
  // flares lift the fog around a hex and show everything inside it
  const fs = cfg.get('shop.flareSteps');
  for (const f of flares) {
    reveals.push({ hex: { q: f.q, r: f.r }, steps: fs });
    for (const c of unheard) if (hexPos[c.id] && lattice.dist(f, hexPos[c.id]) <= fs + 1e-9) visible.add(c.id);
  }
  for (const id of scouted) visible.add(id);
  for (const c of unheard) if (visible.has(c.id)) reveals.push({ id: c.id, steps: cfg.get('fog.scoutSteps') });
  return { visible, reveals, ms, allowed };
}
