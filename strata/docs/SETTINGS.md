# Settings reference

Generated from `src/settings/definitions.js` (412 settings). Do not edit by hand. Every value is editable in the in-app Settings panel, which is built from the same list.

## XP and points

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `xp.rateBase` | XP per rating | `20` | 0 to 500 | Base XP awarded each time you rate a work you have not rated before. |
| `xp.reRateBase` | XP per re-rating | `8` | 0 to 500 | XP for re-rating a work after the re-listen delay. 0 disables. |
| `xp.reRateDelayDays` | Re-listen delay (days) | `60` | 1 to 3650 days | Days before a re-rating earns XP. |
| `xp.lowRatingFloor` | Low-rating bonus floor | `4` | 0 to 10 | Ratings at or below this earn the low-rating honesty bonus. |
| `xp.lowRatingBonus` | Low-rating bonus (x) | `0.25` | 0 to 2 | Multiplier added when you rate at or below the floor (honest low scores teach the model). |
| `xp.surpriseThreshold` | Surprise threshold (rating points) | `2` | 0.5 to 8 | How far your rating must differ from the model prediction to count as a surprise. |
| `xp.surpriseBonus` | Surprise bonus (x) | `0.5` | 0 to 3 | Multiplier added for a surprise rating. |
| `xp.leapBase` | Leap bonus XP | `40` | 0 to 500 | Flat XP for the first work you rate in a family you have never rated in. |
| `xp.leapSubBase` | Subgenre leap bonus XP | `15` | 0 to 500 | Flat XP for the first work in a subgenre you have never rated in. |
| `xp.chainPerLink` | Chain bonus per link (x) | `0.1` | 0 to 1 | Multiplier added per consecutive linked work in the same thread. |
| `xp.chainCap` | Chain bonus cap (x) | `1` | 0 to 5 | Maximum total chain multiplier added. 1 means up to x2. |
| `xp.chainMinRating` | Minimum rating to extend a chain | `0` | 0 to 10 | Works rated below this still earn XP but do not extend the chain. 0 = always extend. |
| `xp.restedPerDay` | Rested XP stored per day away | `10` | 0 to 200 | Bonus XP pool that grows while you are away. |
| `xp.restedCap` | Rested XP pool cap | `300` | 0 to 5000 | Maximum stored rested XP. |
| `xp.restedRate` | Rested spend rate (x) | `1` | 0 to 5 | Extra XP per rating as a fraction of base, drawn from the pool. |
| `xp.lineageDepthBonus` | Lineage depth bonus | `4` | 0 to 100 | Extra XP per step deep when following precedent chains. |
| `xp.creditHopBonus` | Credit-hop bonus | `6` | 0 to 100 | Extra XP for rating a work reached by following a credit (producer, player, etc.). |
| `xp.dailyXpCap` | Daily XP cap (0 = none) | `0` | 0 to 100000 | Soft cap on XP per day, if you want to slow things down. |
| `xp.levelBase` | XP for level 2 | `200` | 10 to 100000 | XP needed to go from level 1 to 2. |
| `xp.levelGrowth` | Level growth factor | `1.35` | 1 to 3 | Each level needs this many times the XP of the previous. |
| `xp.pointsPerXp` | Points per XP | `0.5` | 0 to 10 | Spendable points earned per XP gained. 0.5 = one point per two XP. |
| `xp.questPointsMult` | Quest points multiplier (x) | `1` | 0 to 10 | Multiplier applied to all quest point rewards. |
| `xp.respecFree` | Respec is free | `true` | boolean | Moving or removing spec choices never costs points. |

