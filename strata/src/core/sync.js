// Sync state logic. Pure: takes the save state plus parsed records and changes the state. No network.
// Provenance rule: a field that came from a source is stored under state.facts / artists / places / wd with a timestamp.
// Anything in the starter catalogue that has no facts behind it is shown as unverified. Nothing here invents data:
// a missing year, genre, credit or place stays missing.
import { FAMILY_IDS } from '../settings/definitions.js';
import { familiesFromTags, tierFromListeners, workKey, makeWorkId, normText } from './library.js';

const DAY = 864e5;

export const syncDefaults = () => ({ facts: {}, artists: {}, places: {}, wd: {}, imports: {}, syncEdges: [], sync: { runs: [], failures: {}, lastVerify: 0 } });

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const slug = (s) => normText(s).replace(/ /g, '-');
const tagsOf = (rec) => [...(rec.genres || []), ...(rec.styles || []), ...(rec.tags || [])];

// ---------------------------------------------------------------- import
// records: normalized {source, sourceId, title, artist, artistMbids, mbid, year, listens, rating, addedAt, genres, styles}
// all: every work (base + added) as plain objects {id, title, artist, mbid}. Imports never award XP.
export function importRecords(state, records, all, cfg, now, { provider, asHeard = cfg.get('sync.importAsHeard') } = {}) {
  const byMbid = new Map(), byKey = new Map();
  for (const w of all) { const m = state.facts[w.id]?.mbid || w.mbid; if (m) byMbid.set(m, w.id); byKey.set(workKey(state.facts[w.id]?.artist || w.artist, state.facts[w.id]?.title || w.title, cfg), w.id); }
  const out = { added: [], matched: [], skipped: 0, cappedAt: null, unclassified: [] };
  const cap = cfg.get('sync.maxImport');
  const lo = cfg.get('rating.min'), hi = cfg.get('rating.max'), scale = cfg.get('sync.discogsRatingScale');
  for (const rec of records) {
    if (!rec.title || !rec.artist) { out.skipped++; continue; }
    if (out.added.length + out.matched.length >= cap) { out.cappedAt = cap; break; }
    let id = (rec.mbid && byMbid.get(rec.mbid)) || byKey.get(workKey(rec.artist, rec.title, cfg)) || null, isNew = false;
    if (!id) {
      const taken = new Set([...all.map((w) => w.id), ...state.added.map((w) => w.id)]);
      id = makeWorkId(rec.title, rec.artist, taken, rec.mbid);
      const fam = familiesFromTags(tagsOf(rec), cfg);
      const work = { id, title: rec.title, artist: rec.artist, year: rec.year || null, fam, tier: cfg.get('data.defaultTier'), badges: [], subs: [], mbid: rec.mbid || null, user: true, source: 'sync', heard: false, rating: 0, daysAgo: 9999 };
      state.added.push(work); state.works[id] = { heard: false, rating: 0, last: 0, first: 0 };
      all.push(work); if (rec.mbid) byMbid.set(rec.mbid, id); byKey.set(workKey(rec.artist, rec.title, cfg), id);
      isNew = true; if (!fam) out.unclassified.push(id);
    }
    if (rec.mbid) { const f = factsOf(state, id); if (!f.mbid && !all.find((w) => w.id === id)?.mbid) { f.mbid = rec.mbid; f.mbidFrom = provider || rec.source; delete f.unmatched; } }
    const imp = (state.imports[id] ||= { sources: {}, tags: [] });
    imp.sources[provider || rec.source] = { sourceId: rec.sourceId ?? null, listens: rec.listens ?? null, rating: rec.rating || null, addedAt: rec.addedAt || null, at: now };
    for (const t of tagsOf(rec)) if (!imp.tags.some((x) => x.name === t.name)) imp.tags.push(t);
    const st = state.works[id];
    if (asHeard && !st.heard) {
      const when = rec.addedAt || now - cfg.get('sync.unknownRecencyDays') * DAY;
      const r = cfg.get('sync.importRatings') && rec.rating > 0 ? clamp(rec.source === 'discogs' ? rec.rating * scale : rec.rating, lo, hi) : 0;
      Object.assign(st, { heard: true, rating: r, last: when, first: when, ratedAt: when });
      if (cfg.get('slots.enabled') && !state.placed.includes(id)) state.placed.push(id);
    } else if (st.heard && !(st.rating > 0) && cfg.get('sync.importRatings') && rec.rating > 0) {
      st.rating = clamp(rec.source === 'discogs' ? rec.rating * scale : rec.rating, lo, hi);
    }
    if (!asHeard && !st.heard && !state.scouted.includes(id)) state.scouted.push(id);
    (isNew ? out.added : out.matched).push(id);
  }
  return out;
}

