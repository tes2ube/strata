// Every tunable number, color, toggle and name in the app lives here.
// The settings panel is generated from this list, so adding an entry here adds a control.
// Keys are flat dotted strings. Tier ids, family ids and relation ids appear inside keys.

import { TAG_KEYWORDS } from '../data/tagmap.js';

export const TIER_IDS = ['mainstream', 'essential', 'cult', 'niche', 'deepcut', 'ghost'];
export const FAMILY_IDS = ['hiphop', 'funksoul', 'pop', 'rock', 'electronic', 'ambient', 'jazz'];
export const RELATION_TYPES = ['precedent', 'inspired', 'contemporary', 'personnel', 'sample', 'other'];
export const BADGE_IDS = ['canon', 'landmark', 'underground', 'gateway', 'deepend', 'origin', 'crossover', 'wellspring', 'rediscovered'];

export const GROUPS = [
  ['xp', 'XP and points'], ['tiers', 'Rarity tiers (rings)'], ['badges', 'Badges'], ['fog', 'Fog of war'],
  ['genres', 'Genre families and colors'], ['recency', 'Recency and time'], ['rating', 'Rating bar'],
  ['layout', 'Layout and hex grid'], ['routing', 'Connection lines'], ['spotlight', 'Hover and selection'],
  ['views', 'Views (time, credits, place)'], ['threads', 'Threads'], ['taste', 'Taste signature'], ['slots', 'Map slots'], ['quests', 'Quests and chronicles'], ['shop', 'Unlocks and consumables'],
  ['recs', 'Recommendations'], ['data', 'Data sources'], ['sync', 'Sync and accounts'], ['ui', 'Interface'], ['persist', 'Saving']
];

const S = [];
function def(group, key, label, help, type, value, extra = {}) {
  S.push({ group, key: `${group}.${key}`, label, help, type, default: value, ...extra });
}
const num = (g, k, l, h, v, e = {}) => def(g, k, l, h, 'number', v, e);
const bool = (g, k, l, h, v) => def(g, k, l, h, 'boolean', v);
const color = (g, k, l, h, v) => def(g, k, l, h, 'color', v);
const text = (g, k, l, h, v) => def(g, k, l, h, 'text', v);
const pick = (g, k, l, h, v, options) => def(g, k, l, h, 'select', v, { options });

// ---------------- XP and points ----------------
num('xp', 'rateBase', 'XP per rating', 'Base XP awarded each time you rate a work you have not rated before.', 20, { min: 0, max: 500 });
num('xp', 'reRateBase', 'XP per re-rating', 'XP for re-rating a work after the re-listen delay. 0 disables.', 8, { min: 0, max: 500 });
num('xp', 'reRateDelayDays', 'Re-listen delay (days)', 'Days before a re-rating earns XP.', 60, { min: 1, max: 3650, unit: 'days' });
num('xp', 'lowRatingFloor', 'Low-rating bonus floor', 'Ratings at or below this earn the low-rating honesty bonus.', 4, { min: 0, max: 10 });
num('xp', 'lowRatingBonus', 'Low-rating bonus (x)', 'Multiplier added when you rate at or below the floor (honest low scores teach the model).', 0.25, { min: 0, max: 2, step: 0.05 });
num('xp', 'surpriseThreshold', 'Surprise threshold (rating points)', 'How far your rating must differ from the model prediction to count as a surprise.', 2, { min: 0.5, max: 8, step: 0.1 });
num('xp', 'surpriseBonus', 'Surprise bonus (x)', 'Multiplier added for a surprise rating.', 0.5, { min: 0, max: 3, step: 0.05 });
num('xp', 'leapBase', 'Leap bonus XP', 'Flat XP for the first work you rate in a family you have never rated in.', 40, { min: 0, max: 500 });
num('xp', 'leapSubBase', 'Subgenre leap bonus XP', 'Flat XP for the first work in a subgenre you have never rated in.', 15, { min: 0, max: 500 });
num('xp', 'chainPerLink', 'Chain bonus per link (x)', 'Multiplier added per consecutive linked work in the same thread.', 0.1, { min: 0, max: 1, step: 0.01 });
num('xp', 'chainCap', 'Chain bonus cap (x)', 'Maximum total chain multiplier added. 1 means up to x2.', 1, { min: 0, max: 5, step: 0.05 });
num('xp', 'chainMinRating', 'Minimum rating to extend a chain', 'Works rated below this still earn XP but do not extend the chain. 0 = always extend.', 0, { min: 0, max: 10 });
num('xp', 'restedPerDay', 'Rested XP stored per day away', 'Bonus XP pool that grows while you are away.', 10, { min: 0, max: 200 });
num('xp', 'restedCap', 'Rested XP pool cap', 'Maximum stored rested XP.', 300, { min: 0, max: 5000 });
num('xp', 'restedRate', 'Rested spend rate (x)', 'Extra XP per rating as a fraction of base, drawn from the pool.', 1, { min: 0, max: 5, step: 0.1 });
num('xp', 'lineageDepthBonus', 'Lineage depth bonus', 'Extra XP per step deep when following precedent chains.', 4, { min: 0, max: 100 });
num('xp', 'creditHopBonus', 'Credit-hop bonus', 'Extra XP for rating a work reached by following a credit (producer, player, etc.).', 6, { min: 0, max: 100 });
num('xp', 'dailyXpCap', 'Daily XP cap (0 = none)', 'Soft cap on XP per day, if you want to slow things down.', 0, { min: 0, max: 100000 });
num('xp', 'levelBase', 'XP for level 2', 'XP needed to go from level 1 to 2.', 200, { min: 10, max: 100000 });
num('xp', 'levelGrowth', 'Level growth factor', 'Each level needs this many times the XP of the previous.', 1.35, { min: 1, max: 3, step: 0.01 });
num('xp', 'pointsPerXp', 'Points per XP', 'Spendable points earned per XP gained. 0.5 = one point per two XP.', 0.5, { min: 0, max: 10, step: 0.05 });
num('xp', 'questPointsMult', 'Quest points multiplier (x)', 'Multiplier applied to all quest point rewards.', 1, { min: 0, max: 10, step: 0.1 });
bool('xp', 'respecFree', 'Respec is free', 'Moving or removing spec choices never costs points.', true);