## Rarity tiers (rings)

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `tiers.mainstream.name` | Mainstream: name | `Mainstream` | text | Display name of this tier. |
| `tiers.mainstream.color` | Mainstream: ring color | `#F2EFE8` | color | Color of the ring around works of this tier. |
| `tiers.mainstream.xpMult` | Mainstream: XP multiplier | `1` | 0 to 20 | Multiplier on rating XP for works of this tier. |
| `tiers.mainstream.masteryValue` | Mainstream: mastery value | `10` | 0 to 1000 | How much one heard work of this tier adds to its genre mastery (before rating factor and diminishing returns). |
| `tiers.mainstream.unlockMastery` | Mainstream: mastery to unlock | `0` | 0 to 100000 | Genre mastery needed before this tier can appear in that genre. |
| `tiers.mainstream.prereqWorks` | Mainstream: works needed from tier below | `0` | 0 to 50 | Heard works required in the previous tier (or any rarer tier) of that genre before this tier unlocks. Stops you skipping the canon. |
| `tiers.mainstream.fogRadiusBonus` | Mainstream: fog reach bonus (hex steps) | `0.6` | 0 to 10 | Extra hex steps a heard work of this tier pushes the fog back, scaled by genre depth. |
| `tiers.essential.name` | Essential: name | `Essential` | text | Display name of this tier. |
| `tiers.essential.color` | Essential: ring color | `#5ED17B` | color | Color of the ring around works of this tier. |
| `tiers.essential.xpMult` | Essential: XP multiplier | `1.1` | 0 to 20 | Multiplier on rating XP for works of this tier. |
| `tiers.essential.masteryValue` | Essential: mastery value | `14` | 0 to 1000 | How much one heard work of this tier adds to its genre mastery (before rating factor and diminishing returns). |
| `tiers.essential.unlockMastery` | Essential: mastery to unlock | `25` | 0 to 100000 | Genre mastery needed before this tier can appear in that genre. |
| `tiers.essential.prereqWorks` | Essential: works needed from tier below | `3` | 0 to 50 | Heard works required in the previous tier (or any rarer tier) of that genre before this tier unlocks. Stops you skipping the canon. |
| `tiers.essential.fogRadiusBonus` | Essential: fog reach bonus (hex steps) | `0.8` | 0 to 10 | Extra hex steps a heard work of this tier pushes the fog back, scaled by genre depth. |
| `tiers.cult.name` | Cult: name | `Cult` | text | Display name of this tier. |
| `tiers.cult.color` | Cult: ring color | `#4EA8FF` | color | Color of the ring around works of this tier. |
| `tiers.cult.xpMult` | Cult: XP multiplier | `1.25` | 0 to 20 | Multiplier on rating XP for works of this tier. |
| `tiers.cult.masteryValue` | Cult: mastery value | `20` | 0 to 1000 | How much one heard work of this tier adds to its genre mastery (before rating factor and diminishing returns). |
| `tiers.cult.unlockMastery` | Cult: mastery to unlock | `80` | 0 to 100000 | Genre mastery needed before this tier can appear in that genre. |
| `tiers.cult.prereqWorks` | Cult: works needed from tier below | `3` | 0 to 50 | Heard works required in the previous tier (or any rarer tier) of that genre before this tier unlocks. Stops you skipping the canon. |
| `tiers.cult.fogRadiusBonus` | Cult: fog reach bonus (hex steps) | `1` | 0 to 10 | Extra hex steps a heard work of this tier pushes the fog back, scaled by genre depth. |
| `tiers.niche.name` | Niche: name | `Niche` | text | Display name of this tier. |
| `tiers.niche.color` | Niche: ring color | `#B07CFF` | color | Color of the ring around works of this tier. |
| `tiers.niche.xpMult` | Niche: XP multiplier | `1.5` | 0 to 20 | Multiplier on rating XP for works of this tier. |
| `tiers.niche.masteryValue` | Niche: mastery value | `30` | 0 to 1000 | How much one heard work of this tier adds to its genre mastery (before rating factor and diminishing returns). |
| `tiers.niche.unlockMastery` | Niche: mastery to unlock | `300` | 0 to 100000 | Genre mastery needed before this tier can appear in that genre. |
| `tiers.niche.prereqWorks` | Niche: works needed from tier below | `3` | 0 to 50 | Heard works required in the previous tier (or any rarer tier) of that genre before this tier unlocks. Stops you skipping the canon. |
| `tiers.niche.fogRadiusBonus` | Niche: fog reach bonus (hex steps) | `1.2` | 0 to 10 | Extra hex steps a heard work of this tier pushes the fog back, scaled by genre depth. |
| `tiers.deepcut.name` | Deep cut: name | `Deep cut` | text | Display name of this tier. |
| `tiers.deepcut.color` | Deep cut: ring color | `#FF9B3D` | color | Color of the ring around works of this tier. |
| `tiers.deepcut.xpMult` | Deep cut: XP multiplier | `1.9` | 0 to 20 | Multiplier on rating XP for works of this tier. |
| `tiers.deepcut.masteryValue` | Deep cut: mastery value | `45` | 0 to 1000 | How much one heard work of this tier adds to its genre mastery (before rating factor and diminishing returns). |
| `tiers.deepcut.unlockMastery` | Deep cut: mastery to unlock | `900` | 0 to 100000 | Genre mastery needed before this tier can appear in that genre. |
| `tiers.deepcut.prereqWorks` | Deep cut: works needed from tier below | `3` | 0 to 50 | Heard works required in the previous tier (or any rarer tier) of that genre before this tier unlocks. Stops you skipping the canon. |
| `tiers.deepcut.fogRadiusBonus` | Deep cut: fog reach bonus (hex steps) | `1.6` | 0 to 10 | Extra hex steps a heard work of this tier pushes the fog back, scaled by genre depth. |
| `tiers.ghost.name` | Ghost: name | `Ghost` | text | Display name of this tier. |
| `tiers.ghost.color` | Ghost: ring color | `#8CF3E6` | color | Color of the ring around works of this tier. |
| `tiers.ghost.xpMult` | Ghost: XP multiplier | `2.5` | 0 to 20 | Multiplier on rating XP for works of this tier. |
| `tiers.ghost.masteryValue` | Ghost: mastery value | `70` | 0 to 1000 | How much one heard work of this tier adds to its genre mastery (before rating factor and diminishing returns). |
| `tiers.ghost.unlockMastery` | Ghost: mastery to unlock | `2500` | 0 to 100000 | Genre mastery needed before this tier can appear in that genre. |
| `tiers.ghost.prereqWorks` | Ghost: works needed from tier below | `3` | 0 to 50 | Heard works required in the previous tier (or any rarer tier) of that genre before this tier unlocks. Stops you skipping the canon. |
| `tiers.ghost.fogRadiusBonus` | Ghost: fog reach bonus (hex steps) | `2` | 0 to 10 | Extra hex steps a heard work of this tier pushes the fog back, scaled by genre depth. |
| `tiers.diminishing` | Diminishing returns exponent | `0.75` | 0.3 to 1 | Works per tier count as n^exponent toward mastery. Lower = a pile of one tier helps less. |
| `tiers.ratingFloor` | Rating that counts for nothing | `4` | 0 to 10 | At or below this rating a heard work adds no mastery. |
| `tiers.ratingCeil` | Rating that counts fully | `8` | 0 to 10 | At or above this rating a heard work adds its full mastery value (times the top factor). |
| `tiers.ratingTopFactor` | Top rating factor | `1.15` | 0.5 to 3 | Mastery multiplier at or above the full-credit rating. |
| `tiers.ringWidth` | Ring width (px) | `4` | 1 to 12 | Thickness of the rarity ring. |
| `tiers.ringGap` | Ring gap (px) | `1` | 0 to 8 | Gap between art and ring. |

## Badges

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `badges.canon.enabled` | Canon: show badge | `true` | boolean | Cornerstone of a genre. Counts toward Foundations and mastery. |
| `badges.canon.xpMult` | Canon: XP multiplier | `1.5` | 0 to 10 | Multiplier on rating XP when a work carries this badge. |
| `badges.canon.masteryMult` | Canon: mastery multiplier | `1.5` | 0 to 10 | Multiplier on mastery contributed by works with this badge. |
| `badges.landmark.enabled` | Landmark: show badge | `true` | boolean | Changed history. Anchors chronicles and earns chronicle XP. |
| `badges.landmark.xpMult` | Landmark: XP multiplier | `1.3` | 0 to 10 | Multiplier on rating XP when a work carries this badge. |
| `badges.landmark.masteryMult` | Landmark: mastery multiplier | `1` | 0 to 10 | Multiplier on mastery contributed by works with this badge. |
| `badges.underground.enabled` | Underground: show badge | `true` | boolean | Scene-level, outside the mainstream. Counts extra toward deep tiers. |
| `badges.underground.xpMult` | Underground: XP multiplier | `1.2` | 0 to 10 | Multiplier on rating XP when a work carries this badge. |
| `badges.underground.masteryMult` | Underground: mastery multiplier | `1.5` | 0 to 10 | Multiplier on mastery contributed by works with this badge. |
| `badges.gateway.enabled` | Gateway: show badge | `true` | boolean | Easiest way into a genre. Quests reward finishing gateways first. |
| `badges.gateway.xpMult` | Gateway: XP multiplier | `1` | 0 to 10 | Multiplier on rating XP when a work carries this badge. |
| `badges.gateway.masteryMult` | Gateway: mastery multiplier | `1` | 0 to 10 | Multiplier on mastery contributed by works with this badge. |
| `badges.deepend.enabled` | Deep end: show badge | `true` | boolean | Demanding. Earns extra XP for a rating of 7 or higher. |
| `badges.deepend.xpMult` | Deep end: XP multiplier | `1.4` | 0 to 10 | Multiplier on rating XP when a work carries this badge. |
| `badges.deepend.masteryMult` | Deep end: mastery multiplier | `1` | 0 to 10 | Multiplier on mastery contributed by works with this badge. |
| `badges.origin.enabled` | Origin: show badge | `true` | boolean | First of its kind. Counts toward history quests. |
| `badges.origin.xpMult` | Origin: XP multiplier | `1.2` | 0 to 10 | Multiplier on rating XP when a work carries this badge. |
| `badges.origin.masteryMult` | Origin: mastery multiplier | `1` | 0 to 10 | Multiplier on mastery contributed by works with this badge. |
| `badges.crossover.enabled` | Crossover: show badge | `true` | boolean | Bridges two families. Counts toward bridge quests. |
| `badges.crossover.xpMult` | Crossover: XP multiplier | `1.2` | 0 to 10 | Multiplier on rating XP when a work carries this badge. |
| `badges.crossover.masteryMult` | Crossover: mastery multiplier | `1` | 0 to 10 | Multiplier on mastery contributed by works with this badge. |
| `badges.wellspring.enabled` | Wellspring: show badge | `true` | boolean | Heavily sampled or covered. Reveals sample connections. |
| `badges.wellspring.xpMult` | Wellspring: XP multiplier | `1.1` | 0 to 10 | Multiplier on rating XP when a work carries this badge. |
| `badges.wellspring.masteryMult` | Wellspring: mastery multiplier | `1` | 0 to 10 | Multiplier on mastery contributed by works with this badge. |
| `badges.rediscovered.enabled` | Rediscovered: show badge | `true` | boolean | Neglected on release, valued later. Counts toward archaeology quests. |
| `badges.rediscovered.xpMult` | Rediscovered: XP multiplier | `1.2` | 0 to 10 | Multiplier on rating XP when a work carries this badge. |
| `badges.rediscovered.masteryMult` | Rediscovered: mastery multiplier | `1` | 0 to 10 | Multiplier on mastery contributed by works with this badge. |
| `badges.size` | Badge icon size (px) | `16` | 8 to 40 | Size of the badge icon on a tile. |
| `badges.matchRingColor` | Badge color matches ring | `true` | boolean | Badge icons take the color of the work's rarity ring. |

