// Parsers for the responses of the services Strata syncs with. Pure: JSON in, plain objects out. No network, no state.
// Shapes follow each service's documentation (MusicBrainz API, ListenBrainz API, Last.fm API, Discogs API, Wikidata wbgetentities).
// They read defensively: a missing field gives null or an empty list, never a throw. Fixtures in test/ are written to those documented shapes,
// NOT captured from the live services, so the first live run is the real check.

const words = (s) => String(s || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
const arr = (x) => (Array.isArray(x) ? x : []);
export const yearOf = (d) => { const m = /^(\d{4})/.exec(String(d || '')); return m ? Number(m[1]) : null; };
export const qidFromUrl = (u) => { const m = /wikidata\.org\/(?:wiki|entity)\/(Q\d+)/i.exec(String(u || '')); return m ? m[1] : null; };
const creditName = (ac) => arr(ac).map((c) => (c.name || c.artist?.name || '') + (c.joinphrase || '')).join('').trim();
const creditMbids = (ac) => arr(ac).map((c) => c.artist?.id).filter(Boolean);
const tagList = (xs) => arr(xs).map((t) => ({ name: String(t.name), count: Number(t.count) || 0 })).filter((t) => t.name);

// ---- MusicBrainz
export function parseSearch(json) {
  return arr(json?.['release-groups']).map((r) => ({ mbid: r.id, title: r.title, artist: creditName(r['artist-credit']), artistMbids: creditMbids(r['artist-credit']), year: yearOf(r['first-release-date']), type: r['primary-type'] || null, secondary: arr(r['secondary-types']), tags: tagList(r.tags), score: Number(r.score) || 0 }));
}
export function parseReleaseGroup(json) {
  if (!json || !json.id) return null;
  return { mbid: json.id, title: json.title, artist: creditName(json['artist-credit']), artistMbids: creditMbids(json['artist-credit']), year: yearOf(json['first-release-date']), type: json['primary-type'] || null, secondary: arr(json['secondary-types']), genres: tagList(json.genres), tags: tagList(json.tags), releases: arr(json.releases).map((r) => ({ id: r.id, date: r.date || '', status: String(r.status || '').toLowerCase() })) };
}
// Earliest official release (releases without a date sort last); falls back to the earliest of any status.
export function pickRelease(releases) {
  const key = (r) => (r.date ? r.date : '9999');
  const pool = releases.filter((r) => r.status === 'official'); const use = pool.length ? pool : releases;
  return use.slice().sort((a, b) => key(a).localeCompare(key(b)))[0]?.id || null;
}
export function parseRelease(json, cfg) {
  if (!json) return null;
  const prod = words(cfg.get('sync.producerTypes')), play = words(cfg.get('sync.playerTypes')), samp = words(cfg.get('sync.sampleTypes'));
  const producers = new Map(), players = new Map(), recordings = [], sampleRels = [];
  const visit = (rels, recId) => {
    for (const r of arr(rels)) {
      const type = String(r.type || '').toLowerCase(), target = r['target-type'];
      if (target === 'artist' && r.artist?.name) {
        const name = r.artist.name, key = name.toLowerCase();
        if (prod.includes(type) && !producers.has(key)) producers.set(key, name);
        if (play.includes(type)) { if (!players.has(key)) players.set(key, { name, attrs: new Set() }); arr(r.attributes).forEach((a) => players.get(key).attrs.add(String(a))); }
      } else if (target === 'recording' && r.recording?.id && samp.includes(type) && recId) {
        sampleRels.push({ from: recId, to: r.recording.id, title: r.recording.title || null, artist: creditName(r.recording['artist-credit']) || null, direction: r.direction || null, type });
      }
    }
  };
  visit(json.relations, null);
  for (const m of arr(json.media)) for (const t of arr(m.tracks)) { const rec = t.recording; if (!rec?.id) continue; recordings.push(rec.id); visit(rec.relations, rec.id); }
  return { releaseId: json.id || null, credits: { producers: [...producers.values()], players: [...players.values()].map((p) => (p.attrs.size ? `${p.name} · ${[...p.attrs].join(', ')}` : p.name)) }, recordings, sampleRels };
}
export function parseArtist(json, cfg) {
  if (!json || !json.id) return null;
  const area = (a) => (a && a.id ? { id: a.id, name: a.name || null } : null);
  const links = words(cfg.get('sync.artistRelTypes')); let wikidata = null; const rels = [];
  for (const r of arr(json.relations)) {
    const type = String(r.type || '').toLowerCase();
    if (r['target-type'] === 'url' && type === 'wikidata') wikidata = qidFromUrl(r.url?.resource) || wikidata;
    else if (r['target-type'] === 'artist' && r.artist?.id && links.includes(type)) rels.push({ type, mbid: r.artist.id, name: r.artist.name || null });
  }
  return { mbid: json.id, name: json.name, type: json.type || null, country: json.country || null, area: area(json.area), beginArea: area(json['begin-area']), lifeSpan: { begin: json['life-span']?.begin || null, end: json['life-span']?.end || null, ended: !!json['life-span']?.ended }, genres: tagList(json.genres), tags: tagList(json.tags), wikidata, rels };
}
export function parseArea(json) {
  if (!json || !json.id) return null;
  let wikidata = null; for (const r of arr(json.relations)) if (r['target-type'] === 'url' && String(r.type).toLowerCase() === 'wikidata') wikidata = qidFromUrl(r.url?.resource) || wikidata;
  return { id: json.id, name: json.name || null, type: json.type || null, wikidata };
}
export function parseMbCollections(json) { return arr(json?.collections).map((c) => ({ id: c.id, name: c.name, type: c['entity-type'] || c.type || null, count: Number(c['release-group-count'] ?? c['release-count'] ?? c.count) || null })); }
const rgRecord = (r, source) => ({ source, sourceId: r.id, mbid: r.id, title: r.title, artist: creditName(r['artist-credit']), artistMbids: creditMbids(r['artist-credit']), year: yearOf(r['first-release-date']), type: r['primary-type'] || null, secondary: arr(r['secondary-types']), genres: tagList(r.genres), tags: tagList(r.tags) });
export function parseMbReleaseGroups(json, source = 'musicbrainz') { return { items: arr(json?.['release-groups']).map((r) => rgRecord(r, source)), count: Number(json?.['release-group-count']) || null }; }
// A collection of releases: each release names its release group
export function parseMbReleasesAsGroups(json, source = 'musicbrainz') { return { items: arr(json?.releases).map((r) => r['release-group']).filter((g) => g && g.id).map((g) => rgRecord({ ...g, 'artist-credit': g['artist-credit'] || [] }, source)), count: Number(json?.['release-count']) || null }; }

// ---- ListenBrainz
export function parseListenBrainzGroups(json) {
  const p = json?.payload; if (!p) return { items: [], total: 0 };
  return { total: Number(p.total_release_group_count) || 0, items: arr(p.release_groups).map((r) => ({ source: 'listenbrainz', sourceId: r.release_group_mbid || null, mbid: r.release_group_mbid || null, title: r.release_group_name, artist: r.artist_name, artistMbids: arr(r.artist_mbids), listens: Number(r.listen_count) || 0 })) };
}
export function parsePopularity(json) { const out = {}; for (const r of arr(json)) if (r?.release_group_mbid) out[r.release_group_mbid] = { listens: r.total_listen_count ?? null, listeners: r.total_user_count ?? null }; return out; }

// ---- Last.fm
export function parseLastfmTopAlbums(json) {
  const t = json?.topalbums; if (!t) return { items: [], page: 1, totalPages: 1 };
  const a = Array.isArray(t.album) ? t.album : t.album ? [t.album] : [];
  return { page: Number(t['@attr']?.page) || 1, totalPages: Number(t['@attr']?.totalPages) || 1, items: a.map((x) => ({ source: 'lastfm', sourceId: x.mbid || null, mbid: x.mbid || null, title: x.name, artist: typeof x.artist === 'string' ? x.artist : x.artist?.name, artistMbids: x.artist?.mbid ? [x.artist.mbid] : [], listens: Number(x.playcount) || 0 })) };
}
export function parseLastfmSimilar(json) { const a = json?.similarartists?.artist; return (Array.isArray(a) ? a : a ? [a] : []).map((x) => ({ name: x.name, mbid: x.mbid || null, match: Number(x.match) || 0 })); }

// ---- Discogs. Collection items are releases; merge pressings of one master. Rating 0 means unrated.
const cleanDiscogs = (n) => String(n || '').replace(/\s\(\d+\)$/, '').trim();
export function parseDiscogsCollection(json) {
  const out = new Map();
  for (const r of arr(json?.releases)) {
    const b = r.basic_information || {}, key = b.master_id ? 'm' + b.master_id : 'r' + b.id;
    const rec = { source: 'discogs', sourceId: key, mbid: null, title: b.title, artist: cleanDiscogs(arr(b.artists)[0]?.name), artistMbids: [], year: Number(b.year) || null, rating: Number(r.rating) || 0, addedAt: r.date_added ? Date.parse(r.date_added) || null : null, genres: arr(b.genres).map((name) => ({ name, count: 1 })), styles: arr(b.styles).map((name) => ({ name, count: 1 })) };
    const prev = out.get(key);
    if (!prev) out.set(key, rec); else { prev.rating = Math.max(prev.rating, rec.rating); prev.year = Math.min(prev.year || 9999, rec.year || 9999) || null; if (rec.addedAt && (!prev.addedAt || rec.addedAt < prev.addedAt)) prev.addedAt = rec.addedAt; }
  }
  return { items: [...out.values()], pages: Number(json?.pagination?.pages) || 1 };
}

// ---- Wikidata wbgetentities (props=claims). Returns {Q: {lat, lon, influencedBy:[Q...]}}
export function parseWikidata(json, cfg) {
  const coord = cfg.get('sync.coordProperty'), infl = cfg.get('sync.influenceProperty'), out = {};
  for (const [q, e] of Object.entries(json?.entities || {})) {
    const c = arr(e?.claims?.[coord])[0]?.mainsnak?.datavalue?.value;
    out[q] = { lat: Number.isFinite(c?.latitude) ? c.latitude : null, lon: Number.isFinite(c?.longitude) ? c.longitude : null, influencedBy: arr(e?.claims?.[infl]).map((x) => x?.mainsnak?.datavalue?.value?.id).filter(Boolean) };
  }
  return out;
}