// ---------------------------------------------------------------- applying fetched facts
const factsOf = (state, id) => (state.facts[id] ||= { steps: {}, genres: [], tags: [], artistMbids: [] });
export function applyMatch(state, id, mbid, score, now) { const f = factsOf(state, id); f.mbid = mbid; f.match = { score, at: now }; delete f.unmatched; }
export function markUnmatched(state, id, now) { factsOf(state, id).unmatched = now; }
export function applyReleaseGroup(state, id, rg, now) {
  const f = factsOf(state, id);
  Object.assign(f, { mbid: rg.mbid, title: rg.title, artist: rg.artist, artistMbids: rg.artistMbids, year: rg.year, type: rg.type, secondary: rg.secondary, genres: rg.genres, tags: rg.tags, releases: rg.releases, at: now });
  f.steps.rg = now; delete f.unmatched;
}
export function applyRelease(state, id, rel, now) { const f = factsOf(state, id); Object.assign(f, { credits: rel.credits, recordings: rel.recordings, sampleRels: rel.sampleRels, releaseId: rel.releaseId }); f.steps.credits = now; }
export function skipStep(state, id, step, now) { factsOf(state, id).steps[step] = now; }
export function applyArtist(state, a, now) { const prev = state.artists[a.mbid]; state.artists[a.mbid] = { ...prev, ...a, steps: { ...(prev?.steps || {}), artist: now }, at: now }; }
export function applyPlaceStep(state, artistMbid, areaId, now) { const a = state.artists[artistMbid]; if (a) { a.steps = { ...a.steps, place: now }; a.placeAreaId = areaId || null; } }
export function applyArea(state, area, now) { state.places[area.id] = { ...state.places[area.id], ...area, at: now }; }
export function applyWikidata(state, parsed, asked, now) {
  for (const q of asked) {
    const e = parsed[q] || { lat: null, lon: null, influencedBy: [] }; state.wd[q] = { ...e, at: now };
    for (const p of Object.values(state.places)) if (p.wikidata === q) { p.lat = e.lat; p.lon = e.lon; }
  }
}
// asked = the ids that were requested. Ones the service did not know are recorded as asked (listeners null), so they are not asked again.
export function applyPopularity(state, map, now, asked = []) {
  const ask = new Set(asked);
  for (const f of Object.values(state.facts)) { if (!f.mbid) continue; const p = map[f.mbid]; if (p) f.popularity = { ...p, at: now }; else if (ask.has(f.mbid) && !f.popularity) f.popularity = { listens: null, listeners: null, at: now }; }
}
export function applySimilar(state, artistMbid, list, now) { const a = state.artists[artistMbid]; if (a) { a.similar = list; a.steps = { ...a.steps, similar: now }; } }

// ---------------------------------------------------------------- overlay: facts over a base work
// subIdByGenre: Map(normalized genre name -> derived subgenre id)
export function overlayWork(w, state, cfg, subIdByGenre) {
  const f = state.facts[w.id], imp = state.imports[w.id];
  const out = { ...w, source: w.source || (w.user ? 'user' : 'seed'), verified: !!f?.steps?.rg };
  if (f) {
    if (f.title) out.title = f.title; if (f.artist) out.artist = f.artist; if (f.year) out.year = f.year; if (f.mbid) out.mbid = f.mbid;
    out.genres = f.genres.map((g) => g.name); out.tags = f.tags.map((t) => t.name);
    if (f.steps.credits) {
      const samples = [...new Set((f.sampleRels || []).map((s) => (s.artist ? `${s.artist} · ${s.title || 'untitled'}` : s.title || 'untitled')))];
      out.credits = { producers: f.credits?.producers || [], players: f.credits?.players || [], samples };
    } else if (out.verified && w.source !== 'sync' && !w.user) out.credits = undefined; // memory credits are dropped once the work is verified
    const a = f.artistMbids?.[0] && state.artists[f.artistMbids[0]];
    if (a?.steps?.place) {
      const first = cfg.get('sync.placeSource'), order = first === 'area' ? [a.area, a.beginArea] : [a.beginArea, a.area];
      let place = null;
      for (const ar of order) { const p = ar && state.places[ar.id]; if (p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && (cfg.get('sync.placeAllowCountry') || String(p.type).toLowerCase() !== 'country')) { place = { city: p.name, lat: p.lat, lon: p.lon }; break; } }
      out.place = place || undefined;
    } else if (out.verified && !w.user) out.place = undefined;
    if (f.popularity && f.popularity.listeners != null && cfg.get('sync.fetchPopularity')) out.tier = tierFromListeners(f.popularity.listeners, cfg);
    const tags = [...f.genres, ...f.tags, ...(imp?.tags || [])];
    if ((cfg.get('sync.reclassify') || !w.fam) && !w.famPinned) { const fam = familiesFromTags(tags, cfg); if (fam) out.fam = fam; }
    if (subIdByGenre) out.subs = [...new Set(f.genres.map((g) => subIdByGenre.get(normText(g.name))).filter(Boolean))];
  } else if (!w.fam && imp?.tags?.length) { const fam = familiesFromTags(imp.tags, cfg); if (fam) out.fam = fam; }
  out.pending = !out.fam;
  return out;
}