// ---------------- Rarity tiers ----------------
const tierDefaults = {
  mainstream: ['Mainstream', '#F2EFE8', 1.0, 10, 0, 0, 0.6],
  essential: ['Essential', '#5ED17B', 1.1, 14, 25, 3, 0.8],
  cult: ['Cult', '#4EA8FF', 1.25, 20, 80, 3, 1.0],
  niche: ['Niche', '#B07CFF', 1.5, 30, 300, 3, 1.2],
  deepcut: ['Deep cut', '#FF9B3D', 1.9, 45, 900, 3, 1.6],
  ghost: ['Ghost', '#8CF3E6', 2.5, 70, 2500, 3, 2.0]
};
for (const id of TIER_IDS) {
  const [name, col, xm, mv, um, pre, fr] = tierDefaults[id];
  text('tiers', `${id}.name`, `${name}: name`, 'Display name of this tier.', name);
  color('tiers', `${id}.color`, `${name}: ring color`, 'Color of the ring around works of this tier.', col);
  num('tiers', `${id}.xpMult`, `${name}: XP multiplier`, 'Multiplier on rating XP for works of this tier.', xm, { min: 0, max: 20, step: 0.05 });
  num('tiers', `${id}.masteryValue`, `${name}: mastery value`, 'How much one heard work of this tier adds to its genre mastery (before rating factor and diminishing returns).', mv, { min: 0, max: 1000 });
  num('tiers', `${id}.unlockMastery`, `${name}: mastery to unlock`, 'Genre mastery needed before this tier can appear in that genre.', um, { min: 0, max: 100000 });
  num('tiers', `${id}.prereqWorks`, `${name}: works needed from tier below`, 'Heard works required in the previous tier (or any rarer tier) of that genre before this tier unlocks. Stops you skipping the canon.', pre, { min: 0, max: 50 });
  num('tiers', `${id}.fogRadiusBonus`, `${name}: fog reach bonus (hex steps)`, 'Extra hex steps a heard work of this tier pushes the fog back, scaled by genre depth.', fr, { min: 0, max: 10, step: 0.1 });
}
num('tiers', 'diminishing', 'Diminishing returns exponent', 'Works per tier count as n^exponent toward mastery. Lower = a pile of one tier helps less.', 0.75, { min: 0.3, max: 1, step: 0.01 });
num('tiers', 'ratingFloor', 'Rating that counts for nothing', 'At or below this rating a heard work adds no mastery.', 4, { min: 0, max: 10, step: 0.1 });
num('tiers', 'ratingCeil', 'Rating that counts fully', 'At or above this rating a heard work adds its full mastery value (times the top factor).', 8, { min: 0, max: 10, step: 0.1 });
num('tiers', 'ratingTopFactor', 'Top rating factor', 'Mastery multiplier at or above the full-credit rating.', 1.15, { min: 0.5, max: 3, step: 0.05 });
num('tiers', 'ringWidth', 'Ring width (px)', 'Thickness of the rarity ring.', 4, { min: 1, max: 12 });
num('tiers', 'ringGap', 'Ring gap (px)', 'Gap between art and ring.', 1, { min: 0, max: 8 });

// ---------------- Badges ----------------
const badgeDefaults = {
  canon: ['Canon', 'Cornerstone of a genre. Counts toward Foundations and mastery.', 1.5, 1.5],
  landmark: ['Landmark', 'Changed history. Anchors chronicles and earns chronicle XP.', 1.3, 1.0],
  underground: ['Underground', 'Scene-level, outside the mainstream. Counts extra toward deep tiers.', 1.2, 1.5],
  gateway: ['Gateway', 'Easiest way into a genre. Quests reward finishing gateways first.', 1.0, 1.0],
  deepend: ['Deep end', 'Demanding. Earns extra XP for a rating of 7 or higher.', 1.4, 1.0],
  origin: ['Origin', 'First of its kind. Counts toward history quests.', 1.2, 1.0],
  crossover: ['Crossover', 'Bridges two families. Counts toward bridge quests.', 1.2, 1.0],
  wellspring: ['Wellspring', 'Heavily sampled or covered. Reveals sample connections.', 1.1, 1.0],
  rediscovered: ['Rediscovered', 'Neglected on release, valued later. Counts toward archaeology quests.', 1.2, 1.0]
};
for (const id of BADGE_IDS) {
  const [name, help, xm, mm] = badgeDefaults[id];
  bool('badges', `${id}.enabled`, `${name}: show badge`, help, true);
  num('badges', `${id}.xpMult`, `${name}: XP multiplier`, 'Multiplier on rating XP when a work carries this badge.', xm, { min: 0, max: 10, step: 0.05 });
  num('badges', `${id}.masteryMult`, `${name}: mastery multiplier`, 'Multiplier on mastery contributed by works with this badge.', mm, { min: 0, max: 10, step: 0.05 });
}
num('badges', 'size', 'Badge icon size (px)', 'Size of the badge icon on a tile.', 16, { min: 8, max: 40 });
bool('badges', 'matchRingColor', 'Badge color matches ring', "Badge icons take the color of the work's rarity ring.", true);

// ---------------- Fog of war ----------------
bool('fog', 'enabled', 'Fog of war enabled', 'Turn off to see every recommendation.', true);
num('fog', 'baseSteps', 'Base reveal radius (hex steps)', 'Reach of any heard work before genre depth is applied.', 1.5, { min: 0, max: 10, step: 0.1 });
num('fog', 'depthReference', 'Depth reference mastery', 'Genre mastery at which depth factor reaches 1.0 (full reach bonus).', 1200, { min: 1, max: 100000 });
num('fog', 'tierAhead', 'Tiers ahead a work can reveal', 'A work of tier t can reveal works up to tier t + this, limited by genre unlocks.', 2, { min: 0, max: 5 });
num('fog', 'scoutSteps', 'Scouted radius (hex steps)', 'Small reveal around an unheard work you have scouted.', 0.8, { min: 0, max: 5, step: 0.1 });
num('fog', 'maxVisiblePerHeard', 'Max new works revealed per heard work', 'Stops one popular album revealing everything nearby. 0 = unlimited.', 6, { min: 0, max: 100 });
num('fog', 'softness', 'Edge softness (px)', 'Blur on the edge of revealed areas.', 28, { min: 0, max: 100 });
num('fog', 'opacity', 'Fog opacity', 'How dark unexplored areas are.', 0.9, { min: 0, max: 1, step: 0.01 });
color('fog', 'color', 'Fog color', 'Color of the fog.', '#070A0E');
bool('fog', 'showSilhouettes', 'Show silhouettes in fog', 'Faint "?" tiles inside fog suggest something is there.', true);
bool('fog', 'perSubgenre', 'Depth per subgenre (experimental)', 'Compute depth per subgenre as well as family.', false);
num('fog', 'parentShare', 'Parent share of subgenre mastery', "Fraction of a subgenre's mastery that also counts toward its parent family.", 0.5, { min: 0, max: 1, step: 0.05 });

