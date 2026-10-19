# Data sources and accounts

Checked against each service's documentation in October 2026. Re-check terms before relying on any of this. The sync section below says exactly what was and was not confirmed.

| Service | Account | Use | Notes |
|---|---|---|---|
| MusicBrainz | Free, optional for reads | Albums, EPs, credits, relationships (producer, sample, cover) | About 1 request per second. Send a descriptive app name. Collections need an account. |
| ListenBrainz | Same login as MusicBrainz | Collaborative filtering, similarity, playlists (JSPF) | Playlists are track-based. Keep your album "keep" list in a MusicBrainz collection. |
| Discogs | Free account, optional personal token | Your collection with genres, styles and ratings | Token raises the rate limit (25 to 60 a minute, per Discogs). Strata no longer uses Discogs owner counts; rarity comes from ListenBrainz listeners. |
| Last.fm | Free API key | Tags, similar artists | Non-commercial by default; check current terms. Tags are noisy. |
| Wikipedia / Wikidata | None | Bios, "influenced by" | Wikipedia text is CC BY-SA: show attribution (the app does). |
| Cover Art Archive | None | Cover art by MusicBrainz id (the app finds the id with one MusicBrainz search per work, cached) | Requests are queued one at a time to respect the MusicBrainz rate. |
| Deezer / iTunes Search | None | 30 second previews | Deezer's API has no CORS headers, so it needs a small proxy. iTunes Search usually works directly. |
| RateYourMusic | n/a | Genre tree inspiration only | No public API. Registering interest in API/dataset access is possible. Do not scrape. |
| Bandcamp | n/a | "Listen here" links | No public API. |

## Bios
Wikipedia first, then MusicBrainz annotations, then Discogs notes. Always show the source and link.

## Time bias
Recommendations weight the last 50 years more (`quests.recentBias`, `quests.recentYearsWindow`). Chronicles may reach back to 1900 (`quests.earliestYear`).

## Sync: endpoints used, and what is confirmed

All calls go through `src/sync/http.js` (per-host spacing, 429 and 503 retry, optional proxy). Credentials are stored under `strata.accounts.v1`, not in settings or the save.

| Use | Request | Status |
|---|---|---|
| ListenBrainz library | `GET /1/stats/user/{user}/release-groups?count&offset&range=all_time`, response `payload.release_groups[]` with `release_group_mbid`, `release_group_name`, `artist_name`, `artist_mbids`, `listen_count`; 204 when stats are not ready; `Authorization: Token ...` | Confirmed in docs |
| ListenBrainz popularity | `POST /1/popularity/release-group` with `{"release_group_mbids": [...]}`, response items with `total_listen_count`, `total_user_count` | Confirmed in docs |
| ListenBrainz rate limit | `X-RateLimit-Remaining` and `X-RateLimit-Reset-In` headers are honoured | Confirmed in docs |
| MusicBrainz lookups | `release-group/{id}?inc=artist-credits+genres+tags+releases`, `release/{id}?inc=artist-credits+artist-rels+recordings+recording-rels+recording-level-rels`, `artist/{id}?inc=genres+tags+artist-rels+url-rels`, `area/{id}?inc=url-rels`, search, browse by `artist` and `collection` | Request forms from the MusicBrainz API docs |
| MusicBrainz limits | About one request a second per IP, no matter the User-Agent. Browsers cannot set a User-Agent; a normal browser one is not on the anonymous list. Digest auth is being retired in favour of OAuth2 | Confirmed in docs. Strata has no OAuth login flow: a pasted access token is accepted for private collections |
| MusicBrainz relationship names | Producer (artist to release and to recording), Samples material (recording to recording), Vocal, member of band | The names exist. The lowercase `type` strings in the JSON (`producer`, `instrument`, `vocal`, `samples material`, `member of band`, `collaboration`) are assumed to match and are editable in settings (`sync.*Types`) |
| Last.fm library | `method=user.getTopAlbums&user&api_key&format=json&limit&page&period`, response `topalbums.album[]` and `@attr.totalPages` | Request and response confirmed |
| Last.fm similar | `method=artist.getSimilar&mbid`, response `similarartists.artist[]` with `match` | NOT confirmed in this session; parsed defensively |
| Last.fm errors | Error codes 10 and 26 are treated as auth failures | NOT confirmed; from memory |
| Discogs collection | `GET /users/{user}/collection/folders/0/releases?per_page&page`, items with `rating` and `basic_information` (`master_id`, `title`, `year`, `artists`, `genres`, `styles`), `pagination.pages`; header `Authorization: Discogs token=...`; trailing " (2)" on artist names is removed | `master_id`, `styles`, `rating`, `basic_information` and pagination confirmed; the other fields are standard but not re-checked |
| Wikidata | `action=wbgetentities&ids=Q..|Q..&props=claims&format=json&origin=*`; `P625` coordinate location | `origin=*` and `P625` confirmed |
| Wikidata influence | `P737` "influenced by" | NOT confirmed in this session; editable in `sync.influenceProperty` |
| Area type | A place whose type is `Country` is not pinned unless `sync.placeAllowCountry` is on | Type string assumed |
| CORS | Whether MusicBrainz, ListenBrainz, Last.fm and Discogs allow browser requests | NOT confirmed. Use `sync.proxyTemplate` if the browser blocks them |

Tests use synthetic fixtures written to these shapes (`test/fixtures.js`). They prove Strata's parsing and logic, not that a live service answers this way. Run a small import and verify first and read the Sync screen's problem list.