## Fog of war

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `fog.enabled` | Fog of war enabled | `true` | boolean | Turn off to see every recommendation. |
| `fog.baseSteps` | Base reveal radius (hex steps) | `1.5` | 0 to 10 | Reach of any heard work before genre depth is applied. |
| `fog.depthReference` | Depth reference mastery | `1200` | 1 to 100000 | Genre mastery at which depth factor reaches 1.0 (full reach bonus). |
| `fog.tierAhead` | Tiers ahead a work can reveal | `2` | 0 to 5 | A work of tier t can reveal works up to tier t + this, limited by genre unlocks. |
| `fog.scoutSteps` | Scouted radius (hex steps) | `0.8` | 0 to 5 | Small reveal around an unheard work you have scouted. |
| `fog.maxVisiblePerHeard` | Max new works revealed per heard work | `6` | 0 to 100 | Stops one popular album revealing everything nearby. 0 = unlimited. |
| `fog.softness` | Edge softness (px) | `28` | 0 to 100 | Blur on the edge of revealed areas. |
| `fog.opacity` | Fog opacity | `0.9` | 0 to 1 | How dark unexplored areas are. |
| `fog.color` | Fog color | `#070A0E` | color | Color of the fog. |
| `fog.showSilhouettes` | Show silhouettes in fog | `true` | boolean | Faint "?" tiles inside fog suggest something is there. |
| `fog.perSubgenre` | Depth per subgenre (experimental) | `false` | boolean | Compute depth per subgenre as well as family. |
| `fog.parentShare` | Parent share of subgenre mastery | `0.5` | 0 to 1 | Fraction of a subgenre's mastery that also counts toward its parent family. |
| `fog.silhouetteExtra` | Silhouette range (hex steps) | `1.5` | 0 to 6 | Fogged works this close beyond a revealed edge show as a faint "?" tile. |
| `fog.silhouetteMax` | Max silhouettes | `24` | 0 to 500 | Cap on "?" tiles drawn inside the fog. |

## Genre families and colors

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `genres.hiphop.name` | Hip Hop: name | `Hip Hop` | text | Display name. |
| `genres.hiphop.hue` | Hip Hop: hue (0-360) | `20` | 0 to 360 | Color hue of this family. Neighbors blend where they meet. |
| `genres.funksoul.name` | Funk / Soul: name | `Funk / Soul` | text | Display name. |
| `genres.funksoul.hue` | Funk / Soul: hue (0-360) | `48` | 0 to 360 | Color hue of this family. Neighbors blend where they meet. |
| `genres.pop.name` | Pop: name | `Pop` | text | Display name. |
| `genres.pop.hue` | Pop: hue (0-360) | `100` | 0 to 360 | Color hue of this family. Neighbors blend where they meet. |
| `genres.rock.name` | Rock / Indie: name | `Rock / Indie` | text | Display name. |
| `genres.rock.hue` | Rock / Indie: hue (0-360) | `165` | 0 to 360 | Color hue of this family. Neighbors blend where they meet. |
| `genres.electronic.name` | Electronic: name | `Electronic` | text | Display name. |
| `genres.electronic.hue` | Electronic: hue (0-360) | `215` | 0 to 360 | Color hue of this family. Neighbors blend where they meet. |
| `genres.ambient.name` | Ambient / Score: name | `Ambient / Score` | text | Display name. |
| `genres.ambient.hue` | Ambient / Score: hue (0-360) | `265` | 0 to 360 | Color hue of this family. Neighbors blend where they meet. |
| `genres.jazz.name` | Jazz: name | `Jazz` | text | Display name. |
| `genres.jazz.hue` | Jazz: hue (0-360) | `315` | 0 to 360 | Color hue of this family. Neighbors blend where they meet. |
| `genres.saturation` | Territory saturation (%) | `70` | 0 to 100 | Saturation of territory tints and tile colors. |
| `genres.territoryOpacity` | Territory tint opacity | `0.34` | 0 to 1 | Strength of the colored territory glow. |
| `genres.territoryRadius` | Territory radius (px) | `250` | 50 to 800 | Size of each territory glow. |
| `genres.subgenreLightnessStep` | Subgenre lightness step (%) | `6` | 0 to 20 | Lightness shift between a family and each nested subgenre level. |
| `genres.ringRadius` | Anchor ring radius (px) | `340` | 100 to 1000 | Distance of the fixed genre anchors from the center. |
| `genres.wellStrength` | Genre well pull | `0.06` | 0 to 1 | How strongly a family anchor pulls works toward itself. |

## Recency and time

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `recency.fullDays` | Full ring until (days) | `7` | 0 to 365 days | Recency ring is full for this many days after you last engaged. |
| `recency.halfDays` | Half ring at (days) | `60` | 1 to 3650 days | Days at which the ring is half full. |
| `recency.emptyDays` | Minimum ring at (days) | `365` | 2 to 7300 days | Days after which the ring stays at its minimum. |
| `recency.minRing` | Minimum ring fraction | `0.06` | 0 to 0.5 | Smallest ring arc shown. |
| `recency.territoryMode` | Territory recency uses | `latest` | latest / average / median | How a genre's "last visited" is computed. |
| `recency.masteryDecayDays` | Mastery decay starts (days, 0 = never) | `0` | 0 to 7300 | Days of inactivity in a genre before its mastery starts to fade. |
| `recency.masteryDecayPerMonth` | Mastery decay per month (%) | `2` | 0 to 50 | Percent of mastery lost per month after decay starts. |
| `recency.masteryFloor` | Mastery decay floor (%) | `60` | 0 to 100 | Mastery never decays below this percent of its peak. |
| `recency.countOpenAsEngaged` | Opening a work counts as engagement | `true` | boolean | Selecting a work refreshes its ring even without a new rating. |
| `recency.countPlayAsEngaged` | Playing a preview counts as engagement | `true` | boolean | Playing a preview refreshes the ring. |

