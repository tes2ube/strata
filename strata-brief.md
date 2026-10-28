# Strata: brief for the next session

Strata (working title) is a music discovery tree. Albums and EPs are tiles on a hex-snapped map, genres are hues, rarity is a colored ring, and fog of war depends on how deep you are in each genre. It is a zero-dependency JavaScript app: ES modules, Canvas2D, no build step except `tools/build-app.js`, which bundles everything into one `Strata.html`. The GitHub repo is the source of truth, and `docs/SPEC.md` is the source of truth for design decisions.

## Working rules (from the owner)

- Every tunable number, color, name or toggle lives in `src/settings/definitions.js` and is read with `cfg.get('group.key')`. Never hardcode values.
- `src/core` stays pure: no DOM, no network. When a rule changes, update or add a test.
- No dependencies unless the owner agrees.
- Never scrape sites that forbid it (RateYourMusic in particular). Use official APIs only.
- Deliver changes as a zip of only the files that changed, plus new files. Do not paste code into the chat. Say which files changed and what to re-run (`npm test` rebuilds `Strata.html`, which must be committed).
- You cannot run the owner's browser. Say plainly what is untested. If the owner uploads the repo, run `npm test` for real before delivering, and patch files in place rather than rewriting them blind.
- Write plainly. No em dashes. Keep chat replies short.

## Where things stand

Done and delivered in three batches, all committed to the repo. Batches 1 and 2 were never run in a browser or through `npm test`. Treat them as unverified, and run the suite first.

**Batch 1 (UI cleanup):**
- Settings no longer collapse when you edit a value.
- Nav buttons show a selected state.
- Shelf, Quests and Shop slide in from the left.
- The status readout moved above the threads bar.
- The legend now filters which line types are drawn when nothing is selected, and adds a "similar" toggle.
- Rarity names in the legend have a colored ring.
- Wikipedia bios are accepted only when the page description says album or EP.

**Batch 2 (rating and scoring):**
- 10-segment rating bar with diagonal stripes in white, purple, red, blue, gray and black. The top rating is plain "10". Hovering shows thirds ticks and a snapping marker.
- Predicted rating is hidden behind `ui.showPrediction` (off by default).
- Rarity listener thresholds are now 10000 / 2500 / 600 / 120, and ghost means 10 listeners or fewer (`sync.ghostMaxListeners`). These are guesses, not calibrated against live data.
- Progress is four quadrants, and the mastery wheel expands on click.

**Batch 3 (library):**
- Demo-mode toggle, with a blank canvas on first visit. Saves without a `demo` flag load with the demo on.
- Remove added works, add several works, and paste a list of `Artist - Title` lines.
- Bundles: `src/core/bundles.js`, stored in `state.bundles`. Members collapse into one work, the rating is the average until you rate the bundle, and the parts' connections move to the bundle.
- Known gaps: a bundled work can't be verified until unbundled; rating a bundle does not tick its parts off chronicles; the panel buttons and the bundle's double outline have not been seen on screen.

## What is left, in suggested order

### Batch 4a: genres (highest risk, do it with the repo and tests running)

The owner wants these 13 genre families: ambient/score, blues, classical, country, dance, electronic, folk, hip hop, jazz, pop, r&b, soul/funk, rock. Today there are 7: hiphop, funksoul, pop, rock, electronic, ambient, jazz. The lack of genres causes miscategorization.

- Subgenres show as little gravity wells (a pull toward a point inside the family territory), not just labels.
- New genres can be added at run time without knowing them in advance. Works are then checked against the new genre's keywords to see if they might belong.
- Work families are stored as `{familyIndex: weight}`, and the seed data, added works in saves, and many tests use indexes 0 to 6. Moving to 13 needs a **save migration** that maps old indexes to new ids, and a seed and test update. Better: key by family id instead of index, with a migration for old saves.
- Touch points: `FAMILY_IDS` and `famDefaults`/`traitDefaults` in `definitions.js`, `src/data/tagmap.js` (keywords), `sync.tags.*` settings, `src/data/seed.js` (every `fam`), anchors in `layout.js` (ring of N anchors), `wheelSvg`, the taste signature traits, `html.js` family picker, and tests in `core.test.js`, `game.test.js`, `sync.test.js`, `layout.test.js`.
- Also correct the starter tiers the owner named: Relient K is niche, JID's The Forever Story is cult, Bulldawg is cult, MUNA is at best niche, Kids by The Midnight is a deep cut. Verified popularity data currently overrides a starter work's tier after Sync, so protect hand-set starter tiers from that, or decide what wins.
- Also: tier model. Aesop Rock's Black Hole Superette is niche. His The Impossible Kid is cult. Rarity should bias away from "unknown".

### Batch 4b: layout and onboarding

1. **Genre focus.** A control to focus one genre: it moves to the center and the others ring it. Genre names must not be hidden behind works (draw labels on top).
2. **Core versus experimental by distance from the center.** Replace the `fog.perSubgenre` experimental flag. Closer to the center means more mainstream or core, and further out means experimental. Planned signal: a "coreness" score from tier plus experimental tags. Confirm the signal with the owner.
3. **Staged tutorial.** A getting-started mode that releases the normal interaction loop over several hours of play, tied to the first levels of XP.
   - Start with 1 work and its relationships, then walk through step 2, and so on.
   - Clearly show where you are in the onboarding.
   - Show a "next unlock" readout naming the next feature.
   - Explain each part more clearly.
   - The time, credits and place views are already locked behind purchases. This is about the core loop.
4. **8-direction line routing.** The owner wants connection lines on 8 directions (45 degree diagonals), preferring vertical and horizontal, with the fewest turns and never a 90 degree turn.
   - The owner describes each work centered on point 5 of a 3x3 grid, with neighboring works sharing edge points. Legal paths: 1-4-7, 1-2-3, 1-2-6, 1-2-6-9. Illegal: 2-6-8, 2-3-6-9-8.
   - The owner suggested starting from a bezier between two works and snapping it to the angles to pick the fewest-turn route.
   - **Unresolved, ask the owner first:** the spec says 45 degree lanes do not stay between tiles on a horizontal-row hex lattice, because a vertical line in a row runs into the tile above. Ask whether the works should sit on a lattice where vertical channels stay clear (pointy-top columns), or whether lines should run in the gaps and bend around tiles. A small diagram of one work and its six neighbors would settle it.
   - Current routing lives in `src/core/routing.js` (three hex axes, lanes half a row from tiles, bundling of shared trunks). Tests are in `test/layout.test.js`.

### Smaller owner requests still open

- Sync matching and starter tiers: see batch 4a.
- Subgenre and "chains follow" behavior are done. Check the legend still works after the genre change.
- Rewrite `docs/SPEC.md` sections that changed: rating bar (7), routing (3), genres and the map (1), progress (6), data and sync (12), plus the new library and bundle behavior. Also regenerate `docs/SETTINGS.md` and `docs/mastery-wheel.svg` with `npm run docs`.

## First steps for the new session

1. Ask the owner to upload the repo as a zip (or work from the GitHub copy if it is available), then run `npm install` is not needed; run `npm test`.
2. Fix anything batches 1 to 3 broke. Report failures plainly.
3. Ask the routing lattice question, and confirm the "coreness" signal, before building 4b.
4. Do 4a before 4b, with a save migration test first.
