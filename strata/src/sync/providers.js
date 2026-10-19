// Providers: where your own data comes from. Each uses the service's official API with your account. Nothing here scrapes a web page.
// RateYourMusic and Bandcamp are not providers: they have no public API and RateYourMusic forbids scraping.
// A provider returns normalized records ({source, sourceId, title, artist, artistMbids, mbid, year, listens, rating, addedAt, genres, styles}).
import { SyncError } from './http.js';
import { parseListenBrainzGroups, parseLastfmTopAlbums, parseDiscogsCollection, parseMbCollections, parseMbReleaseGroups, parseMbReleasesAsGroups } from '../core/syncparse.js';

const enc = encodeURIComponent;
const cap = (cfg) => cfg.get('sync.maxImport');

export const PROVIDERS = {
  listenbrainz: {
    label: 'ListenBrainz', host: 'listenbrainz', required: ['username'],
    fields: [{ key: 'username', label: 'Username' }, { key: 'token', label: 'User token (optional)', secret: true }],
    help: 'Imports the release groups you listen to most, with listen counts. The token comes from your ListenBrainz profile page; it is optional for reading stats but gives higher rate limits.',
    async fetchLibrary({ account, http, cfg, signal, onProgress }) {
      const base = 'https://api.listenbrainz.org', headers = account.token ? { Authorization: `Token ${account.token}` } : {}, count = 100, out = []; let offset = 0, total = 0, empty = false;
      for (;;) {
        const json = await http.request('listenbrainz', `${base}/1/stats/user/${enc(account.username)}/release-groups?count=${count}&offset=${offset}&range=all_time`, { headers, signal });
        if (!json) { empty = offset === 0; break; }   // 204: statistics have not been calculated for this user yet
        const page = parseListenBrainzGroups(json); total = page.total || total; out.push(...page.items); onProgress?.({ fetched: out.length, total });
        if (page.items.length < count || out.length >= cap(cfg) || (total && out.length >= total)) break; offset += count;
      }
      return { records: out.slice(0, cap(cfg)), note: empty ? 'ListenBrainz has not calculated statistics for this user yet.' : null };
    },
    async test({ account, http, signal }) {
      if (account.token) { const j = await http.request('listenbrainz', `https://api.listenbrainz.org/1/validate-token?token=${enc(account.token)}`, { signal }); return j?.valid ? { ok: true, message: `Token valid for ${j.user_name}.` } : { ok: false, message: 'ListenBrainz says that token is not valid.' }; }
      const j = await http.request('listenbrainz', `https://api.listenbrainz.org/1/stats/user/${enc(account.username)}/release-groups?count=1&range=all_time`, { signal });
      return { ok: true, message: j ? 'Reached ListenBrainz.' : 'Reached ListenBrainz (no statistics calculated for this user yet).' };
    }
  },
  lastfm: {
    label: 'Last.fm', host: 'lastfm', required: ['username', 'apiKey'],
    fields: [{ key: 'username', label: 'Username' }, { key: 'apiKey', label: 'API key', secret: true }],
    help: 'Imports your top albums and, when verifying, asks Last.fm for similar artists. You need an API key from a Last.fm API account.',
    async call(http, account, params, signal) {
      const q = new URLSearchParams({ ...params, api_key: account.apiKey, format: 'json' });
      const j = await http.request('lastfm', `https://ws.audioscrobbler.com/2.0/?${q}`, { signal });
      if (j && j.error) throw new SyncError(j.error === 10 || j.error === 26 ? 'auth' : 'http', `Last.fm: ${j.message || 'error ' + j.error}`, null, 'lastfm');
      return j;
    },
    async fetchLibrary({ account, http, cfg, signal, onProgress }) {
      const out = []; let page = 1, totalPages = 1;
      do {
        const j = await PROVIDERS.lastfm.call(http, account, { method: 'user.getTopAlbums', user: account.username, period: cfg.get('sync.lastfmPeriod'), limit: 200, page }, signal);
        const p = parseLastfmTopAlbums(j); totalPages = p.totalPages; out.push(...p.items); onProgress?.({ fetched: out.length, total: null }); page++;
      } while (page <= totalPages && out.length < cap(cfg));
      return { records: out.slice(0, cap(cfg)), note: null };
    },
    async test({ account, http, signal }) { await PROVIDERS.lastfm.call(http, account, { method: 'user.getTopAlbums', user: account.username, limit: 1 }, signal); return { ok: true, message: 'Last.fm accepted the key and user.' }; },
    async similar({ account, http, mbid, signal }) { return PROVIDERS.lastfm.call(http, account, { method: 'artist.getSimilar', mbid, limit: 50 }, signal); }
  },
  discogs: {
    label: 'Discogs', host: 'discogs', required: ['username'],
    fields: [{ key: 'username', label: 'Username' }, { key: 'token', label: 'Personal token (optional)', secret: true }],
    help: 'Imports your whole collection (folder "All") with genres, styles and your 1 to 5 star ratings. A public collection works without a token; the token (from your Discogs developer settings) raises the rate limit.',
    async fetchLibrary({ account, http, cfg, signal, onProgress }) {
      const headers = account.token ? { Authorization: `Discogs token=${account.token}` } : {}, out = []; let page = 1, pages = 1;
      do {
        const j = await http.request('discogs', `https://api.discogs.com/users/${enc(account.username)}/collection/folders/0/releases?per_page=100&page=${page}`, { headers, signal });
        const p = parseDiscogsCollection(j); pages = p.pages; out.push(...p.items); onProgress?.({ fetched: out.length, total: null }); page++;
      } while (page <= pages && out.length < cap(cfg));
      return { records: out.slice(0, cap(cfg)), note: 'Discogs lists pressings, so years here are pressing years. They are replaced by the first release year when the work is verified.' };
    },
    async test({ account, http, signal }) {
      const headers = account.token ? { Authorization: `Discogs token=${account.token}` } : {};
      await http.request('discogs', `https://api.discogs.com/users/${enc(account.username)}/collection/folders/0/releases?per_page=1`, { headers, signal }); return { ok: true, message: 'Reached your Discogs collection.' };
    }
  },
  musicbrainz: {
    label: 'MusicBrainz collections', host: 'musicbrainz', required: ['username'],
    fields: [{ key: 'username', label: 'Username' }, { key: 'collectionIds', label: 'Collection ids (comma separated, empty = all release-group collections)' }, { key: 'accessToken', label: 'OAuth access token for private collections (optional, advanced)', secret: true }],
    help: 'Imports the MusicBrainz collections you name. Public collections need no login. Collections can be wishlists, so choose which ones count as heard. Private collections need an OAuth access token; Strata has no login flow for that yet, so paste one if you have it.',
    headers: (a) => (a.accessToken ? { Authorization: `Bearer ${a.accessToken}` } : {}),
    async listCollections({ account, http, signal }) {
      const inc = account.accessToken ? '&inc=user-collections' : '';
      const j = await http.request('musicbrainz', `https://musicbrainz.org/ws/2/collection?editor=${enc(account.username)}&fmt=json${inc}`, { headers: PROVIDERS.musicbrainz.headers(account), signal });
      return parseMbCollections(j);
    },
    async fetchLibrary({ account, http, cfg, signal, onProgress }) {
      const headers = PROVIDERS.musicbrainz.headers(account);
      const all = await PROVIDERS.musicbrainz.listCollections({ account, http, signal });
      const wanted = account.collectionIds ? account.collectionIds.split(',').map((x) => x.trim()).filter(Boolean) : all.filter((c) => c.type === 'release-group').map((c) => c.id);
      const out = []; const seen = new Set();
      for (const id of wanted) {
        const type = all.find((c) => c.id === id)?.type || 'release-group'; let offset = 0;
        for (;;) {
          const url = type === 'release' ? `https://musicbrainz.org/ws/2/release?collection=${enc(id)}&inc=release-groups&limit=100&offset=${offset}&fmt=json` : `https://musicbrainz.org/ws/2/release-group?collection=${enc(id)}&inc=artist-credits+genres+tags&limit=100&offset=${offset}&fmt=json`;
          const j = await http.request('musicbrainz', url, { headers, signal });
          const p = type === 'release' ? parseMbReleasesAsGroups(j) : parseMbReleaseGroups(j);
          for (const r of p.items) if (!seen.has(r.mbid)) { seen.add(r.mbid); out.push(r); }
          onProgress?.({ fetched: out.length, total: null });
          if (!p.items.length || (type === 'release' ? j?.releases?.length : j?.['release-groups']?.length) < 100 || out.length >= cap(cfg)) break; offset += 100;
        }
      }
      return { records: out.slice(0, cap(cfg)).filter((r) => ['Album', 'EP'].includes(r.type) || !r.type), note: wanted.length ? null : 'No release-group collections found for that user.' };
    },
    async test({ account, http, signal }) { const c = await PROVIDERS.musicbrainz.listCollections({ account, http, signal }); return { ok: true, message: `Found ${c.length} collection${c.length === 1 ? '' : 's'}: ${c.map((x) => `${x.name} (${x.type}, ${x.id})`).join('; ') || 'none'}` }; }
  }
};
export const PROVIDER_IDS = Object.keys(PROVIDERS);