## Rating bar

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `rating.subStep` | Light/decent/strong step | `0.3` | 0.05 to 0.49 | How far light and strong sit from decent on the numeric scale (light 8 = 8 - step). |
| `rating.borderBand` | Border zone width | `0.16` | 0 to 0.6 | Fraction of each third that counts as the border between two steps. |
| `rating.fillColor` | Bar fill color | `#F2B84B` | color | Color of the filled rating bar. |
| `rating.hoverColor` | Bar hover color | `#FFFFFF` | color | Color of the hover indicator. |
| `rating.min` | Lowest rating | `1` | 0 to 5 | Bottom of the scale. |
| `rating.max` | Highest rating | `10` | 5 to 100 | Top of the scale. |
| `rating.showNumeric` | Show numeric value | `false` | boolean | Show the decimal value next to the label. |

## Layout and hex grid

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `layout.spacing` | Hex spacing (px) | `120` | 70 to 300 | Distance between neighboring lattice points. Larger = more room for lines. |
| `layout.tileSize` | Tile size (px) | `56` | 24 to 120 | Size of an album tile. |
| `layout.selectedScale` | Selected tile scale | `1.35` | 1 to 3 | Size multiplier for selected works. |
| `layout.showHexDots` | Show hex dots | `true` | boolean | Show the lattice points works snap to. Visible while designing. |
| `layout.hexDotOpacity` | Hex dot opacity | `0.35` | 0 to 1 | Opacity of the lattice dots. |
| `layout.showLaneGrid` | Show connection lanes | `false` | boolean | Faintly draw the secondary grid lines run on. |
| `layout.linkRest` | Link rest length (x spacing) | `1` | 0.5 to 4 | Spring rest length between linked works, in lattice spacings. |
| `layout.relatednessStretch` | Relatedness stretch | `1.5` | 0 to 6 | Extra rest length for weakly related links: rest = base x (1 + stretch x (1 - similarity)). |
| `layout.linkStrength` | Link spring strength | `0.08` | 0 to 1 | Pull of each link. |
| `layout.repulsion` | Repulsion | `1` | 0 to 10 | How hard works push each other apart. |
| `layout.repulsionRange` | Repulsion range (x spacing) | `1.8` | 0.5 to 6 | Distance within which works repel. |
| `layout.iterations` | Simulation steps | `220` | 10 to 5000 | Steps run when the layout updates. |
| `layout.cooling` | Cooling | `0.985` | 0.8 to 0.999 | How quickly movement settles (higher = slower). |
| `layout.massScale` | Rating mass scale | `0.12` | 0 to 1 | How much a heard work's rating weighs in pulling neighbors. |
| `layout.hubRadius` | Center hub radius (px) | `62` | 0 to 300 | Reserved area for the shelf hub in the center. |
| `layout.seed` | Layout seed | `7` | 0 to 99999 | Seed for deterministic layout. Change to reshuffle ties. |
| `layout.animate` | Animate layout changes | `true` | boolean | Smoothly move tiles when the layout changes. |
| `layout.animateMs` | Layout animation (ms) | `600` | 0 to 3000 | Duration of tile movement. |

## Connection lines

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `routing.mode` | Routing mode | `hex` | hex | hex = straights run along the three hex axes (0, 60, 120 degrees), in lanes between works. |
| `routing.cornerRadius` | Corner radius (px) | `18` | 0 to 60 | Roundness where a line turns. |
| `routing.bundle` | Bundle shared connections | `true` | boolean | Lines that share a work run together on one trunk and branch off. |
| `routing.portPenalty` | Shared-port penalty | `60` | 0 to 500 | Cost added when unbundled lines share a port; higher spreads them out. |
| `routing.turnPenalty` | Turn penalty | `10` | 0 to 200 | Cost per turn; higher gives straighter lines. |
| `routing.backtrackPenalty` | Backtrack penalty | `2` | 0 to 10 | Cost multiplier for moving away from the target. |
| `routing.overlapPenalty` | Overlap penalty | `3` | 0 to 20 | Cost per pixel of lane shared with an unrelated connection; higher keeps unrelated lines apart. |
| `routing.width` | Line width (px) | `2` | 0.5 to 8 | Normal line width. |
| `routing.widthSelected` | Line width, selected (px) | `3.2` | 0.5 to 10 | Width when a line is in the spotlight. |
| `routing.arrowSize` | Arrowhead size (px) | `9` | 0 to 30 | Size of arrowheads on directed connections. |
| `routing.labelsOnHoverOnly` | Labels only on hover | `true` | boolean | Connection names show only when you hover a line or its works. |
| `routing.precedent.color` | precedent: color | `#8FB8FF` | color | Line color for this relation type. |
| `routing.precedent.arrow` | precedent: arrowhead | `true` | boolean | Draw an arrowhead for this relation type. |
| `routing.precedent.dash` | precedent: line style | `solid` | solid / dashed / dotted | Solid, dashed or dotted. |
| `routing.inspired.color` | inspired: color | `#F28CC4` | color | Line color for this relation type. |
| `routing.inspired.arrow` | inspired: arrowhead | `true` | boolean | Draw an arrowhead for this relation type. |
| `routing.inspired.dash` | inspired: line style | `solid` | solid / dashed / dotted | Solid, dashed or dotted. |
| `routing.contemporary.color` | contemporary: color | `#7ED6A0` | color | Line color for this relation type. |
| `routing.contemporary.arrow` | contemporary: arrowhead | `false` | boolean | Draw an arrowhead for this relation type. |
| `routing.contemporary.dash` | contemporary: line style | `dashed` | solid / dashed / dotted | Solid, dashed or dotted. |
| `routing.personnel.color` | personnel: color | `#C9B8FF` | color | Line color for this relation type. |
| `routing.personnel.arrow` | personnel: arrowhead | `false` | boolean | Draw an arrowhead for this relation type. |
| `routing.personnel.dash` | personnel: line style | `dotted` | solid / dashed / dotted | Solid, dashed or dotted. |
| `routing.sample.color` | sample: color | `#F2B84B` | color | Line color for this relation type. |
| `routing.sample.arrow` | sample: arrowhead | `true` | boolean | Draw an arrowhead for this relation type. |
| `routing.sample.dash` | sample: line style | `solid` | solid / dashed / dotted | Solid, dashed or dotted. |
| `routing.other.color` | other: color | `#6F7B88` | color | Line color for this relation type. |
| `routing.other.arrow` | other: arrowhead | `true` | boolean | Draw an arrowhead for this relation type. |
| `routing.other.dash` | other: line style | `solid` | solid / dashed / dotted | Solid, dashed or dotted. |

