// Test fixtures. SYNTHETIC: written to the response shapes in each service's documentation, with made-up ids and numbers.
// They check Strata's parsing and logic, not that the live services still answer this way.
export const lbPage = { payload: { total_release_group_count: 2, release_groups: [
  { artist_mbids: ['a-nas'], artist_name: 'Nas', listen_count: 50, release_group_mbid: 'rg-illmatic', release_group_name: 'Illmatic (Deluxe Edition)' },
  { artist_mbids: ['a-new'], artist_name: 'Test Artist', listen_count: 7, release_group_mbid: 'rg-new', release_group_name: 'A New Record' }] } };
export const lastfmPage = { topalbums: { album: [{ name: 'Illmatic', playcount: '12', mbid: '', artist: { name: 'Nas', mbid: 'a-nas' }, '@attr': { rank: '1' } }], '@attr': { user: 'u', page: '1', perPage: '200', totalPages: '1', total: '1' } } };
export const discogsPage = { pagination: { page: 1, pages: 1, per_page: 100, items: 2 }, releases: [
  { instance_id: 1, date_added: '2020-05-01T10:00:00-07:00', rating: 4, basic_information: { id: 11, master_id: 500, title: 'Illmatic', year: 1996, artists: [{ name: 'Nas' }], genres: ['Hip Hop'], styles: ['Boom Bap'] } },
  { instance_id: 2, date_added: '2021-01-01T10:00:00-07:00', rating: 0, basic_information: { id: 12, master_id: 500, title: 'Illmatic', year: 2014, artists: [{ name: 'Nas' }], genres: ['Hip Hop'], styles: [] } },
  { instance_id: 3, date_added: '2019-02-02T10:00:00-07:00', rating: 5, basic_information: { id: 13, master_id: 0, title: 'Solo Thing', year: 2001, artists: [{ name: 'Someone (2)' }], genres: ['Jazz'], styles: ['Bop'] } }] };
export const mbRg = {
  'rg-illmatic': { id: 'rg-illmatic', title: 'Illmatic', 'first-release-date': '1994-04-19', 'primary-type': 'Album', 'secondary-types': [], 'artist-credit': [{ name: 'Nas', joinphrase: '', artist: { id: 'a-nas', name: 'Nas' } }], genres: [{ name: 'hip hop', count: 12 }, { name: 'east coast hip hop', count: 5 }], tags: [{ name: 'rap', count: 3 }], releases: [{ id: 'rel-late', date: '2002-01-01', status: 'Official' }, { id: 'rel-first', date: '1994-04-19', status: 'Official' }, { id: 'rel-boot', date: '1993-01-01', status: 'Bootleg' }] },
  'rg-new': { id: 'rg-new', title: 'A New Record', 'first-release-date': '2020', 'primary-type': 'Album', 'artist-credit': [{ name: 'Test Artist', artist: { id: 'a-new', name: 'Test Artist' } }], genres: [], tags: [{ name: 'polka', count: 1 }], releases: [] } };
export const mbRelease = { id: 'rel-first', relations: [{ type: 'producer', 'target-type': 'artist', artist: { id: 'p1', name: 'DJ Premier' }, attributes: [] }, { type: 'engineer', 'target-type': 'artist', artist: { id: 'p2', name: 'Not Counted' } }],
  media: [{ tracks: [{ recording: { id: 'rec-1', title: 'Track', relations: [{ type: 'instrument', 'target-type': 'artist', artist: { id: 'p3', name: 'Olu Dara' }, attributes: ['trumpet'] }, { type: 'producer', 'target-type': 'artist', artist: { id: 'p1', name: 'dj premier' } }, { type: 'samples material', 'target-type': 'recording', recording: { id: 'rec-sampled', title: 'Some Sampled Track' }, direction: 'backward' }] } }] }] };