// ---------------- Genre families ----------------
const famDefaults = {
  hiphop: ['Hip Hop', 20], funksoul: ['Funk / Soul', 48], pop: ['Pop', 100], rock: ['Rock / Indie', 165],
  electronic: ['Electronic', 215], ambient: ['Ambient / Score', 265], jazz: ['Jazz', 315]
};
for (const id of FAMILY_IDS) {
  text('genres', `${id}.name`, `${famDefaults[id][0]}: name`, 'Display name.', famDefaults[id][0]);
  num('genres', `${id}.hue`, `${famDefaults[id][0]}: hue (0-360)`, 'Color hue of this family. Neighbors blend where they meet.', famDefaults[id][1], { min: 0, max: 360 });
}
num('genres', 'saturation', 'Territory saturation (%)', 'Saturation of territory tints and tile colors.', 70, { min: 0, max: 100 });
num('genres', 'territoryOpacity', 'Territory tint opacity', 'Strength of the colored territory glow.', 0.34, { min: 0, max: 1, step: 0.01 });
num('genres', 'territoryRadius', 'Territory radius (px)', 'Size of each territory glow.', 250, { min: 50, max: 800 });
num('genres', 'subgenreLightnessStep', 'Subgenre lightness step (%)', 'Lightness shift between a family and each nested subgenre level.', 6, { min: 0, max: 20 });
num('genres', 'ringRadius', 'Anchor ring radius (px)', 'Distance of the fixed genre anchors from the center.', 340, { min: 100, max: 1000 });
num('genres', 'wellStrength', 'Genre well pull', 'How strongly a family anchor pulls works toward itself.', 0.06, { min: 0, max: 1, step: 0.005 });

// ---------------- Recency and time ----------------
num('recency', 'fullDays', 'Full ring until (days)', 'Recency ring is full for this many days after you last engaged.', 7, { min: 0, max: 365, unit: 'days' });
num('recency', 'halfDays', 'Half ring at (days)', 'Days at which the ring is half full.', 60, { min: 1, max: 3650, unit: 'days' });
num('recency', 'emptyDays', 'Minimum ring at (days)', 'Days after which the ring stays at its minimum.', 365, { min: 2, max: 7300, unit: 'days' });
num('recency', 'minRing', 'Minimum ring fraction', 'Smallest ring arc shown.', 0.06, { min: 0, max: 0.5, step: 0.01 });
pick('recency', 'territoryMode', 'Territory recency uses', 'How a genre\'s "last visited" is computed.', 'latest', ['latest', 'average', 'median']);
num('recency', 'masteryDecayDays', 'Mastery decay starts (days, 0 = never)', 'Days of inactivity in a genre before its mastery starts to fade.', 0, { min: 0, max: 7300 });
num('recency', 'masteryDecayPerMonth', 'Mastery decay per month (%)', 'Percent of mastery lost per month after decay starts.', 2, { min: 0, max: 50, step: 0.5 });
num('recency', 'masteryFloor', 'Mastery decay floor (%)', 'Mastery never decays below this percent of its peak.', 60, { min: 0, max: 100 });
bool('recency', 'countOpenAsEngaged', 'Opening a work counts as engagement', 'Selecting a work refreshes its ring even without a new rating.', true);
bool('recency', 'countPlayAsEngaged', 'Playing a preview counts as engagement', 'Playing a preview refreshes the ring.', true);

// ---------------- Rating bar ----------------
num('rating', 'subStep', 'Light/decent/strong step', 'How far light and strong sit from decent on the numeric scale (light 8 = 8 - step).', 0.3, { min: 0.05, max: 0.49, step: 0.01 });
num('rating', 'borderBand', 'Border zone width', 'Fraction of each third that counts as the border between two steps.', 0.16, { min: 0, max: 0.6, step: 0.01 });
color('rating', 'fillColor', 'Bar fill color', 'Color of the filled rating bar.', '#F2B84B');
color('rating', 'hoverColor', 'Bar hover color', 'Color of the hover indicator.', '#FFFFFF');
num('rating', 'min', 'Lowest rating', 'Bottom of the scale.', 1, { min: 0, max: 5 });
num('rating', 'max', 'Highest rating', 'Top of the scale.', 10, { min: 5, max: 100 });
bool('rating', 'showNumeric', 'Show numeric value', 'Show the decimal value next to the label.', false);