// Verified genres that enough works carry become subgenres (and so charters). Generic family words are skipped.
export function deriveSubgenres(works, cfg) {
  // family-level names only ("hip hop", "rock", "indie", "funk"...); finer genres such as "boom bap" can become subgenres
  const generic = new Set(FAMILY_IDS.flatMap((f) => { const n = cfg.get(`genres.${f}.name`); return [normText(n), ...n.split('/').map(normText)]; }));
  const by = new Map();
  for (const w of works) {
    if (!w.genres || !w.fam) continue;
    for (const g of w.genres) { const k = normText(g); if (!k || generic.has(k)) continue; const e = by.get(k) || { name: g, count: 0, fam: {} }; e.count++; for (const [i, wt] of Object.entries(w.fam)) e.fam[i] = (e.fam[i] || 0) + wt; by.set(k, e); }
  }
  return [...by.entries()].filter(([, e]) => e.count >= cfg.get('sync.subgenreMinWorks')).sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0])).slice(0, cfg.get('sync.subgenreMax'))
    .map(([k, e]) => { const tot = Object.values(e.fam).reduce((x, y) => x + y, 0) || 1; const parents = Object.entries(e.fam).filter(([, v]) => v / tot >= 0.25).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([i]) => FAMILY_IDS[i]); return { id: 'g:' + slug(e.name), key: k, name: e.name, parents: parents.length ? parents : [FAMILY_IDS[Object.entries(e.fam).sort((a, b) => b[1] - a[1])[0][0]]], derived: true, count: e.count }; });
}

// ---------------------------------------------------------------- connections from sourced relations only
// works: overlaid works. Types: personnel (artist links), influence (Wikidata), other (Last.fm similar), sample (MusicBrainz).
export function buildSyncEdges(state, works, cfg) {
  const byId = new Map(works.map((w) => [w.id, w]));
  const byArtist = new Map(), byQ = new Map(), byName = new Map(), byRec = new Map();
  for (const w of works) {
    const f = state.facts[w.id]; if (!f) continue;
    for (const m of f.artistMbids || []) { if (!byArtist.has(m)) byArtist.set(m, []); byArtist.get(m).push(w); const q = state.artists[m]?.wikidata; if (q) byQ.set(q, m); }
    if (w.artist) { const k = normText(w.artist); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(w); }
    for (const r of f.recordings || []) byRec.set(r, w.id);
  }
  const edges = new Map(); const add = (a, b, type, sim) => { if (!a || !b || a === b) return; const k = a + '|' + b + '|' + type, k2 = b + '|' + a + '|' + type; if (type !== 'influence' && type !== 'sample' && edges.has(k2)) { if (edges.get(k2).sim < sim) edges.get(k2).sim = sim; return; } const old = edges.get(k); if (!old || old.sim < sim) edges.set(k, { a, b, type, sim: Math.round(sim * 100) / 100, src: 'sync' }); };
  // nearest-year pair between two artists' works; for influence prefer influencer first
  const pair = (A, B, ordered) => { let best = null; for (const x of A) for (const y of B) { const dx = Number.isFinite(x.year) && Number.isFinite(y.year) ? y.year - x.year : 0; const score = Math.abs(dx) + (ordered && dx < 0 ? 1000 : 0); if (!best || score < best.s) best = { x, y, s: score }; } return best; };
  const linkSim = cfg.get('sync.linkSim');
  for (const [m, a] of Object.entries(state.artists)) {
    const mine = byArtist.get(m); if (!mine) continue;
    for (const r of a.rels || []) { const theirs = byArtist.get(r.mbid); if (theirs) { const p = pair(mine, theirs, false); add(p.x.id, p.y.id, 'personnel', linkSim); } }
    if (cfg.get('sync.fetchInfluence') && a.wikidata) for (const qi of state.wd[a.wikidata]?.influencedBy || []) { const im = byQ.get(qi); const theirs = im && byArtist.get(im); if (theirs && im !== m) { const p = pair(theirs, mine, true); add(p.x.id, p.y.id, 'influence', linkSim); } }
    if (cfg.get('sync.fetchSimilar')) for (const s of a.similar || []) {
      if (s.match < cfg.get('sync.similarMin')) continue;
      const theirs = (s.mbid && byArtist.get(s.mbid)) || byName.get(normText(s.name)); if (theirs && !theirs.some((t) => mine.includes(t))) { const p = pair(mine, theirs, false); add(p.x.id, p.y.id, 'other', s.match); }
    }
  }
  // samples: only when the sampled recording is on another library work and both years are known and differ, so the arrow points forward in time
  let skippedSamples = 0;
  for (const w of works) for (const s of state.facts[w.id]?.sampleRels || []) {
    const other = byId.get(byRec.get(s.to)); if (!other || other.id === w.id) continue;
    if (!Number.isFinite(w.year) || !Number.isFinite(other.year) || w.year === other.year) { skippedSamples++; continue; }
    const [a, b] = other.year < w.year ? [other, w] : [w, other]; add(a.id, b.id, 'sample', cfg.get('sync.sampleSim'));
  }
  state.syncEdges = [...edges.values()];
  return { count: state.syncEdges.length, skippedSamples };
}

