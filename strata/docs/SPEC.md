# Strata spec

Status key: **Built** = in code and tested in Node. **Drafted** = in code, never run in a browser. **Settings** = tunables exist, logic does not. **Planned** = not started.

## 1. The map

- Albums and EPs only (`recs.albumsEpsOnly`). Bias toward the last 50 years, chronicles may reach back to 1900. **Settings**
- Seven genre families sit on a fixed ring around a central shelf hub. Each family is a hue; where two meet you see the blend. Subgenres shift lightness. **Built** (hue mixing), **Drafted** (territory glow)
- Works rest on a hex lattice but are not assigned a point: a force simulation finds where they want to be, then each work snaps to the nearest free point. Weakly related links get a longer spring, so related-but-not-very works sit a few points apart. Lattice dots are visible for now (`layout.showHexDots`). **Built**
- Default spacing is large (120 px) so lines have lanes between works. **Built**
- Alternate layouts over the same data: time (x = year, a lane per family), credits (works that share a producer or player are pulled together), place (by city). Header tabs. Time needs the Era Lens, Credits the Personnel graph, Place the Place overlay (`shop.gateViews`). Fog is computed on the genre layout, so other views show only works already revealed and skip the fog layer. **Built** (layouts), **Drafted** (drawing)

## 2. Tiles

- Rarity is a colored ring around the art: Mainstream, Essential, Cult, Niche, Deep cut, Ghost. White, green, blue, purple, orange, pale cyan by default. **Drafted**
- Badges replace Underground, Landmark and Canon as rarity names. Icons use the work's ring color and a different symbol per badge. Nine so far: Canon, Landmark, Underground, Gateway, Deep end, Origin, Crossover, Wellspring, Rediscovered. Each has an XP multiplier and a mastery multiplier in settings. **Built** (data and multipliers), **Drafted** (icons)
- Art of heard works is dimmed; unheard art is bright (`ui.seenDim`). No white ring. Real cover art comes from the Cover Art Archive, loaded one at a time (`data.fetchCovers`); a coloured initials tile shows until it arrives. **Drafted**
- Recency is a small gauge in the tile corner: full for a week, half at 60 days, minimum after a year. Genre labels show "visited N days ago". **Built** (math), **Drafted** (drawing)
- Hover over art shows a play button for a 30-second preview. No waveform. **Drafted**

## 3. Connections

- Relation types: influence (read as "precedent" from the later work and "inspired" from the earlier one), contemporary, personnel, sample, other. **Built**
- Names show only on hover of the line or its works (`routing.labelsOnHoverOnly`). **Drafted**
- Lines are straight runs joined by rounded corners. Straights follow the three hex axes (0, 60 and 120 degrees) in lanes half a row from the tiles, so they never cross a work. This replaces "orthogonal or diagonal" at 45 degrees, because 45 degree lanes do not stay between tiles on a hex lattice. **Built**
- Each tile has six ports. Several lines can leave from different ports, so 30 lines never land on one point. **Built**
- Bundling: many lines to or from one work share a trunk (same port, same first lane) and curve off where they must. **Built**
- Two works with a third between them route around it on the lanes. **Built** (lanes are always between tiles)
- Known tuning issue: fan-in leaves on opposite sides of a hub produce a through-lane with a stub in. Cost knobs: `routing.turnPenalty`, `routing.overlapPenalty`, `routing.portPenalty`.

## 4. Spotlight and selection

- Hovering a work or line dims everything else and lights the associated works. **Drafted**
- Selecting shows the work and everything within `spotlight.chainDepth` links. Which relation types continue the chain is toggled in the legend (precedent, inspired, contemporary, personnel, sample). Multiple works can be selected with the multi-select key. **Built** (logic), **Drafted** (legend)

## 5. Fog of war

- Fog is driven by depth, not by count. Silhouettes: faint "?" tiles for fogged works just past a revealed edge (`fog.silhouetteExtra`, `fog.silhouetteMax`). **Drafted**
- Fog is driven by depth, not by count. Each genre family has a mastery score from the works you have heard, weighted by tier, rating and badges, with diminishing returns per tier. **Built**
- A tier unlocks in a genre when mastery reaches its threshold and you have heard enough works in the tier below or rarer (`tiers.*.unlockMastery`, `tiers.*.prereqWorks`). **Built**
- A heard work pushes the fog back by `fog.baseSteps` plus a bonus that grows with its tier and with how deep you are in that genre, and can reveal works up to `fog.tierAhead` tiers rarer, capped by what the genre has unlocked. So:
  - A few mainstream hits reveal Essential works and then a Cult one as depth grows.
  - A pile of niches outposts a couple of neighbors but cannot unlock deep cuts without the tiers below.
  - Being deep across tiers pulls rare works into view.
  **Built** (tests cover each case)
