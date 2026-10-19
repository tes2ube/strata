// Derived numbers for the progress screens: territory reveal, taste signature, level titles. Pure.
import { FAMILY_IDS } from '../settings/definitions.js';
import { domFam, ratingFactorFor } from './fog.js';
import { levelFromXp } from './xp.js';

export function territoryReveal(works, visible) {
  const out = {};
  for (const f of FAMILY_IDS) { const ws = works.filter((w) => domFam(w) === f); out[f] = { total: ws.length, seen: ws.filter((w) => visible.has(w.id)).length, frac: ws.length ? ws.filter((w) => visible.has(w.id)).length / ws.length : 0 }; }
  return out;
}

export function levelTitle(xp, cfg) {
  const titles = cfg.get('ui.levelTitles').split(',').map((s) => s.trim()).filter(Boolean), lv = levelFromXp(xp, cfg);
  return { level: lv.level, title: titles[Math.min(lv.level, titles.length) - 1] || 'Explorer', into: lv.into, need: lv.need, frac: Math.min(1, lv.into / lv.need) };
}

export const TASTE_AXES = ['Rhythm drive', 'Harmonic density', 'Lo-fi grit', 'Vocal focus', 'Obscurity', 'Era spread'];
// Six values in 0..1: four family traits, mean tier, spread of years. Heard works count in proportion to how highly you rated them.
// before (a timestamp) limits to works first rated before that moment, for the dashed comparison shape.
export function tasteSignature(works, cfg, before = Infinity) {
  const hs = works.filter((w) => w.heard && (w.first ?? w.last) <= before && w.rating > 0);
  if (!hs.length) return null;
  const dims = ['rhythm', 'harmonic', 'grit', 'vocal'], acc = [0, 0, 0, 0]; let wsum = 0, tier = 0; const years = [];
  for (const w of hs) {
    const k = Math.max(0.05, ratingFactorFor(w.rating, cfg)); wsum += k; tier += k * w.tier / 5; if (Number.isFinite(w.year)) years.push(w.year);
    let fw = 0; for (const x of Object.values(w.fam)) fw += x;
    dims.forEach((d, i) => { let v = 0; for (const [fi, x] of Object.entries(w.fam)) v += x * cfg.get(`taste.${FAMILY_IDS[fi]}.${d}`); acc[i] += k * v / (fw || 1); });
  }
  const mean = years.length ? years.reduce((a, b) => a + b, 0) / years.length : 0, sd = years.length ? Math.sqrt(years.reduce((a, y) => a + (y - mean) ** 2, 0) / years.length) : 0;
  return [...acc.map((x) => x / wsum), tier / wsum, Math.min(1, sd / cfg.get('taste.eraSpreadYears'))];
}