## Hover and selection

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `spotlight.dimOpacity` | Dim opacity | `0.12` | 0 to 1 | Opacity of everything outside the spotlight. |
| `spotlight.hoverDepth` | Hover depth (links) | `1` | 0 to 5 | How many links away from the hovered work stay lit. |
| `spotlight.chainDepth` | Selection chain depth | `3` | 0 to 20 | How many links away from a selected work stay shown. |
| `spotlight.hoverIncludesSelection` | Hover keeps selection lit | `true` | boolean | Selected chains stay lit while hovering something else. |
| `spotlight.multiSelectKey` | Multi-select key | `shift` | shift / ctrl / alt / meta | Hold this key while clicking to add to the selection. |
| `spotlight.followDirected` | Follow direction only | `false` | boolean | Chains follow arrows forward only instead of both ways. |
| `spotlight.follow.precedent` | Chain follows: precedent | `true` | boolean | Whether selection chains continue through this connection type (also toggled in the legend). |
| `spotlight.follow.inspired` | Chain follows: inspired | `true` | boolean | Whether selection chains continue through this connection type (also toggled in the legend). |
| `spotlight.follow.contemporary` | Chain follows: contemporary | `true` | boolean | Whether selection chains continue through this connection type (also toggled in the legend). |
| `spotlight.follow.personnel` | Chain follows: personnel | `true` | boolean | Whether selection chains continue through this connection type (also toggled in the legend). |
| `spotlight.follow.sample` | Chain follows: sample | `true` | boolean | Whether selection chains continue through this connection type (also toggled in the legend). |
| `spotlight.follow.other` | Chain follows: other | `false` | boolean | Whether selection chains continue through this connection type (also toggled in the legend). |
| `spotlight.transitionMs` | Spotlight transition (ms) | `140` | 0 to 1000 | Fade time when the spotlight changes. |

## Views (time, credits, place)

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `views.timeWidth` | Time view width (px) | `3200` | 800 to 20000 | Horizontal span from the earliest to the latest work in the chronological view. |
| `views.laneHeight` | Time view lane height (px) | `260` | 100 to 800 | Vertical distance between genre lanes in the chronological view. |
| `views.placeScale` | Place view scale (px per degree) | `14` | 2 to 60 | How far apart cities sit in the place view. Larger spreads dense cities out. |
| `views.creditsStrength` | Credits view pull | `0.95` | 0 to 1 | Similarity given to two works that share a producer or player, so they sit close in the credits view. |
| `views.showDecades` | Decade markers in time view | `true` | boolean | Draw decade lines and labels in the chronological view. |

## Threads

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `threads.extend.influence` | Threads follow: influence | `true` | boolean | Whether rating a work next to your latest one along this connection type extends a thread. |
| `threads.label.influence` | Thread label word: influence | `lineage` | text | Word added after the first work title to name a thread of this kind. |
| `threads.extend.contemporary` | Threads follow: contemporary | `true` | boolean | Whether rating a work next to your latest one along this connection type extends a thread. |
| `threads.label.contemporary` | Thread label word: contemporary | `scene` | text | Word added after the first work title to name a thread of this kind. |
| `threads.extend.personnel` | Threads follow: personnel | `true` | boolean | Whether rating a work next to your latest one along this connection type extends a thread. |
| `threads.label.personnel` | Thread label word: personnel | `credits` | text | Word added after the first work title to name a thread of this kind. |
| `threads.extend.sample` | Threads follow: sample | `true` | boolean | Whether rating a work next to your latest one along this connection type extends a thread. |
| `threads.label.sample` | Thread label word: sample | `samples` | text | Word added after the first work title to name a thread of this kind. |
| `threads.extend.other` | Threads follow: other | `false` | boolean | Whether rating a work next to your latest one along this connection type extends a thread. |
| `threads.label.other` | Thread label word: other | `trail` | text | Word added after the first work title to name a thread of this kind. |
| `threads.maxKept` | Threads kept | `12` | 1 to 100 | Most threads remembered. The least recently used are dropped first. |
| `threads.minLinks` | Minimum links to show | `0` | 0 to 20 | Threads shorter than this are hidden from the threads bar (they still exist). 0 shows all. |

