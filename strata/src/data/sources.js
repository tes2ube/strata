// Network helpers for the panels: bio, preview, cover art, panel facts and album search. NOT exercised in a real browser.
// Anything that touches MusicBrainz goes through the shared throttled client from src/sync/http.js (set once with setHttp),
// so the panels and the sync engine can never exceed MusicBrainz's one request a second between them.
import { parseSearch } from '../core/syncparse.js';

let http = null;
export const setHttp = (h) => { http = h; };

const cache = (key, ttlDays) => {
  try { const v = JSON.parse(localStorage.getItem('strata.cache.' + key) || 'null'); if (v && Date.now() - v.t < ttlDays * 864e5) return v.d; } catch { /* ignore */ }
  return undefined;
};
const store = (key, d) => { try { localStorage.setItem('strata.cache.' + key, JSON.stringify({ t: Date.now(), d })); } catch { /* quota */ } };
const MB = 'https://musicbrainz.org/ws/2/';
const mb = (path) => http.request('musicbrainz', `${MB}${path}${path.includes('?') ? '&' : '?'}fmt=json`, { allow404: true });

// Release group lookup for the info panel: genres, tags and relation count for the one work on screen.
export async function lookupReleaseGroup(work, cfg) {
  const key = `rg.${work.mbid || work.artist + '.' + work.title}`; const hit = cache(key, cfg.get('data.cacheDays')); if (hit !== undefined) return hit;
  try {
    let id = work.mbid;
    if (!id) { const s = parseSearch(await mb(`release-group/?query=${encodeURIComponent(`releasegroup:"${work.title}" AND artist:"${work.artist}"`)}&limit=1`)); id = s[0]?.mbid; if (!id) return null; }
    const full = await mb(`release-group/${id}?inc=artist-rels+url-rels+tags+genres`); if (!full) return null;
    const out = { mbid: id, genres: (full.genres || []).map((g) => g.name), tags: (full.tags || []).map((t) => t.name), relations: full.relations || [] };
    store(key, out); return out;
  } catch { return null; }
}

// Bio from Wikipedia (CC BY-SA: show attribution in the UI). Tries "Title (Artist album)" first.
export async function fetchBio(title, artist, cfg) {
  if (!cfg.get('data.useWikipedia')) return null;
  const key = `bio.${artist}.${title}`; const hit = cache(key, cfg.get('data.cacheDays')); if (hit !== undefined) return hit;
  for (const t of [`${title} (${artist} album)`, `${title} (album)`, title]) {
    try {
      const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t.replace(/ /g, '_'))}`);
      if (!r.ok) continue; const j = await r.json();
      if (j.type === 'disambiguation' || !j.extract) continue;
      const out = { text: j.extract.slice(0, cfg.get('data.bioMaxChars')), url: j.content_urls?.desktop?.page, source: 'Wikipedia (CC BY-SA)' };
      store(key, out); return out;
    } catch { /* try next */ }
  }
  return null;
}

// 30-second previews. Deezer's public API does not send CORS headers, so it needs a tiny proxy; iTunes Search works directly in most browsers.
export async function fetchPreview(title, artist, cfg) {
  const prov = cfg.get('data.previewProvider'); if (prov === 'none') return null;
  const key = `prev.${prov}.${artist}.${title}`; const hit = cache(key, cfg.get('data.cacheDays')); if (hit !== undefined) return hit;
  try {
    if (prov === 'itunes') {
      const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist + ' ' + title)}&entity=song&limit=5`);
      const j = await r.json(); const t = j.results?.find((x) => x.previewUrl); const out = t ? { url: t.previewUrl, track: t.trackName } : null; store(key, out); return out;
    }
    const r = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(`artist:"${artist}" album:"${title}"`)}&limit=5`);
    const j = await r.json(); const t = j.data?.find((x) => x.preview); const out = t ? { url: t.preview, track: t.title } : null; store(key, out); return out;
  } catch { return null; }
}

// Free-text search for albums and EPs (the add dialog). Returns parsed candidates {mbid, title, artist, year, type, tags, score}.
export async function searchReleaseGroups(text, cfg) {
  const key = `search.${text.toLowerCase()}`; const hit = cache(key, 1); if (hit !== undefined) return hit;
  try {
    const s = parseSearch(await mb(`release-group/?query=${encodeURIComponent(text)}&limit=${cfg.get('data.searchLimit') * 3}`));
    const out = s.filter((r) => ['Album', 'EP'].includes(r.type) && !r.secondary.includes('Live') && (cfg.get('recs.includeCompilations') || !r.secondary.includes('Compilation'))).slice(0, cfg.get('data.searchLimit'));
    store(key, out); return out;
  } catch { return []; }
}

// Cover Art Archive URL for a work. Looks up the MusicBrainz id first if the work has none (one search call, cached).
export async function coverUrlFor(work, cfg) {
  if (!cfg.get('data.fetchCovers')) return null;
  const size = cfg.get('data.coverSize'); let mbid = work.mbid;
  if (!mbid) {
    const key = `mbid.${work.artist}.${work.title}`; const hit = cache(key, cfg.get('data.cacheDays'));
    if (hit !== undefined) mbid = hit; else {
      try { mbid = parseSearch(await mb(`release-group/?query=${encodeURIComponent(`releasegroup:"${work.title}" AND artist:"${work.artist}"`)}&limit=1`))[0]?.mbid || null; store(key, mbid); } catch { return null; }
    }
  }
  return mbid ? `https://coverartarchive.org/release-group/${mbid}/front-${size}` : null;
}