// ---------------------------------------------------------------- what is left to fetch
// scope 'library' = heard or scouted works, 'all' = every work. Returns [{id, steps:[...]}] heard first.
export function enrichmentQueue(state, works, cfg, scope = 'library') {
  const scouted = new Set(state.scouted);
  const out = [];
  for (const w of works) {
    if (scope === 'library' && !w.heard && !scouted.has(w.id)) continue;
    const f = state.facts[w.id], steps = [];
    if (f?.unmatched && !w.mbid) { continue; }
    if (!f?.steps?.rg) steps.push(w.mbid || f?.mbid ? 'rg' : 'match');
    if (cfg.get('sync.fetchCredits') && !f?.steps?.credits) steps.push('credits');
    const am = f?.artistMbids?.[0];
    if (cfg.get('sync.fetchArtists') && (!am || !state.artists[am]?.steps?.artist)) steps.push('artist');
    if (steps.length) out.push({ id: w.id, steps, heard: !!w.heard });
  }
  return out.sort((a, b) => b.heard - a.heard);
}
export const needPopularity = (state) => [...new Set(Object.values(state.facts).filter((f) => f.mbid && !f.popularity).map((f) => f.mbid))];
export function needWikidata(state, cfg) {
  const want = new Set();
  for (const a of Object.values(state.artists)) { if (a.wikidata && (cfg.get('sync.fetchInfluence') || false)) want.add(a.wikidata); }
  if (cfg.get('sync.fetchPlaces')) for (const p of Object.values(state.places)) if (p.wikidata) want.add(p.wikidata);
  return [...want].filter((q) => !state.wd[q]);
}
export const needSimilar = (state) => Object.values(state.artists).filter((a) => !a.steps?.similar).map((a) => ({ mbid: a.mbid, name: a.name }));

// For the Sync screen.
export function syncSummary(state, works) {
  const mine = works.filter((w) => w.source !== 'seed' || w.heard || state.scouted.includes(w.id));
  const seed = works.filter((w) => w.source === 'seed');
  const count = (fn) => works.filter(fn).length;
  return {
    total: works.length, verified: count((w) => w.verified), unverifiedSeed: seed.filter((w) => !w.verified).length, imported: count((w) => state.imports[w.id]),
    unmatched: count((w) => state.facts[w.id]?.unmatched), pending: count((w) => w.pending), withCredits: count((w) => state.facts[w.id]?.steps?.credits), withPlace: count((w) => !!w.place && w.verified),
    artists: Object.keys(state.artists).length, places: Object.keys(state.places).length, edges: state.syncEdges.length, relevant: mine.length,
    bySource: Object.fromEntries(['listenbrainz', 'lastfm', 'discogs', 'musicbrainz'].map((p) => [p, Object.values(state.imports).filter((i) => i.sources[p]).length])),
    failures: Object.entries(state.sync.failures).slice(-10).map(([k, v]) => ({ key: k, ...v })), runs: state.sync.runs.slice(-8)
  };
}
export const logRun = (state, run) => { state.sync.runs.push(run); if (state.sync.runs.length > 30) state.sync.runs.shift(); };