## Taste signature

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `taste.hiphop.rhythm` | Hip Hop: rhythm | `0.85` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.hiphop.harmonic` | Hip Hop: harmonic | `0.35` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.hiphop.grit` | Hip Hop: grit | `0.55` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.hiphop.vocal` | Hip Hop: vocal | `0.9` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.funksoul.rhythm` | Funk / Soul: rhythm | `0.9` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.funksoul.harmonic` | Funk / Soul: harmonic | `0.6` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.funksoul.grit` | Funk / Soul: grit | `0.45` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.funksoul.vocal` | Funk / Soul: vocal | `0.7` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.pop.rhythm` | Pop: rhythm | `0.6` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.pop.harmonic` | Pop: harmonic | `0.5` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.pop.grit` | Pop: grit | `0.15` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.pop.vocal` | Pop: vocal | `0.9` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.rock.rhythm` | Rock / Indie: rhythm | `0.65` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.rock.harmonic` | Rock / Indie: harmonic | `0.45` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.rock.grit` | Rock / Indie: grit | `0.7` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.rock.vocal` | Rock / Indie: vocal | `0.7` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.electronic.rhythm` | Electronic: rhythm | `0.85` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.electronic.harmonic` | Electronic: harmonic | `0.35` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.electronic.grit` | Electronic: grit | `0.45` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.electronic.vocal` | Electronic: vocal | `0.1` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.ambient.rhythm` | Ambient / Score: rhythm | `0.15` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.ambient.harmonic` | Ambient / Score: harmonic | `0.7` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.ambient.grit` | Ambient / Score: grit | `0.3` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.ambient.vocal` | Ambient / Score: vocal | `0.05` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.jazz.rhythm` | Jazz: rhythm | `0.6` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.jazz.harmonic` | Jazz: harmonic | `0.95` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.jazz.grit` | Jazz: grit | `0.3` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.jazz.vocal` | Jazz: vocal | `0.2` | 0 to 1 | Typical level (0 to 1) of this trait in the family. Works blend their families by weight. |
| `taste.eraSpreadYears` | Era spread: full at (years) | `25` | 3 to 100 | Standard deviation of release years that counts as a full era-spread axis. |
| `taste.compareDays` | Compare against (days ago) | `30` | 1 to 3650 days | The dashed shape shows your signature as it was this many days ago. |

## Map slots

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `slots.enabled` | Limit map slots | `false` | boolean | Off by default while balancing. When on, placing a work costs a slot. |
| `slots.initial` | Starting slots | `24` | 0 to 5000 | Slots available at the start. |
| `slots.perLevel` | Slots per level | `4` | 0 to 500 | Slots gained each level. |
| `slots.perChronicle` | Slots per chronicle | `3` | 0 to 100 | Slots gained per completed chronicle. |
| `slots.perFoundations` | Slots per Foundations run | `5` | 0 to 100 | Slots gained per finished Foundations set. |
| `slots.tokenPoints` | Slot token price (points) | `60` | 0 to 10000 | Cost of one extra slot in the shop. |
| `slots.refundOnRemove` | Refund slot on removal | `true` | boolean | Removing a work from the map returns its slot. |
| `slots.shelfUnlimited` | Shelf unlimited | `true` | boolean | The shelf (heard list) never has a limit. |

## Quests and chronicles

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `quests.chroniclesEnabled` | Chronicles enabled | `true` | boolean | Show one-time historical story quests. |
| `quests.chronicleStepXp` | Chronicle step XP | `60` | 0 to 2000 | XP per work heard in a chronicle. |
| `quests.chronicleCompleteXp` | Chronicle completion XP | `400` | 0 to 20000 | Bonus XP for finishing a chronicle. |
| `quests.chroniclePoints` | Chronicle completion points | `150` | 0 to 10000 | Points for finishing a chronicle. |
| `quests.recentYearsWindow` | Recent window (years) | `50` | 1 to 200 | Works released within this many years count as "recent" for recommendation bias. |
| `quests.recentBias` | Recent bias | `2` | 1 to 10 | Weight multiplier for recent works in recommendations (1 = no bias). |
| `quests.earliestYear` | Earliest year allowed | `1900` | 1850 to 2020 | Chronicles and recommendations may reach back to this year. |
| `quests.weeklyGatewayXp` | Weekly gateway XP | `80` | 0 to 2000 | XP for the weekly gateway quest. |
| `quests.creditHopXp` | Credit hop quest XP | `70` | 0 to 2000 | XP for completing a credit hop. |
| `quests.counterpointXp` | Counterpoint XP | `60` | 0 to 2000 | XP for the counterpoint quest. |
| `quests.blindSpotXp` | Blind-spot probe XP | `60` | 0 to 2000 | XP for rating something in your coolest territory. |
| `quests.reListenXp` | Re-listen quest XP | `50` | 0 to 2000 | XP for the monthly re-listen quest. |
| `quests.foundationsSize` | Foundations set size | `7` | 3 to 25 | Number of cornerstone works per genre. |
| `quests.foundationsXp` | Foundations completion XP | `300` | 0 to 20000 | XP for finishing a genre's Foundations. |
| `quests.weeklyResetDay` | Weekly reset day (0=Sun) | `1` | 0 to 6 | Day repeatable weekly quests refresh. |
| `quests.monthlyResetDay` | Monthly reset day | `1` | 1 to 28 | Day of month monthly quests refresh. |
| `quests.maxActive` | Max active quests | `6` | 1 to 50 | Cap on quests tracked at once. |
| `quests.gatewayMaxFamilyWorks` | Weekly gateway: family works at most | `3` | 1 to 50 | The weekly gateway counts a first rating of an easy work (mainstream or essential) in a family where you have heard fewer than this many. |
| `quests.creditHopLength` | Credit hop length | `3` | 1 to 20 | Works to rate in a row after following credit names for a credit hop to complete. |
| `quests.counterpointMaxSim` | Counterpoint: max similarity | `0.35` | 0 to 1 | A work counts as pushing against your latest top rating when its similarity to that work is at or below this. |
| `quests.counterpointMinRating` | Counterpoint: reference rating | `9` | 1 to 10 | The latest work you rated at least this high is the one to push against. |
| `quests.chronicleLensCharges` | Chronicle reward: lens charges | `2` | 0 to 50 | Lens charges granted for finishing a chronicle. |

## Unlocks and consumables

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `shop.creditsLens` | Credits Lens price | `150` | 0 to 100000 | Points to unlock the Credits Lens. |
| `shop.secondaryCreditsUses` | Secondary credits: lookups to go free | `20` | 0 to 1000 | Credit lookups before secondary credits show for free. |
| `shop.eraLens` | Era Lens price | `120` | 0 to 100000 | Points to unlock the Era Lens. |
| `shop.wormholes` | Wormholes price | `600` | 0 to 100000 | Points for cross-family links. |
| `shop.wormholesChronicles` | Wormholes: chronicles needed | `2` | 0 to 50 | Completed chronicles required. |
| `shop.personnelGraph` | Personnel graph price | `900` | 0 to 100000 | Points for the personnel graph. |
| `shop.placeOverlay` | Place overlay price | `1200` | 0 to 100000 | Points for the geography overlay. |
| `shop.charterSub` | Subgenre charter price | `400` | 0 to 100000 | Points for a subgenre charter. |
| `shop.charterFamily` | Family charter price | `2500` | 0 to 100000 | Points for a whole-family charter. |
| `shop.charterFoundations` | Charter: Foundations needed in parent | `5` | 0 to 25 | Cornerstone works required in the parent genre. |
| `shop.lensPackPrice` | Lens pack price | `120` | 0 to 10000 | Points per lens pack. |
| `shop.lensPackSize` | Lens pack size | `4` | 1 to 100 | Charges per lens pack. |
| `shop.flarePackPrice` | Scout flare pack price | `90` | 0 to 10000 | Points per flare pack. |
| `shop.flarePackSize` | Scout flare pack size | `4` | 1 to 100 | Charges per flare pack. |
| `shop.flareSteps` | Scout flare radius (hex steps) | `2.5` | 0.5 to 10 | How far a flare lifts the fog. |
| `shop.dowsePackPrice` | Dowsing rod pack price | `150` | 0 to 10000 | Points per dowsing pack. |
| `shop.dowsePackSize` | Dowsing rod pack size | `2` | 1 to 100 | Charges per dowsing pack. |
| `shop.dowseMinPredicted` | Dowsing: minimum predicted rating | `8` | 1 to 10 | Dowsing points at works predicted at or above this. |
| `shop.rollPrice` | Rarity roll price | `200` | 0 to 10000 | Points per rarity roll. |
| `shop.unlockTimeGates` | Enforce minimum unlock times | `false` | boolean | Some unlocks also need days since the last one, to stretch progress over weeks. |
| `shop.minDaysBetweenBigUnlocks` | Days between big unlocks | `7` | 0 to 365 | Minimum days between family charters and similar when time gates are on. |
| `shop.personnelChronicles` | Personnel graph: chronicles needed | `3` | 0 to 50 | Completed chronicles required. |
| `shop.startLensCharges` | Starting lens charges | `3` | 0 to 100 | Lens charges in a new save. |
| `shop.startPoints` | Starting points | `0` | 0 to 100000 | Points in a new save. |
| `shop.gateViews` | Unlocks gate the alternate views | `true` | boolean | Time needs the Era Lens, Credits needs the Personnel graph, Place needs the Place overlay. Off opens all views. |

## Recommendations

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `recs.perExpand` | Works revealed per expansion | `8` | 1 to 100 | Candidates added each time you grow from a work, credit or relation. |
| `recs.maxVisible` | Max works on screen | `5000` | 100 to 100000 | Hard cap for rendering. |
| `recs.weightTags` | Similarity weight: tags | `1` | 0 to 5 | Weight of shared genre/style tags. |
| `recs.weightCredits` | Similarity weight: credits | `1.4` | 0 to 5 | Weight of shared producers, engineers and players. |
| `recs.weightEra` | Similarity weight: era | `0.4` | 0 to 5 | Weight of release-year proximity. |
| `recs.weightSamples` | Similarity weight: samples | `1.2` | 0 to 5 | Weight of sample and cover relationships. |
| `recs.weightCollab` | Similarity weight: listener overlap | `0.8` | 0 to 5 | Weight of ListenBrainz-style collaborative filtering. |
| `recs.highRatingPull` | High-rating pull | `1.5` | 0 to 5 | How strongly works similar to your high ratings are favored. |
| `recs.lowRatingPush` | Low-rating push | `1` | 0 to 5 | How strongly works similar to your low ratings are avoided. |
| `recs.ratingNeutral` | Neutral rating | `6` | 1 to 10 | Ratings above pull, below push. |
| `recs.obscurityBoost` | Obscurity boost | `0.5` | 0 to 5 | Extra weight for rarer works among the tiers you have unlocked. |
| `recs.diversity` | Diversity | `0.3` | 0 to 1 | Pushes recommendations to differ from each other. 0 = pure similarity. |
| `recs.minYear` | Ignore works before (year) | `1900` | 1850 to 2025 | Hard floor on release year for recommendations. |
| `recs.albumsEpsOnly` | Albums and EPs only | `true` | boolean | Exclude singles, compilations and live albums. |
| `recs.includeCompilations` | Include compilations | `false` | boolean | Include compilations when albums-only is on. |
| `recs.eraScaleYears` | Era similarity scale (years) | `12` | 1 to 100 | Years apart at which era similarity falls to about a third. |
| `recs.autoLinkCount` | Auto-links for added works | `3` | 0 to 20 | How many connections a work you add gets, chosen by similarity. |
| `recs.autoLinkMinSim` | Auto-link minimum similarity | `0.35` | 0 to 1 | Candidates below this are not linked. |
| `recs.wormholesRequired` | Cross-family growth needs Wormholes | `true` | boolean | Without the Wormholes unlock, growing from a work only reaches works that share a family with it. |

## Data sources

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `data.useWikipedia` | Use Wikipedia and Wikidata | `true` | boolean | Bios and "influenced by" links. |
| `data.previewProvider` | Preview provider | `deezer` | deezer / itunes / none | Where 30-second previews come from. |
| `data.userAgent` | MusicBrainz user-agent | `Strata/0.1 (you@example.com)` | text | Required by MusicBrainz. Use an app name and a contact. |
| `data.cacheDays` | Cache lifetime (days) | `30` | 0 to 3650 | How long fetched data is reused before refetching. |
| `data.bioMaxChars` | Bio length (characters) | `900` | 100 to 5000 | Maximum bio text shown. |
| `data.fetchOnHover` | Fetch on hover | `false` | boolean | Prefetch details when you hover a work. |
| `data.fetchCovers` | Fetch cover art | `true` | boolean | Load cover art from the Cover Art Archive for works on screen, one at a time. |
| `data.coverSize` | Cover size (px) | `250` | 100 to 1200 | Cover Art Archive size to request (250 or 500 are cached). |
| `data.searchLimit` | Search results when adding | `6` | 1 to 25 | How many MusicBrainz matches to list when you add a work. |
| `data.defaultTier` | Default tier for added works | `2` | 0 to 5 | Tier index (0 mainstream to 5 ghost) given when no popularity data is available. |

## Sync and accounts

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `sync.unverifiedSeed` | Starter catalogue (unverified) | `show` | show / hide | The built-in starter works, connections and chronicles were written from memory and are not checked against any source. "show" keeps them flagged as unverified. "hide" removes unheard unverified works and all starter connections until sync has verified them. |
| `sync.importAsHeard` | Imported works count as heard | `true` | boolean | Works that come from your accounts are marked heard. Off adds them to the map as unheard. |
| `sync.importRatings` | Import ratings | `true` | boolean | Use ratings that come with an import (Discogs collection ratings). Nothing else supplies one, and no rating is ever made up: imported works stay unrated until you rate them. |
| `sync.discogsRatingScale` | Discogs rating multiplier | `2` | 1 to 4 | Discogs rates 1 to 5. This multiplies it onto the 1 to 10 scale. |
| `sync.maxImport` | Most works per import | `500` | 10 to 20000 | Safety cap on one import from one account. |
| `sync.unknownRecencyDays` | Recency for undated imports (days) | `365` | 0 to 7300 days | Top-albums lists carry no date. Imported works with no date are treated as last visited this many days ago. |
| `sync.lastfmPeriod` | Last.fm period | `overall` | overall / 12month / 6month / 3month / 1month / 7day | Time range for Last.fm top albums. |
| `sync.fetchArtists` | Verify: artists | `true` | boolean | Fetch each artist from MusicBrainz: origin, life span, genres, tags, relations to other artists. |
| `sync.fetchCredits` | Verify: credits and samples | `true` | boolean | Fetch producers, players and sample links from the earliest official release (one extra MusicBrainz request per work). |
| `sync.fetchPlaces` | Verify: places | `true` | boolean | Look up coordinates for artist origins through Wikidata. |
| `sync.fetchPopularity` | Verify: popularity | `true` | boolean | Ask ListenBrainz how many people listened, to set the rarity tier. |
| `sync.fetchSimilar` | Verify: similar artists | `true` | boolean | Ask Last.fm for similar artists (needs a Last.fm key) and connect works whose artists match. |
| `sync.fetchInfluence` | Verify: influenced by | `true` | boolean | Read Wikidata "influenced by" on artists and connect works by influencer and influenced. |
| `sync.reclassify` | Re-classify from verified genres | `true` | boolean | Once a work has verified genres, recompute its family weights from them using the keywords below. Off keeps the weights it had. |
| `sync.matchMinScore` | Search match minimum score | `90` | 50 to 100 | MusicBrainz search scores 0 to 100. A work without an id is matched to the top search result only at or above this and only if title and artist also agree. |
| `sync.editionWords` | Edition words | `deluxe,remaster,remastered,expanded,anniversary,edition,bonus,version` | text | Comma separated. A trailing bracket group containing one of these words is ignored when matching titles (so "Title (Deluxe Edition)" matches "Title"). |
| `sync.producerTypes` | MusicBrainz relation types: producer | `producer` | text | Comma separated relationship type names counted as producer credits. |
| `sync.playerTypes` | MusicBrainz relation types: players | `instrument,vocal` | text | Comma separated relationship type names counted as guests and players. The relationship attributes (instrument, vocal kind) are shown after the name. |
| `sync.sampleTypes` | MusicBrainz relation types: samples | `samples material` | text | Comma separated recording to recording relationship names counted as sample links. |
| `sync.artistRelTypes` | MusicBrainz relation types: artist links | `member of band,collaboration` | text | Comma separated artist to artist relationship names that connect the works of two artists as personnel links. |
| `sync.coordProperty` | Wikidata property: coordinates | `P625` | text | Wikidata property id for coordinate location. |
| `sync.influenceProperty` | Wikidata property: influenced by | `P737` | text | Wikidata property id for "influenced by". |
| `sync.placeSource` | Place comes from | `begin-area` | begin-area / area | begin-area is where an artist was born or formed, area is where they are listed now. |
| `sync.placeAllowCountry` | Allow country-level places | `false` | boolean | A place that is only a country would be pinned to its centre. Off leaves such works without a place. |
| `sync.subgenreMinWorks` | Subgenre: works needed | `3` | 1 to 50 | A verified genre becomes a charter-able subgenre once this many works in your library carry it. |
| `sync.subgenreMax` | Most subgenres | `40` | 0 to 500 | Cap on subgenres derived from verified genres. |
| `sync.linkSim` | Artist link similarity | `0.7` | 0 to 1 | Similarity given to connections made from artist relations (member of band, collaboration) and Wikidata influence. |
| `sync.sampleSim` | Sample link similarity | `0.6` | 0 to 1 | Similarity given to a sample connection found in MusicBrainz. |
| `sync.similarMin` | Similar artists: minimum match | `0.3` | 0 to 1 | Last.fm matches below this (0 to 1) are ignored. |
| `sync.discographyLimit` | Discography: most works | `100` | 10 to 1000 | Most albums and EPs fetched when adding an artist's other work. |
| `sync.listenersMin.mainstream` | Listeners for mainstream | `500000` | 0 to 100000000 | ListenBrainz unique listeners at or above this put a work in this tier or a more common one. Below the last threshold it is a ghost. Placeholder numbers: tune them to what ListenBrainz data looks like. |
| `sync.listenersMin.essential` | Listeners for essential | `100000` | 0 to 100000000 | ListenBrainz unique listeners at or above this put a work in this tier or a more common one. Below the last threshold it is a ghost. Placeholder numbers: tune them to what ListenBrainz data looks like. |
| `sync.listenersMin.cult` | Listeners for cult | `20000` | 0 to 100000000 | ListenBrainz unique listeners at or above this put a work in this tier or a more common one. Below the last threshold it is a ghost. Placeholder numbers: tune them to what ListenBrainz data looks like. |
| `sync.listenersMin.niche` | Listeners for niche | `4000` | 0 to 100000000 | ListenBrainz unique listeners at or above this put a work in this tier or a more common one. Below the last threshold it is a ghost. Placeholder numbers: tune them to what ListenBrainz data looks like. |
| `sync.listenersMin.deepcut` | Listeners for deepcut | `600` | 0 to 100000000 | ListenBrainz unique listeners at or above this put a work in this tier or a more common one. Below the last threshold it is a ghost. Placeholder numbers: tune them to what ListenBrainz data looks like. |
| `sync.proxyTemplate` | Request proxy (optional) | `(empty)` | text | If your browser blocks an API (CORS), route requests through a proxy you run. Use {url} where the encoded target goes, for example https://my-proxy.example/?u={url}. Empty means direct. |
| `sync.delayMs.musicbrainz` | Delay between musicbrainz requests (ms) | `1100` | 1000 to 60000 | MusicBrainz asks for no more than one request a second from one IP address. Do not go below 1000. |
| `sync.delayMs.listenbrainz` | Delay between listenbrainz requests (ms) | `300` | 0 to 60000 | Minimum time between requests to this service. |
| `sync.delayMs.lastfm` | Delay between lastfm requests (ms) | `250` | 0 to 60000 | Minimum time between requests to this service. |
| `sync.delayMs.discogs` | Delay between discogs requests (ms) | `1100` | 0 to 60000 | Minimum time between requests to this service. |
| `sync.delayMs.wikidata` | Delay between wikidata requests (ms) | `300` | 0 to 60000 | Minimum time between requests to this service. |
| `sync.retries` | Retries | `3` | 0 to 10 | How many times a request that gets rate-limited (429) or a 503 is retried, waiting as the server asks. |
| `sync.tags.hiphop` | Tag keywords: Hip Hop | `hip hop,hip-hop,rap,boom bap,trap,turntablism,conscious hip hop` | text | Comma separated words. A genre or tag containing one of them counts toward this family when classifying a work. |
| `sync.tags.funksoul` | Tag keywords: Funk / Soul | `funk,soul,r&b,rhythm and blues,motown,disco,gospel` | text | Comma separated words. A genre or tag containing one of them counts toward this family when classifying a work. |
| `sync.tags.pop` | Tag keywords: Pop | `pop,synth-pop,synthpop,dance-pop,power pop,teen pop` | text | Comma separated words. A genre or tag containing one of them counts toward this family when classifying a work. |
| `sync.tags.rock` | Tag keywords: Rock / Indie | `rock,indie,punk,metal,grunge,emo,shoegaze,post-punk,alternative` | text | Comma separated words. A genre or tag containing one of them counts toward this family when classifying a work. |
| `sync.tags.electronic` | Tag keywords: Electronic | `electronic,techno,house,drum and bass,jungle,idm,trip hop,breakbeat,synthwave,dubstep,electro` | text | Comma separated words. A genre or tag containing one of them counts toward this family when classifying a work. |
| `sync.tags.ambient` | Tag keywords: Ambient / Score | `ambient,soundtrack,score,minimalism,drone,new age,modern classical,neoclassical` | text | Comma separated words. A genre or tag containing one of them counts toward this family when classifying a work. |
| `sync.tags.jazz` | Tag keywords: Jazz | `jazz,bebop,fusion,bossa nova,swing,hard bop,free jazz` | text | Comma separated words. A genre or tag containing one of them counts toward this family when classifying a work. |

## Interface

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `ui.background` | Background | `#0B0E12` | color | Canvas background color. |
| `ui.text` | Text color | `#E8E4DA` | color | Main text color. |
| `ui.mutedText` | Muted text color | `#9AA3AE` | color | Secondary text color. |
| `ui.seenDim` | Heard art dimming | `0.5` | 0.1 to 1 | Opacity of art for works you have heard (lower = dimmer). |
| `ui.unheardBrightness` | Unheard art brightness | `1` | 0.3 to 1 | Opacity of art for works you have not heard. |
| `ui.labelZoom` | Show titles above zoom | `0.6` | 0.1 to 4 | Zoom level at which titles appear under tiles. |
| `ui.labelMode` | Titles | `heard-and-lit` | all / heard-and-lit / lit / none | Which tiles get titles. |
| `ui.playOnHover` | Play button on art hover | `true` | boolean | Show a play button over the art on hover. |
| `ui.panelWidth` | Info panel width (px) | `380` | 280 to 700 | Width of the side panel. |
| `ui.zoomMin` | Minimum zoom | `0.1` | 0.01 to 1 | Furthest you can zoom out. |
| `ui.zoomMax` | Maximum zoom | `4` | 1 to 20 | Closest you can zoom in. |
| `ui.fontSize` | Base font size | `13` | 9 to 24 | Base text size. |
| `ui.reduceMotion` | Reduce motion | `false` | boolean | Disable animations. |
| `ui.levelTitles` | Level titles | `Seed,Listener,Wanderer,Surveyor,Pathfinder,Navigator,Cartographer,Pioneer,Archivist,Elder` | text | Comma separated titles, one per level. The last one repeats. |
| `ui.shelfMax` | Shelf rows shown | `60` | 5 to 1000 | Most rows drawn in the shelf list (newest first). |
| `ui.searchMax` | Search results shown | `8` | 1 to 50 | Most rows in the search dropdown. |
| `ui.toastMs` | Notice time (ms) | `4000` | 500 to 20000 | How long XP and quest notices stay on screen. |
| `ui.minimapSize` | Minimap size (px) | `108` | 60 to 300 | Side length of the minimap. |

## Saving

| Key | Name | Default | Range | What it does |
|---|---|---|---|---|
| `persist.autosaveSeconds` | Autosave interval (seconds) | `10` | 1 to 600 | How often progress is written locally. |
| `persist.backups` | Backups kept | `5` | 0 to 100 | Rolling backups of your save. |
| `persist.confirmReset` | Confirm before reset | `true` | boolean | Ask before resetting progress or settings. |