// ---------------- Layout and hex grid ----------------
num('layout', 'spacing', 'Hex spacing (px)', 'Distance between neighboring lattice points. Larger = more room for lines.', 120, { min: 70, max: 300 });
num('layout', 'tileSize', 'Tile size (px)', 'Size of an album tile.', 56, { min: 24, max: 120 });
num('layout', 'selectedScale', 'Selected tile scale', 'Size multiplier for selected works.', 1.35, { min: 1, max: 3, step: 0.05 });
bool('layout', 'showHexDots', 'Show hex dots', 'Show the lattice points works snap to. Visible while designing.', true);
num('layout', 'hexDotOpacity', 'Hex dot opacity', 'Opacity of the lattice dots.', 0.35, { min: 0, max: 1, step: 0.01 });
bool('layout', 'showLaneGrid', 'Show connection lanes', 'Faintly draw the secondary grid lines run on.', false);
num('layout', 'linkRest', 'Link rest length (x spacing)', 'Spring rest length between linked works, in lattice spacings.', 1.0, { min: 0.5, max: 4, step: 0.05 });
num('layout', 'relatednessStretch', 'Relatedness stretch', 'Extra rest length for weakly related links: rest = base x (1 + stretch x (1 - similarity)).', 1.5, { min: 0, max: 6, step: 0.1 });
num('layout', 'linkStrength', 'Link spring strength', 'Pull of each link.', 0.08, { min: 0, max: 1, step: 0.005 });
num('layout', 'repulsion', 'Repulsion', 'How hard works push each other apart.', 1.0, { min: 0, max: 10, step: 0.05 });
num('layout', 'repulsionRange', 'Repulsion range (x spacing)', 'Distance within which works repel.', 1.8, { min: 0.5, max: 6, step: 0.1 });
num('layout', 'iterations', 'Simulation steps', 'Steps run when the layout updates.', 220, { min: 10, max: 5000 });
num('layout', 'cooling', 'Cooling', 'How quickly movement settles (higher = slower).', 0.985, { min: 0.8, max: 0.999, step: 0.001 });
num('layout', 'massScale', 'Rating mass scale', "How much a heard work's rating weighs in pulling neighbors.", 0.12, { min: 0, max: 1, step: 0.01 });
num('layout', 'hubRadius', 'Center hub radius (px)', 'Reserved area for the shelf hub in the center.', 62, { min: 0, max: 300 });
num('layout', 'seed', 'Layout seed', 'Seed for deterministic layout. Change to reshuffle ties.', 7, { min: 0, max: 99999 });
bool('layout', 'animate', 'Animate layout changes', 'Smoothly move tiles when the layout changes.', true);
num('layout', 'animateMs', 'Layout animation (ms)', 'Duration of tile movement.', 600, { min: 0, max: 3000 });

// ---------------- Connection lines ----------------
pick('routing', 'mode', 'Routing mode', 'hex = straights run along the three hex axes (0, 60, 120 degrees), in lanes between works.', 'hex', ['hex']);
num('routing', 'cornerRadius', 'Corner radius (px)', 'Roundness where a line turns.', 18, { min: 0, max: 60 });
bool('routing', 'bundle', 'Bundle shared connections', 'Lines that share a work run together on one trunk and branch off.', true);
num('routing', 'portPenalty', 'Shared-port penalty', 'Cost added when unbundled lines share a port; higher spreads them out.', 60, { min: 0, max: 500 });
num('routing', 'turnPenalty', 'Turn penalty', 'Cost per turn; higher gives straighter lines.', 10, { min: 0, max: 200 });
num('routing', 'backtrackPenalty', 'Backtrack penalty', 'Cost multiplier for moving away from the target.', 2, { min: 0, max: 10, step: 0.1 });
num('routing', 'overlapPenalty', 'Overlap penalty', 'Cost per pixel of lane shared with an unrelated connection; higher keeps unrelated lines apart.', 3, { min: 0, max: 20, step: 0.5 });
num('routing', 'width', 'Line width (px)', 'Normal line width.', 2, { min: 0.5, max: 8, step: 0.25 });
num('routing', 'widthSelected', 'Line width, selected (px)', 'Width when a line is in the spotlight.', 3.2, { min: 0.5, max: 10, step: 0.25 });
num('routing', 'arrowSize', 'Arrowhead size (px)', 'Size of arrowheads on directed connections.', 9, { min: 0, max: 30 });
bool('routing', 'labelsOnHoverOnly', 'Labels only on hover', 'Connection names show only when you hover a line or its works.', true);
for (const [id, col, dir] of [['precedent', '#8FB8FF', true], ['inspired', '#F28CC4', true], ['contemporary', '#7ED6A0', false], ['personnel', '#C9B8FF', false], ['sample', '#F2B84B', true], ['other', '#6F7B88', true]]) {
  color('routing', `${id}.color`, `${id}: color`, 'Line color for this relation type.', col);
  bool('routing', `${id}.arrow`, `${id}: arrowhead`, 'Draw an arrowhead for this relation type.', dir);
  pick('routing', `${id}.dash`, `${id}: line style`, 'Solid, dashed or dotted.', id === 'contemporary' ? 'dashed' : id === 'personnel' ? 'dotted' : 'solid', ['solid', 'dashed', 'dotted']);
}

// ---------------- Hover and selection ----------------
num('spotlight', 'dimOpacity', 'Dim opacity', 'Opacity of everything outside the spotlight.', 0.12, { min: 0, max: 1, step: 0.01 });
num('spotlight', 'hoverDepth', 'Hover depth (links)', 'How many links away from the hovered work stay lit.', 1, { min: 0, max: 5 });
num('spotlight', 'chainDepth', 'Selection chain depth', 'How many links away from a selected work stay shown.', 3, { min: 0, max: 20 });
bool('spotlight', 'hoverIncludesSelection', 'Hover keeps selection lit', 'Selected chains stay lit while hovering something else.', true);
pick('spotlight', 'multiSelectKey', 'Multi-select key', 'Hold this key while clicking to add to the selection.', 'shift', ['shift', 'ctrl', 'alt', 'meta']);
bool('spotlight', 'followDirected', 'Follow direction only', 'Chains follow arrows forward only instead of both ways.', false);
for (const t of RELATION_TYPES) bool('spotlight', `follow.${t}`, `Chain follows: ${t}`, 'Whether selection chains continue through this connection type (also toggled in the legend).', t !== 'other');
num('spotlight', 'transitionMs', 'Spotlight transition (ms)', 'Fade time when the spotlight changes.', 140, { min: 0, max: 1000 });

// ---------------- Map slots ----------------
bool('slots', 'enabled', 'Limit map slots', 'Off by default while balancing. When on, placing a work costs a slot.', false);
num('slots', 'initial', 'Starting slots', 'Slots available at the start.', 24, { min: 0, max: 5000 });
num('slots', 'perLevel', 'Slots per level', 'Slots gained each level.', 4, { min: 0, max: 500 });
num('slots', 'perChronicle', 'Slots per chronicle', 'Slots gained per completed chronicle.', 3, { min: 0, max: 100 });
num('slots', 'perFoundations', 'Slots per Foundations run', 'Slots gained per finished Foundations set.', 5, { min: 0, max: 100 });
num('slots', 'tokenPoints', 'Slot token price (points)', 'Cost of one extra slot in the shop.', 60, { min: 0, max: 10000 });
bool('slots', 'refundOnRemove', 'Refund slot on removal', 'Removing a work from the map returns its slot.', true);
bool('slots', 'shelfUnlimited', 'Shelf unlimited', 'The shelf (heard list) never has a limit.', true);