- Scouted works (from growing the tree, a chronicle that has begun, a dowsing rod or a rarity roll) are visible whatever the tier. Flares lift the fog around a hex and show everything in it. **Built**
- Charters: a family charter treats the family as having unlocked tier 1 (mainstream and essential). A subgenre charter shows that subgenre's works up to the tier the family has unlocked. **Built** (this is my reading of "charters", change it if you meant something else)
- Per-subgenre depth is a flag (`fog.perSubgenre`), off. **Settings**

## 6. Mastery wheel

One slice per genre family, rings outward are rarity tiers. Mainstream is lit from the start; unlocks light up outer segments, a partial arc shows progress to the next ring. See `docs/mastery-wheel.svg`. Drawn live in the Progress screen next to fog reveal per territory and the taste signature (six axes: rhythm drive, harmonic density, lo-fi grit, vocal focus, obscurity, era spread; dashed shape is `taste.compareDays` ago). **Built** (math), **Drafted** (screen). Clickable wheel **Planned**.

## 7. Rating

- Vertical bar along the left edge of the info panel. Clean bar; hovering shows light / decent / strong labels. Left, middle and right thirds of an integer slice give light, decent, strong. Near a border you get light/decent 8, decent/strong 8, or strong 8 / light 9. **Built**
- Numeric value: decent = n, light = n minus step, strong = n plus step (`rating.subStep`). Ratings above `recs.ratingNeutral` pull recommendations toward similar works; below push away. **Built** (bar), **Settings** (recs)

## 8. XP, points, progression

