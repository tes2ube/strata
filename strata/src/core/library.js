// Adding works to the library: classify tags into families, guess a tier from popularity, match records to works, auto-link. Pure.
import { FAMILY_IDS, TIER_IDS } from '../settings/definitions.js';

const words = (s) => String(s || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);

// tags: array of strings or {name,count}. Keyword lists come from settings (sync.tags.<family>). Returns {familyIndex: weight} summing to 1, or null.
export function familiesFromTags(tags, cfg) {
  const kw = FAMILY_IDS.map((f) => words(cfg.get(`sync.tags.${f}`)));
  const acc = {};
  for (const t of tags || []) {
    const name = String(t.name ?? t).toLowerCase(), wt = Number(t.count) > 0 ? Number(t.count) : 1;
    kw.forEach((list, i) => { if (list.some((k) => name === k || name.includes(k))) acc[i] = (acc[i] || 0) + wt; });
  }
  const sum = Object.values(acc).reduce((a, b) => a + b, 0); if (!sum) return null;
  const out = {}; for (const [i, v] of Object.entries(acc)) out[i] = Math.round(v / sum * 100) / 100;
  return out;
}

// ListenBrainz unique listeners -> tier index. null or unknown gives data.defaultTier.
export function tierFromListeners(n, cfg) {
  if (n == null || !Number.isFinite(n)) return cfg.get('data.defaultTier');
  for (let t = 0; t < 5; t++) if (n >= cfg.get(`sync.listenersMin.${TIER_IDS[t]}`)) return t;
  return 5;
}

// Matching keys. Lowercase, no accents or punctuation, trailing edition brackets dropped when they hold an edition word.
export function normText(s) { return String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim(); }
export function stripEdition(title, cfg) {
  const ew = words(cfg.get('sync.editionWords'));
  return String(title || '').replace(/\s*[\(\[]([^\)\]]*)[\)\]]\s*$/, (m, inner) => (ew.some((w) => inner.toLowerCase().includes(w)) ? '' : m));
}
export const workKey = (artist, title, cfg) => normText(artist) + '|' + normText(stripEdition(title, cfg));

export function makeWorkId(title, artist, taken, mbid = null) {
  if (mbid) { const id = 'mb-' + mbid.slice(0, 8); if (!taken.has(id)) return id; }
  const base = (artist + ' ' + title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'work';
  let id = 'u-' + base, n = 2; while (taken.has(id)) id = `u-${base}-${n++}`; return id;
}

// Links a new work to its most similar existing works. Direction: earlier work -> later work for influence, else contemporary.
export function autoLink(work, others, sim, cfg) {
  if (!work.fam) return [];
  const min = cfg.get('recs.autoLinkMinSim');
  return others.filter((o) => o.id !== work.id && o.fam).map((o) => ({ o, s: sim(work, o) })).filter((x) => x.s >= min).sort((a, b) => b.s - a.s).slice(0, cfg.get('recs.autoLinkCount'))
    .map(({ o, s }) => {
      const gap = Math.abs(work.year - o.year);
      if (!Number.isFinite(gap) || gap <= 2) return { a: o.id, b: work.id, type: 'contemporary', sim: Math.round(s * 100) / 100 };
      const [a, b] = o.year < work.year ? [o.id, work.id] : [work.id, o.id];
      return { a, b, type: 'influence', sim: Math.round(s * 100) / 100 };
    });
}