// ---------------- Quests and chronicles ----------------
bool('quests', 'chroniclesEnabled', 'Chronicles enabled', 'Show one-time historical story quests.', true);
num('quests', 'chronicleStepXp', 'Chronicle step XP', 'XP per work heard in a chronicle.', 60, { min: 0, max: 2000 });
num('quests', 'chronicleCompleteXp', 'Chronicle completion XP', 'Bonus XP for finishing a chronicle.', 400, { min: 0, max: 20000 });
num('quests', 'chroniclePoints', 'Chronicle completion points', 'Points for finishing a chronicle.', 150, { min: 0, max: 10000 });
num('quests', 'recentYearsWindow', 'Recent window (years)', 'Works released within this many years count as "recent" for recommendation bias.', 50, { min: 1, max: 200 });
num('quests', 'recentBias', 'Recent bias', 'Weight multiplier for recent works in recommendations (1 = no bias).', 2, { min: 1, max: 10, step: 0.1 });
num('quests', 'earliestYear', 'Earliest year allowed', 'Chronicles and recommendations may reach back to this year.', 1900, { min: 1850, max: 2020 });
num('quests', 'weeklyGatewayXp', 'Weekly gateway XP', 'XP for the weekly gateway quest.', 80, { min: 0, max: 2000 });
num('quests', 'creditHopXp', 'Credit hop quest XP', 'XP for completing a credit hop.', 70, { min: 0, max: 2000 });
num('quests', 'counterpointXp', 'Counterpoint XP', 'XP for the counterpoint quest.', 60, { min: 0, max: 2000 });
num('quests', 'blindSpotXp', 'Blind-spot probe XP', 'XP for rating something in your coolest territory.', 60, { min: 0, max: 2000 });
num('quests', 'reListenXp', 'Re-listen quest XP', 'XP for the monthly re-listen quest.', 50, { min: 0, max: 2000 });
num('quests', 'foundationsSize', 'Foundations set size', 'Number of cornerstone works per genre.', 7, { min: 3, max: 25 });
num('quests', 'foundationsXp', 'Foundations completion XP', "XP for finishing a genre's Foundations.", 300, { min: 0, max: 20000 });
num('quests', 'weeklyResetDay', 'Weekly reset day (0=Sun)', 'Day repeatable weekly quests refresh.', 1, { min: 0, max: 6 });
num('quests', 'monthlyResetDay', 'Monthly reset day', 'Day of month monthly quests refresh.', 1, { min: 1, max: 28 });
num('quests', 'maxActive', 'Max active quests', 'Cap on quests tracked at once.', 6, { min: 1, max: 50 });

// ---------------- Unlocks and consumables ----------------
num('shop', 'creditsLens', 'Credits Lens price', 'Points to unlock the Credits Lens.', 150, { min: 0, max: 100000 });
num('shop', 'secondaryCreditsUses', 'Secondary credits: lookups to go free', 'Credit lookups before secondary credits show for free.', 20, { min: 0, max: 1000 });
num('shop', 'eraLens', 'Era Lens price', 'Points to unlock the Era Lens.', 120, { min: 0, max: 100000 });
num('shop', 'wormholes', 'Wormholes price', 'Points for cross-family links.', 600, { min: 0, max: 100000 });
num('shop', 'wormholesChronicles', 'Wormholes: chronicles needed', 'Completed chronicles required.', 2, { min: 0, max: 50 });
num('shop', 'personnelGraph', 'Personnel graph price', 'Points for the personnel graph.', 900, { min: 0, max: 100000 });
num('shop', 'placeOverlay', 'Place overlay price', 'Points for the geography overlay.', 1200, { min: 0, max: 100000 });
num('shop', 'charterSub', 'Subgenre charter price', 'Points for a subgenre charter.', 400, { min: 0, max: 100000 });
num('shop', 'charterFamily', 'Family charter price', 'Points for a whole-family charter.', 2500, { min: 0, max: 100000 });
num('shop', 'charterFoundations', 'Charter: Foundations needed in parent', 'Cornerstone works required in the parent genre.', 5, { min: 0, max: 25 });
num('shop', 'lensPackPrice', 'Lens pack price', 'Points per lens pack.', 120, { min: 0, max: 10000 });
num('shop', 'lensPackSize', 'Lens pack size', 'Charges per lens pack.', 4, { min: 1, max: 100 });
num('shop', 'flarePackPrice', 'Scout flare pack price', 'Points per flare pack.', 90, { min: 0, max: 10000 });
num('shop', 'flarePackSize', 'Scout flare pack size', 'Charges per flare pack.', 4, { min: 1, max: 100 });
num('shop', 'flareSteps', 'Scout flare radius (hex steps)', 'How far a flare lifts the fog.', 2.5, { min: 0.5, max: 10, step: 0.1 });
num('shop', 'dowsePackPrice', 'Dowsing rod pack price', 'Points per dowsing pack.', 150, { min: 0, max: 10000 });
num('shop', 'dowsePackSize', 'Dowsing rod pack size', 'Charges per dowsing pack.', 2, { min: 1, max: 100 });
num('shop', 'dowseMinPredicted', 'Dowsing: minimum predicted rating', 'Dowsing points at works predicted at or above this.', 8, { min: 1, max: 10, step: 0.1 });
num('shop', 'rollPrice', 'Rarity roll price', 'Points per rarity roll.', 200, { min: 0, max: 10000 });
bool('shop', 'unlockTimeGates', 'Enforce minimum unlock times', 'Some unlocks also need days since the last one, to stretch progress over weeks.', false);
num('shop', 'minDaysBetweenBigUnlocks', 'Days between big unlocks', 'Minimum days between family charters and similar when time gates are on.', 7, { min: 0, max: 365 });

