// Similarity, rating prediction and recommendation scoring. Pure. Everything tunable is under recs.* and quests.*.
import { FAMILY_IDS } from '../settings/definitions.js';

function cosine(a, b) {
  let d = 0, na = 0, nb = 0;
  for (const k of Object.keys(a)) { d += a[k] * (b[k] || 0); na += a[k] * a[k]; }
  for (const k of Object.keys(b)) nb += b[k] * b[k];
  return na && nb ? d / Math.sqrt(na * nb) : 0;
}
const people = (w) => { const c = w.credits; if (!c) return null; const n = [...(c.producers || []), ...(c.players || [])].map((x) => x.split(' · ')[0].toLowerCase()); return n.length ? new Set(n) : null; };
export const creditNames = (w) => { const c = w.credits || {}; return [...(c.producers || []), ...(c.players || [])].map((x) => x.split(' · ')[0]); };

// Returns sim(a, b) in 0..1 using family overlap (tags), shared subgenres, credits, era and sample links. A direct edge sets a floor.
export function makeSimilarity(edges, cfg) {
  const direct = new Map();
  for (const e of edges) { direct.set(e.a + '|' + e.b, e); direct.set(e.b + '|' + e.a, e); }
  const wT = cfg.get('recs.weightTags'), wC = cfg.get('recs.weightCredits'), wE = cfg.get('recs.weightEra'), wS = cfg.get('recs.weightSamples'), scale = cfg.get('recs.eraScaleYears');
  return (a, b) => {
    if (a.id === b.id) return 1;
    const shareSub = (a.subs || []).some((s) => (b.subs || []).includes(s)) ? 1 : 0;
    const tag = 0.7 * cosine(a.fam, b.fam) + 0.3 * shareSub;
    let num = wT * tag, den = wT;
    if (Number.isFinite(a.year) && Number.isFinite(b.year)) { num += wE * Math.exp(-Math.abs(a.year - b.year) / scale); den += wE; }
    const pa = people(a), pb = people(b);
    if (pa && pb) { let inter = 0; for (const x of pa) if (pb.has(x)) inter++; num += wC * inter / (pa.size + pb.size - inter); den += wC; }
    const e = direct.get(a.id + '|' + b.id);
    if (e && e.type === 'sample') { num += wS; den += wS; }
    return Math.min(1, Math.max(num / den, e ? (e.sim ?? 0.5) : 0));
  };
}

// Weighted mean of your ratings by similarity squared, pulled toward the neutral rating when nothing is close. null if nothing heard.
export function predictRating(w, heard, sim, cfg) {
  const others = heard.filter((h) => h.id !== w.id && h.rating > 0);
  if (!others.length) return null;
  const neutral = cfg.get('recs.ratingNeutral'); let num = 0.5 * neutral, den = 0.5;
  for (const h of others) { const s = sim(w, h), k = s * s; num += k * h.rating; den += k; }
  return num / den;
}

// Positive when similar to works you rated above neutral, negative when similar to works below it.
export function tasteScore(c, heard, sim, cfg) {
  const neutral = cfg.get('recs.ratingNeutral'), hi = cfg.get('recs.highRatingPull'), lo = cfg.get('recs.lowRatingPush');
  let sum = 0;
  for (const h of heard) { if (!(h.rating > 0)) continue; const d = h.rating - neutral; sum += sim(c, h) * (d > 0 ? d * hi : d * lo); }
  return sum / Math.sqrt(Math.max(1, heard.length));
}

// Pick up to n candidates: score by taste, obscurity and recency, then choose greedily so picks differ from each other (diversity).
export function recommend(cands, heard, sim, cfg, { n = cfg.get('recs.perExpand'), year = new Date().getFullYear() } = {}) {
  const obs = cfg.get('recs.obscurityBoost'), win = cfg.get('quests.recentYearsWindow'), bias = cfg.get('quests.recentBias'), div = cfg.get('recs.diversity'), minYear = cfg.get('recs.minYear');
  const scored = cands.filter((c) => !(c.year < minYear)).map((c) => ({ c, s: Math.exp(tasteScore(c, heard, sim, cfg) * 0.25 + obs * c.tier / 5) * (Number.isFinite(c.year) && year - c.year <= win ? bias : 1) }));
  const out = [];
  while (out.length < n && scored.length) {
    let bi = 0, bv = -Infinity;
    scored.forEach((x, i) => { const near = out.length ? Math.max(...out.map((o) => sim(x.c, o))) : 0; const v = x.s * (1 - div * near); if (v > bv) { bv = v; bi = i; } });
    out.push(scored.splice(bi, 1)[0].c);
  }
  return out;
}

export const sharesFamily = (a, b) => FAMILY_IDS.some((_, i) => (a.fam[i] || 0) >= 0.3 && (b.fam[i] || 0) >= 0.3);