export const mbArtist = { id: 'a-nas', name: 'Nas', type: 'Person', country: 'US', area: { id: 'area-us', name: 'United States' }, 'begin-area': { id: 'area-nyc', name: 'New York' }, 'life-span': { begin: '1973-09-14', ended: false }, genres: [{ name: 'hip hop', count: 9 }], tags: [],
  relations: [{ type: 'wikidata', 'target-type': 'url', url: { resource: 'https://www.wikidata.org/wiki/Q1' } }, { type: 'collaboration', 'target-type': 'artist', artist: { id: 'a-new', name: 'Test Artist' } }, { type: 'married', 'target-type': 'artist', artist: { id: 'a-x', name: 'Ignored' } }] };
export const mbArea = { id: 'area-nyc', name: 'New York', type: 'City', relations: [{ type: 'wikidata', 'target-type': 'url', url: { resource: 'https://www.wikidata.org/wiki/Q60' } }] };
export const wikidata = { entities: { Q60: { claims: { P625: [{ mainsnak: { datavalue: { value: { latitude: 40.7, longitude: -74 } } } }] } }, Q1: { claims: { P737: [{ mainsnak: { datavalue: { value: { id: 'Q2' } } } }] } }, Q2: { claims: {} } } };
export const popularity = [{ release_group_mbid: 'rg-illmatic', total_listen_count: 100000, total_user_count: 30000 }];
export const mbSearchHit = { 'release-groups': [{ id: 'rg-found', score: 100, title: 'Solo Thing', 'primary-type': 'Album', 'artist-credit': [{ name: 'Someone', artist: { id: 'a-solo', name: 'Someone' } }], 'first-release-date': '2001-06-01', tags: [{ name: 'jazz', count: 4 }] }] };
export const lastfmSimilar = { similarartists: { artist: [{ name: 'Test Artist', mbid: 'a-new', match: '0.8' }, { name: 'Weak', mbid: 'a-weak', match: '0.1' }] } };

// A fake fetch: routes = [[regex, (url, init) => ({status?, json?, headers?})]]. Records every call.
export function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, init = {}) => {
    calls.push({ url, init });
    for (const [re, h] of routes) if (re.test(url)) {
      const r = await h(url, init); const status = r.status ?? 200, hd = r.headers || {};
      if (r.throw) throw r.throw;
      return { status, ok: status >= 200 && status < 300, headers: { get: (k) => hd[k] ?? null }, json: async () => { if (r.badJson) throw new Error('bad'); return r.json; } };
    }
    return { status: 404, ok: false, headers: { get: () => null }, json: async () => ({}) };
  };
  fn.calls = calls; return fn;
}

// The whole fake network the engine tests and the app smoke test use. Routes passed in `extra` win over the defaults.
export function network(extra = []) {
  return fakeFetch([
    ...extra,
    [/api\.listenbrainz\.org\/1\/stats\/user\//, () => ({ json: lbPage })],
    [/api\.listenbrainz\.org\/1\/popularity/, () => ({ json: popularity })],
    [/ws\/2\/release-group\/\?query=/, (u) => ({ json: /Solo/.test(decodeURIComponent(u)) ? mbSearchHit : { 'release-groups': [] } })],
    [/ws\/2\/release-group\/(rg-[a-z]+)\?/, (u) => ({ json: mbRg[/release-group\/(rg-[a-z]+)/.exec(u)[1]] })],
    [/ws\/2\/release\/rel-first/, () => ({ json: mbRelease })],
    [/ws\/2\/artist\/a-nas/, () => ({ json: mbArtist })],
    [/ws\/2\/artist\/a-new/, () => ({ json: { id: 'a-new', name: 'Test Artist', relations: [] } })],
    [/ws\/2\/area\/area-nyc/, () => ({ json: mbArea })],
    [/wikidata\.org\/w\/api\.php/, () => ({ json: wikidata })],
    [/ws\.audioscrobbler\.com/, () => ({ json: lastfmSimilar })],
  ]);
}