// ---------------- Recommendations ----------------
num('recs', 'perExpand', 'Works revealed per expansion', 'Candidates added each time you grow from a work, credit or relation.', 8, { min: 1, max: 100 });
num('recs', 'maxVisible', 'Max works on screen', 'Hard cap for rendering.', 5000, { min: 100, max: 100000 });
num('recs', 'weightTags', 'Similarity weight: tags', 'Weight of shared genre/style tags.', 1.0, { min: 0, max: 5, step: 0.05 });
num('recs', 'weightCredits', 'Similarity weight: credits', 'Weight of shared producers, engineers and players.', 1.4, { min: 0, max: 5, step: 0.05 });
num('recs', 'weightEra', 'Similarity weight: era', 'Weight of release-year proximity.', 0.4, { min: 0, max: 5, step: 0.05 });
num('recs', 'weightSamples', 'Similarity weight: samples', 'Weight of sample and cover relationships.', 1.2, { min: 0, max: 5, step: 0.05 });
num('recs', 'weightCollab', 'Similarity weight: listener overlap', 'Weight of ListenBrainz-style collaborative filtering.', 0.8, { min: 0, max: 5, step: 0.05 });
num('recs', 'highRatingPull', 'High-rating pull', 'How strongly works similar to your high ratings are favored.', 1.5, { min: 0, max: 5, step: 0.05 });
num('recs', 'lowRatingPush', 'Low-rating push', 'How strongly works similar to your low ratings are avoided.', 1.0, { min: 0, max: 5, step: 0.05 });
num('recs', 'ratingNeutral', 'Neutral rating', 'Ratings above pull, below push.', 6, { min: 1, max: 10, step: 0.1 });
num('recs', 'obscurityBoost', 'Obscurity boost', 'Extra weight for rarer works among the tiers you have unlocked.', 0.5, { min: 0, max: 5, step: 0.05 });
num('recs', 'diversity', 'Diversity', 'Pushes recommendations to differ from each other. 0 = pure similarity.', 0.3, { min: 0, max: 1, step: 0.01 });
num('recs', 'minYear', 'Ignore works before (year)', 'Hard floor on release year for recommendations.', 1900, { min: 1850, max: 2025 });
bool('recs', 'albumsEpsOnly', 'Albums and EPs only', 'Exclude singles, compilations and live albums.', true);
bool('recs', 'includeCompilations', 'Include compilations', 'Include compilations when albums-only is on.', false);

// ---------------- Data sources ----------------
bool('data', 'useWikipedia', 'Use Wikipedia and Wikidata', 'Bios and "influenced by" links.', true);
pick('data', 'previewProvider', 'Preview provider', 'Where 30-second previews come from.', 'deezer', ['deezer', 'itunes', 'none']);
text('data', 'userAgent', 'MusicBrainz user-agent', 'Required by MusicBrainz. Use an app name and a contact.', 'Strata/0.1 (you@example.com)');
num('data', 'cacheDays', 'Cache lifetime (days)', 'How long fetched data is reused before refetching.', 30, { min: 0, max: 3650 });
num('data', 'bioMaxChars', 'Bio length (characters)', 'Maximum bio text shown.', 900, { min: 100, max: 5000 });
bool('data', 'fetchOnHover', 'Fetch on hover', 'Prefetch details when you hover a work.', false);

// ---------------- Interface ----------------
color('ui', 'background', 'Background', 'Canvas background color.', '#0B0E12');
color('ui', 'text', 'Text color', 'Main text color.', '#E8E4DA');
color('ui', 'mutedText', 'Muted text color', 'Secondary text color.', '#9AA3AE');
num('ui', 'seenDim', 'Heard art dimming', 'Opacity of art for works you have heard (lower = dimmer).', 0.5, { min: 0.1, max: 1, step: 0.01 });
num('ui', 'unheardBrightness', 'Unheard art brightness', 'Opacity of art for works you have not heard.', 1, { min: 0.3, max: 1, step: 0.01 });
num('ui', 'labelZoom', 'Show titles above zoom', 'Zoom level at which titles appear under tiles.', 0.6, { min: 0.1, max: 4, step: 0.05 });
pick('ui', 'labelMode', 'Titles', 'Which tiles get titles.', 'heard-and-lit', ['all', 'heard-and-lit', 'lit', 'none']);
bool('ui', 'playOnHover', 'Play button on art hover', 'Show a play button over the art on hover.', true);
num('ui', 'panelWidth', 'Info panel width (px)', 'Width of the side panel.', 380, { min: 280, max: 700 });
num('ui', 'zoomMin', 'Minimum zoom', 'Furthest you can zoom out.', 0.1, { min: 0.01, max: 1, step: 0.01 });
num('ui', 'zoomMax', 'Maximum zoom', 'Closest you can zoom in.', 4, { min: 1, max: 20, step: 0.1 });
num('ui', 'fontSize', 'Base font size', 'Base text size.', 13, { min: 9, max: 24 });
bool('ui', 'reduceMotion', 'Reduce motion', 'Disable animations.', false);

// ---------------- Saving ----------------
num('persist', 'autosaveSeconds', 'Autosave interval (seconds)', 'How often progress is written locally.', 10, { min: 1, max: 600 });
num('persist', 'backups', 'Backups kept', 'Rolling backups of your save.', 5, { min: 0, max: 100 });
bool('persist', 'confirmReset', 'Confirm before reset', 'Ask before resetting progress or settings.', true);


// ---------------- Views (time, credits, place) ----------------
num('views', 'timeWidth', 'Time view width (px)', 'Horizontal span from the earliest to the latest work in the chronological view.', 3200, { min: 800, max: 20000 });
num('views', 'laneHeight', 'Time view lane height (px)', 'Vertical distance between genre lanes in the chronological view.', 260, { min: 100, max: 800 });
num('views', 'placeScale', 'Place view scale (px per degree)', 'How far apart cities sit in the place view. Larger spreads dense cities out.', 14, { min: 2, max: 60 });
num('views', 'creditsStrength', 'Credits view pull', 'Similarity given to two works that share a producer or player, so they sit close in the credits view.', 0.95, { min: 0, max: 1, step: 0.01 });
bool('views', 'showDecades', 'Decade markers in time view', 'Draw decade lines and labels in the chronological view.', true);

// ---------------- Threads ----------------
for (const [t, on, lab] of [['influence', true, 'lineage'], ['contemporary', true, 'scene'], ['personnel', true, 'credits'], ['sample', true, 'samples'], ['other', false, 'trail']]) {
  bool('threads', `extend.${t}`, `Threads follow: ${t}`, 'Whether rating a work next to your latest one along this connection type extends a thread.', on);
  text('threads', `label.${t}`, `Thread label word: ${t}`, 'Word added after the first work title to name a thread of this kind.', lab);
}
num('threads', 'maxKept', 'Threads kept', 'Most threads remembered. The least recently used are dropped first.', 12, { min: 1, max: 100 });
num('threads', 'minLinks', 'Minimum links to show', 'Threads shorter than this are hidden from the threads bar (they still exist). 0 shows all.', 0, { min: 0, max: 20 });

