# Strata (working title)

A music discovery tree: albums and EPs as tiles on a hex-snapped map, grown outward from works you already know.
Genres are hues, rarity is a ring around the art, fog of war hides what you have not earned the depth to see.

Zero dependencies. ES modules and Canvas2D. No build step.

## Run it

Double-click **`Strata.html`**. It opens in your default browser. It is one self-contained file: no server, no install, no other files. Put it somewhere permanent and make a bookmark or a desktop shortcut to it.

Notes:
- Use a current Chrome, Edge or Firefox. Keep the file in one place: some browsers (Firefox especially) tie your saved progress to the file's location, so moving it can look like losing your save. **Progress, Export save** writes a backup file, and **Import save** restores it.
- If your browser blocks storage for local files the app still runs, and says so in the header. Progress then lasts only until the tab closes, so export before you quit.
- The first time you sync, some services may refuse requests from a file opened from disk. Sync reports that plainly. The fix is a request proxy (Settings, Sync and accounts).

`Strata.html` is generated. Do not edit it by hand: it is built from `index.html` and `src/` by `npm run build`, and `npm test` rebuilds it first and runs the app code from the built file too.

For development (needs Node 20+; Python 3 only for the optional dev server):

```bash
cd strata
npm run build       # regenerates Strata.html
npm test            # 81 tests: layout, routing, fog, rating, XP, spotlight, settings, game rules, quests, shop, views, saving, sync parsing, HTTP client, import, verification against a fake network, the single-file build, and a stub-DOM run of the app (source and built file)
npm run serve       # optional: http://localhost:5173 serves index.html and src/ directly
npm run docs        # regenerates docs/SETTINGS.md and docs/mastery-wheel.svg
```

## What is here

| Path | What |
|---|---|
| `docs/SPEC.md` | Every design decision so far, with status |
| `docs/SETTINGS.md` | All ~300 tunables, generated |
| `docs/DATA_SOURCES.md` | Accounts to make, APIs, rules |
| `docs/mastery-wheel.svg` | The slice-per-genre, ring-per-rarity progress view |
| `src/settings/definitions.js` | The single list of every tunable. The Settings panel and docs are built from it |
| `src/core/` | Pure logic, tested in Node: `hex`, `layout`, `routing`, `fog`, `rating`, `spotlight`, `xp`, `recency`, `badges`, and the game rules: `game` (every action that changes a save), `threads`, `quests`, `shop`, `recs`, `library`, `views`, `stats`, `persist`, `sync` (import, facts, connections) and `syncparse` (response parsers) |
| `src/sync/` | `http` (throttled client), `accounts`, `providers` (ListenBrainz, Last.fm, Discogs, MusicBrainz collections), `engine` (import and resumable verification) |
| `src/data/seed.js` | 70 works with subgenres, credits and places, plus the connections between them |
| `src/data/chronicles.js` | The six one-time chronicles |
| `src/data/sources.js` | Panel helpers: bio, preview, cover art, album search (not yet run, needs a browser) |
| `src/render/html.js` | HTML builders for the panels and modals (smoke-tested in Node) |
| `src/render/app.js` | Canvas2D map and event wiring (run only against a stub DOM, never in a real browser) |
| `tools/build-app.js` | The bundler that makes `Strata.html` |
| `Strata.html` | The built app. Open this one |
| `test/` | `node --test` suites |

## Sync

Open **Sync** in the header. Enter your username and token or key for ListenBrainz, Last.fm, Discogs or MusicBrainz collections, press **Test**, then **Import my library**, then **Start verifying**. Imports add heard but unrated works and give no XP. Verifying replaces the remembered facts in the starter catalogue with sourced ones and fills in genres, artists, credits, places, rarity and connections. It uses the services' official APIs with your account. It does not scrape, and RateYourMusic and Bandcamp are not supported.

## Status

Tested in Node: everything in `src/core`, the HTTP client, the parsers (against synthetic fixtures), import and verification against a fake network, and the app's draw, panel, click and Sync paths against a stub DOM.

Never run for real: how anything looks, and every live call to MusicBrainz, ListenBrainz, Last.fm, Discogs, Wikidata, the Cover Art Archive, Wikipedia and iTunes/Deezer. `docs/DATA_SOURCES.md` lists which request and response shapes were confirmed in the docs and which were not (browser CORS access, Last.fm similar artists and error codes, Wikidata P737, MusicBrainz relation type strings). Do a small first sync and read the problem list.

Not started: OAuth login for private MusicBrainz collections, ListenBrainz playlist sync, the clickable wheel, per-subgenre depth, IndexedDB.

Content caveat: the starter catalogue (works, connections, chronicles, badges) was written from memory. It is flagged unverified in the app and can be hidden under Sync. Verifying replaces its year, genres, credits and place with sourced values; badges and chronicle membership have no source and stay editorial.