- Everything is earned by discovery behavior, never listening hours. Sources: rating, reach (first work in a family or subgenre), rarity, lineage and credit-hops, chains, Foundations, chronicles, surprise (rating far from the model's prediction), rested bonus after time away. **Built** (rating XP, chains, rested, surprise against a similarity-weighted prediction, leaps, lineage depth, credit hops, daily cap, quest XP). Reach also counts a first work in a subgenre.
- Threads, not streaks: each followed line has its own chain; jumping elsewhere pauses it, never resets it. Chain bonus caps (`xp.chainCap`). Nothing is ever deducted. **Built**. Rating a work next to your latest one along an enabled connection type extends a thread; otherwise it starts one (named "<first work> lineage" and so on). You can also start one by hand. Threads appear in the bar at the bottom; the most recently extended is active, the rest are paused.
- Every XP and point value is exposed in Settings with an explanation. **Built**

## 9. Quests

- Chronicles (one-time historical stories): the Amen Break, Native Tongues, Berlin 1977, two capitals of punk, sampling in court, sound systems to rave, and others reaching back to 1900. Each adds culture context and rewards XP, points and an era lens. **Built** (logic), content: six chronicles of 5 to 8 works, memberships from memory. Beginning one puts its works on the map. Finishing pays XP, points and lens charges (`quests.chronicleLensCharges`).
- Repeatables: weekly gateway, credit hop, counterpoint, blind-spot probe, re-listen (weekly or monthly ones wait for the next period), Foundations run (per genre, once). **Built**. Foundations sets are drawn from works badged canon, landmark, origin or gateway, up to `quests.foundationsSize`, so they are smaller than 7 until the catalogue grows.

## 10. Unlocks and consumables

- Permanent, slow (days to months): Credits Lens, secondary credits free after N lookups, Era Lens, Wormholes, Personnel graph, Place overlay, subgenre charters (need Foundations in the parent), family charters. Optional minimum-time gates. **Built** (Credits Lens, Era Lens, Wormholes, Personnel graph, Place overlay, family and subgenre charters). The Credits Lens lets you reveal a work's producers, players and samples; each reveal costs a lens charge, guests and players go free after `shop.secondaryCreditsUses` lookups, and a Wellspring work shows its samples. Wormholes: without them, growing from a work only reaches works that share a family with it (`recs.wormholesRequired`).
- Repeatable packs: lens packs, scout flares, dowsing rods, rarity rolls. When a pack runs out, earn more through targeted or general quests. **Built**: lens packs, scout flares (click the map), dowsing rods (nearest unheard work predicted at or above `shop.dowseMinPredicted`), rarity rolls (one work a tier beyond what a family has unlocked), slot tokens.
- Respec is always free. Export is never an unlock.

## 11. Map slots

Slots are only initial placement. Off by default (`slots.enabled`). When on, placing a work on the map costs one; the shelf is always unlimited. Models to compare: open (off) and earned (on). **Built** (capacity from level, chronicles, Foundations and tokens; heard works must be placed to show).

## 12. Data and sync

Nothing in the app is made up at run time. Facts come from a source, are stored with a timestamp (`facts`, `artists`, `places`, `wd` in the save) and are laid over the starter catalogue. See `docs/DATA_SOURCES.md` for every endpoint and what is and is not verified.

- **Accounts** (Sync screen): ListenBrainz, Last.fm, Discogs and MusicBrainz collections, each through its official API with your own username, token or key. Credentials live in their own storage key, never in settings or the save, so exports cannot leak them. **Built** (logic and fake-network tests), **Drafted** (live calls)
- **No scraping.** RateYourMusic forbids it and has no public API; Bandcamp has no public API. Neither is a source.
- **Import** adds your library as heard but unrated and awards no XP. Only Discogs ratings come with a rating (1 to 5, scaled by `sync.discogsRatingScale`); nothing else supplies one and none is invented. Works are matched by MusicBrainz id, else by artist and title with edition words ignored. Works with no recognisable genre wait on the shelf for you to pick a family. **Built**
- **Verify** works through a resumable queue: match or look up each work in MusicBrainz (title, artist, first release year, genres, tags), read credits and sample links from the earliest official release, read each artist (origin, relations, Wikidata link), find origin coordinates through Wikidata, ask ListenBrainz for listener counts (sets the rarity tier) and Last.fm for similar artists. One shared client spaces MusicBrainz requests at `sync.delayMs.musicbrainz`. Failures are recorded per work and the run goes on; three network failures in a row, an auth refusal or a rate limit stop it. **Built**
- **Facts replace memory.** Once a work is verified its year, genres, credits and place come from the source; remembered credits and places are dropped, not kept beside them. Family weights are recomputed from verified genres using editable keyword lists (`sync.tags.*`) unless you picked the family by hand.
- **Subgenres come from data.** A verified genre carried by `sync.subgenreMinWorks` works becomes a subgenre, and so a charter. **Built**
- **Connections only from sourced relations:** artist relations (member of band, collaboration) and Wikidata "influenced by" between artists in your library, Last.fm similar artists, and sample relations between recordings that are both in your library (arrow forward in time, skipped when years tie or are unknown). No connection is inferred beyond that. **Built**
- **Starter catalogue.** The built-in works, connections, chronicles and badges were written from memory. They are flagged "Unverified" and `sync.unverifiedSeed` can hide the unheard ones, all starter connections and any chronicle that needs a hidden work. **Built**
- **More by this artist** fetches the artist's albums and EPs from MusicBrainz and adds them as unheard. **Built** (logic), **Drafted** (UI)
- Bios from Wikipedia with attribution. Cover art from the Cover Art Archive. **Drafted**
- If a browser blocks a service (CORS), set `sync.proxyTemplate` to a proxy you run. A failed request says whether it looks like CORS.

## 12b. Library

"+ Add something I've heard" searches MusicBrainz for albums and EPs, fills genre families from tags, guesses a tier from ListenBrainz listener counts (otherwise `data.defaultTier`), and links the work to its most similar neighbours. Added works are stored in the save. The tier guess now comes from ListenBrainz listener counts (`sync.listenersMin.*`) when the work has a MusicBrainz id. **Built** (classify, tier, link, dedupe), **Drafted** (search UI, network).

## 13b. Mockup items not carried over

The Progression mockup's level unlocks (Deep dial, Time-lapse, Share map) and the Economy mockup's tier names (Landmark and Underground as tiers) are superseded by sections 2 and 14. Levels carry a title (`ui.levelTitles`) and map slots, nothing else.

## 14. Removed since the first mockup

Discovery dial, waveform, "sample another track", the heard/unheard white ring, time-lapse, export-as-unlock, open-ended pack of fixed slot counts.