// ---------------- Taste signature ----------------
const traitDefaults = { hiphop: [.85, .35, .55, .9], funksoul: [.9, .6, .45, .7], pop: [.6, .5, .15, .9], rock: [.65, .45, .7, .7], electronic: [.85, .35, .45, .1], ambient: [.15, .7, .3, .05], jazz: [.6, .95, .3, .2] };
for (const id of FAMILY_IDS) {
  ['rhythm', 'harmonic', 'grit', 'vocal'].forEach((dim, i) => num('taste', `${id}.${dim}`, `${famDefaults[id][0]}: ${dim}`, 'Typical level (0 to 1) of this trait in the family. Works blend their families by weight.', traitDefaults[id][i], { min: 0, max: 1, step: 0.05 }));
}
num('taste', 'eraSpreadYears', 'Era spread: full at (years)', 'Standard deviation of release years that counts as a full era-spread axis.', 25, { min: 3, max: 100 });
num('taste', 'compareDays', 'Compare against (days ago)', 'The dashed shape shows your signature as it was this many days ago.', 30, { min: 1, max: 3650, unit: 'days' });

// ---------------- Added settings: fog, recs, quests, shop, data, ui ----------------
num('fog', 'silhouetteExtra', 'Silhouette range (hex steps)', 'Fogged works this close beyond a revealed edge show as a faint "?" tile.', 1.5, { min: 0, max: 6, step: 0.1 });
num('fog', 'silhouetteMax', 'Max silhouettes', 'Cap on "?" tiles drawn inside the fog.', 24, { min: 0, max: 500 });
num('recs', 'eraScaleYears', 'Era similarity scale (years)', 'Years apart at which era similarity falls to about a third.', 12, { min: 1, max: 100 });
num('recs', 'autoLinkCount', 'Auto-links for added works', 'How many connections a work you add gets, chosen by similarity.', 3, { min: 0, max: 20 });
num('recs', 'autoLinkMinSim', 'Auto-link minimum similarity', 'Candidates below this are not linked.', 0.35, { min: 0, max: 1, step: 0.01 });
bool('recs', 'wormholesRequired', 'Cross-family growth needs Wormholes', 'Without the Wormholes unlock, growing from a work only reaches works that share a family with it.', true);
num('quests', 'gatewayMaxFamilyWorks', 'Weekly gateway: family works at most', 'The weekly gateway counts a first rating of an easy work (mainstream or essential) in a family where you have heard fewer than this many.', 3, { min: 1, max: 50 });
num('quests', 'creditHopLength', 'Credit hop length', 'Works to rate in a row after following credit names for a credit hop to complete.', 3, { min: 1, max: 20 });
num('quests', 'counterpointMaxSim', 'Counterpoint: max similarity', 'A work counts as pushing against your latest top rating when its similarity to that work is at or below this.', 0.35, { min: 0, max: 1, step: 0.01 });
num('quests', 'counterpointMinRating', 'Counterpoint: reference rating', 'The latest work you rated at least this high is the one to push against.', 9, { min: 1, max: 10, step: 0.1 });
num('quests', 'chronicleLensCharges', 'Chronicle reward: lens charges', 'Lens charges granted for finishing a chronicle.', 2, { min: 0, max: 50 });
num('shop', 'personnelChronicles', 'Personnel graph: chronicles needed', 'Completed chronicles required.', 3, { min: 0, max: 50 });
num('shop', 'startLensCharges', 'Starting lens charges', 'Lens charges in a new save.', 3, { min: 0, max: 100 });
num('shop', 'startPoints', 'Starting points', 'Points in a new save.', 0, { min: 0, max: 100000 });
bool('shop', 'gateViews', 'Unlocks gate the alternate views', 'Time needs the Era Lens, Credits needs the Personnel graph, Place needs the Place overlay. Off opens all views.', true);
bool('data', 'fetchCovers', 'Fetch cover art', 'Load cover art from the Cover Art Archive for works on screen, one at a time.', true);
num('data', 'coverSize', 'Cover size (px)', 'Cover Art Archive size to request (250 or 500 are cached).', 250, { min: 100, max: 1200 });
num('data', 'searchLimit', 'Search results when adding', 'How many MusicBrainz matches to list when you add a work.', 6, { min: 1, max: 25 });
num('data', 'defaultTier', 'Default tier for added works', 'Tier index (0 mainstream to 5 ghost) given when no popularity data is available.', 2, { min: 0, max: 5 });
text('ui', 'levelTitles', 'Level titles', 'Comma separated titles, one per level. The last one repeats.', 'Seed,Listener,Wanderer,Surveyor,Pathfinder,Navigator,Cartographer,Pioneer,Archivist,Elder');
num('ui', 'shelfMax', 'Shelf rows shown', 'Most rows drawn in the shelf list (newest first).', 60, { min: 5, max: 1000 });
num('ui', 'searchMax', 'Search results shown', 'Most rows in the search dropdown.', 8, { min: 1, max: 50 });
num('ui', 'toastMs', 'Notice time (ms)', 'How long XP and quest notices stay on screen.', 4000, { min: 500, max: 20000 });
num('ui', 'minimapSize', 'Minimap size (px)', 'Side length of the minimap.', 108, { min: 60, max: 300 });

// ---------------- Sync and accounts ----------------
// Credentials are NOT settings. They live in their own store (strata.accounts.v1) so a settings export never contains a token.
pick('sync', 'unverifiedSeed', 'Starter catalogue (unverified)', 'The built-in starter works, connections and chronicles were written from memory and are not checked against any source. "show" keeps them flagged as unverified. "hide" removes unheard unverified works and all starter connections until sync has verified them.', 'show', ['show', 'hide']);
bool('sync', 'importAsHeard', 'Imported works count as heard', 'Works that come from your accounts are marked heard. Off adds them to the map as unheard.', true);
bool('sync', 'importRatings', 'Import ratings', 'Use ratings that come with an import (Discogs collection ratings). Nothing else supplies one, and no rating is ever made up: imported works stay unrated until you rate them.', true);
num('sync', 'discogsRatingScale', 'Discogs rating multiplier', 'Discogs rates 1 to 5. This multiplies it onto the 1 to 10 scale.', 2, { min: 1, max: 4, step: 0.5 });
num('sync', 'maxImport', 'Most works per import', 'Safety cap on one import from one account.', 500, { min: 10, max: 20000 });
num('sync', 'unknownRecencyDays', 'Recency for undated imports (days)', 'Top-albums lists carry no date. Imported works with no date are treated as last visited this many days ago.', 365, { min: 0, max: 7300, unit: 'days' });
pick('sync', 'lastfmPeriod', 'Last.fm period', 'Time range for Last.fm top albums.', 'overall', ['overall', '12month', '6month', '3month', '1month', '7day']);
bool('sync', 'fetchArtists', 'Verify: artists', 'Fetch each artist from MusicBrainz: origin, life span, genres, tags, relations to other artists.', true);
bool('sync', 'fetchCredits', 'Verify: credits and samples', 'Fetch producers, players and sample links from the earliest official release (one extra MusicBrainz request per work).', true);
bool('sync', 'fetchPlaces', 'Verify: places', 'Look up coordinates for artist origins through Wikidata.', true);
bool('sync', 'fetchPopularity', 'Verify: popularity', 'Ask ListenBrainz how many people listened, to set the rarity tier.', true);
bool('sync', 'fetchSimilar', 'Verify: similar artists', 'Ask Last.fm for similar artists (needs a Last.fm key) and connect works whose artists match.', true);
bool('sync', 'fetchInfluence', 'Verify: influenced by', 'Read Wikidata "influenced by" on artists and connect works by influencer and influenced.', true);
bool('sync', 'reclassify', 'Re-classify from verified genres', 'Once a work has verified genres, recompute its family weights from them using the keywords below. Off keeps the weights it had.', true);
num('sync', 'matchMinScore', 'Search match minimum score', 'MusicBrainz search scores 0 to 100. A work without an id is matched to the top search result only at or above this and only if title and artist also agree.', 90, { min: 50, max: 100 });
text('sync', 'editionWords', 'Edition words', 'Comma separated. A trailing bracket group containing one of these words is ignored when matching titles (so "Title (Deluxe Edition)" matches "Title").', 'deluxe,remaster,remastered,expanded,anniversary,edition,bonus,version');
text('sync', 'producerTypes', 'MusicBrainz relation types: producer', 'Comma separated relationship type names counted as producer credits.', 'producer');
text('sync', 'playerTypes', 'MusicBrainz relation types: players', 'Comma separated relationship type names counted as guests and players. The relationship attributes (instrument, vocal kind) are shown after the name.', 'instrument,vocal');
text('sync', 'sampleTypes', 'MusicBrainz relation types: samples', 'Comma separated recording to recording relationship names counted as sample links.', 'samples material');
text('sync', 'artistRelTypes', 'MusicBrainz relation types: artist links', 'Comma separated artist to artist relationship names that connect the works of two artists as personnel links.', 'member of band,collaboration');
text('sync', 'coordProperty', 'Wikidata property: coordinates', 'Wikidata property id for coordinate location.', 'P625');
text('sync', 'influenceProperty', 'Wikidata property: influenced by', 'Wikidata property id for "influenced by".', 'P737');
pick('sync', 'placeSource', 'Place comes from', 'begin-area is where an artist was born or formed, area is where they are listed now.', 'begin-area', ['begin-area', 'area']);
bool('sync', 'placeAllowCountry', 'Allow country-level places', 'A place that is only a country would be pinned to its centre. Off leaves such works without a place.', false);
num('sync', 'subgenreMinWorks', 'Subgenre: works needed', 'A verified genre becomes a charter-able subgenre once this many works in your library carry it.', 3, { min: 1, max: 50 });
num('sync', 'subgenreMax', 'Most subgenres', 'Cap on subgenres derived from verified genres.', 40, { min: 0, max: 500 });
num('sync', 'linkSim', 'Artist link similarity', 'Similarity given to connections made from artist relations (member of band, collaboration) and Wikidata influence.', 0.7, { min: 0, max: 1, step: 0.05 });
num('sync', 'sampleSim', 'Sample link similarity', 'Similarity given to a sample connection found in MusicBrainz.', 0.6, { min: 0, max: 1, step: 0.05 });
num('sync', 'similarMin', 'Similar artists: minimum match', 'Last.fm matches below this (0 to 1) are ignored.', 0.3, { min: 0, max: 1, step: 0.05 });
num('sync', 'discographyLimit', 'Discography: most works', 'Most albums and EPs fetched when adding an artist\'s other work.', 100, { min: 10, max: 1000 });
for (const [t, v] of [['mainstream', 500000], ['essential', 100000], ['cult', 20000], ['niche', 4000], ['deepcut', 600]]) {
  num('sync', `listenersMin.${t}`, `Listeners for ${t}`, 'ListenBrainz unique listeners at or above this put a work in this tier or a more common one. Below the last threshold it is a ghost. Placeholder numbers: tune them to what ListenBrainz data looks like.', v, { min: 0, max: 100000000 });
}
text('sync', 'proxyTemplate', 'Request proxy (optional)', 'If your browser blocks an API (CORS), route requests through a proxy you run. Use {url} where the encoded target goes, for example https://my-proxy.example/?u={url}. Empty means direct.', '');
for (const [h, ms] of [['musicbrainz', 1100], ['listenbrainz', 300], ['lastfm', 250], ['discogs', 1100], ['wikidata', 300]]) {
  num('sync', `delayMs.${h}`, `Delay between ${h} requests (ms)`, h === 'musicbrainz' ? 'MusicBrainz asks for no more than one request a second from one IP address. Do not go below 1000.' : 'Minimum time between requests to this service.', ms, { min: h === 'musicbrainz' ? 1000 : 0, max: 60000 });
}
num('sync', 'retries', 'Retries', 'How many times a request that gets rate-limited (429) or a 503 is retried, waiting as the server asks.', 3, { min: 0, max: 10 });
for (const id of FAMILY_IDS) text('sync', `tags.${id}`, `Tag keywords: ${famDefaults[id][0]}`, 'Comma separated words. A genre or tag containing one of them counts toward this family when classifying a work.', TAG_KEYWORDS[id].join(','));

export const SETTINGS = S;
export function defaults() {
  const out = {};
  for (const s of S) out[s.key] = s.default;
  return out;
}
