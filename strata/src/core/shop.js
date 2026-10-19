// Unlocks and consumables. Pure: functions take the state and mutate it only in buy/use helpers.
// Permanent: Credits Lens, Era Lens, Wormholes, Personnel graph, Place overlay, charters. Repeatable: packs and slot tokens.
// state.unlocks = {id: ts}, state.charges = {lens, flare, dowse, roll}, state.slotTokens, state.lastBigUnlock.
import { FAMILY_IDS } from '../settings/definitions.js';
import { foundationProgress, chroniclesDone, foundationsDone } from './quests.js';
import { levelFromXp } from './xp.js';
import { domFam } from './fog.js';

const DAY = 864e5;
export const has = (state, id) => !!state.unlocks[id];
const BIG = (id) => ['wormholes', 'personnelGraph', 'placeOverlay'].includes(id) || id.startsWith('family:');

function foundationsMet(parents, works, cfg) {
  const out = []; let ok = true;
  for (const f of parents) { const p = foundationProgress(f, works, cfg), need = Math.min(cfg.get('shop.charterFoundations'), p.total); out.push({ fam: f, have: p.have, need }); if (p.have < need || p.total === 0) ok = false; }
  return { ok, parts: out };
}

// All shop entries with status 'owned' | 'available' | 'locked' and the reasons something is locked.
export function shopItems(state, works, subgenres, cfg, now) {
  const chron = chroniclesDone(state), names = (f) => cfg.get(`genres.${f}.name`);
  const items = [];
  const unlock = (id, branch, name, desc, price, reasons = []) => {
    const owned = has(state, id); const r = reasons.slice();
    if (!owned && cfg.get('shop.unlockTimeGates') && BIG(id) && state.lastBigUnlock && now - state.lastBigUnlock < cfg.get('shop.minDaysBetweenBigUnlocks') * DAY)
      r.push(`Wait ${Math.ceil(cfg.get('shop.minDaysBetweenBigUnlocks') - (now - state.lastBigUnlock) / DAY)} more days since your last big unlock`);
    if (!owned && state.points < price) r.push(`Needs ${price} points (you have ${state.points})`);
    items.push({ id, kind: 'unlock', branch, name, desc, price, owned, status: owned ? 'owned' : r.length ? 'locked' : 'available', reasons: owned ? [] : r });
  };
  unlock('creditsLens', 'credits', 'Credits Lens', 'Reveal producers, players and samples on a work. Each reveal spends a lens charge.', cfg.get('shop.creditsLens'));
  items.push({ id: 'secondaryCredits', kind: 'auto', branch: 'credits', name: 'Secondary credits, free', desc: 'After enough lookups, guests and players show without spending a charge.', owned: state.creditLookups >= cfg.get('shop.secondaryCreditsUses'), progress: Math.min(state.creditLookups, cfg.get('shop.secondaryCreditsUses')), target: cfg.get('shop.secondaryCreditsUses'), status: state.creditLookups >= cfg.get('shop.secondaryCreditsUses') ? 'owned' : 'progress', reasons: [] });
  unlock('eraLens', 'time', 'Era Lens', 'Opens the time view: works laid out by year, a lane for each family.', cfg.get('shop.eraLens'));
  unlock('wormholes', 'time', 'Wormholes', 'Growing from a work can jump across families.', cfg.get('shop.wormholes'), chron < cfg.get('shop.wormholesChronicles') ? [`Finish ${cfg.get('shop.wormholesChronicles')} chronicles (${chron} done)`] : []);
  unlock('personnelGraph', 'credits', 'Personnel graph', 'Opens the credits view: works that share people sit together.', cfg.get('shop.personnelGraph'), [...(has(state, 'creditsLens') ? [] : ['Needs the Credits Lens']), ...(chron < cfg.get('shop.personnelChronicles') ? [`Finish ${cfg.get('shop.personnelChronicles')} chronicles (${chron} done)`] : [])]);
  unlock('placeOverlay', 'place', 'Place overlay', 'Opens the place view: works laid out by city.', cfg.get('shop.placeOverlay'), has(state, 'eraLens') ? [] : ['Needs the Era Lens']);
  for (const s of subgenres) {
    const m = foundationsMet(s.parents, works, cfg);
    unlock('sub:' + s.id, 'charters', `Charter: ${s.name}`, 'Shows this subgenre\'s works up to the tier you have unlocked.', cfg.get('shop.charterSub'), m.ok ? [] : ['Foundations: ' + m.parts.map((p) => `${names(p.fam)} ${p.have}/${p.need}`).join(', ')]);
  }
  for (const f of FAMILY_IDS) unlock('family:' + f, 'charters', `Family charter: ${names(f)}`, 'Opens the family\'s mainstream and essential works at once.', cfg.get('shop.charterFamily'));
  const pack = (id, name, desc, price, size, key) => items.push({ id, kind: 'pack', branch: 'consumables', name: `${name} x${size}`, desc, price, size, key, charges: state.charges[key] || 0, status: state.points >= price ? 'available' : 'locked', reasons: state.points >= price ? [] : [`Needs ${price} points`] });
  pack('lensPack', 'Lens pack', 'Each charge reveals one kind of connection on a work.', cfg.get('shop.lensPackPrice'), cfg.get('shop.lensPackSize'), 'lens');
  pack('flarePack', 'Scout flare', 'Lift the fog around a spot you pick.', cfg.get('shop.flarePackPrice'), cfg.get('shop.flarePackSize'), 'flare');
  pack('dowsePack', 'Dowsing rod', 'Points at the nearest work you will probably rate highly.', cfg.get('shop.dowsePackPrice'), cfg.get('shop.dowsePackSize'), 'dowse');
  pack('rollPack', 'Rarity roll', 'One pick from the next rarer tier in a family you have opened.', cfg.get('shop.rollPrice'), 1, 'roll');
  if (cfg.get('slots.enabled')) items.push({ id: 'slotToken', kind: 'pack', branch: 'consumables', name: 'Slot token x1', desc: 'One extra map slot.', price: cfg.get('slots.tokenPoints'), size: 1, key: 'slotToken', charges: state.slotTokens, status: state.points >= cfg.get('slots.tokenPoints') ? 'available' : 'locked', reasons: [] });
  return items;
}

export function buy(state, works, subgenres, id, cfg, now) {
  const it = shopItems(state, works, subgenres, cfg, now).find((x) => x.id === id);
  if (!it || it.kind === 'auto') return { ok: false, reason: 'Not for sale.' };
  if (it.kind === 'unlock' && it.owned) return { ok: false, reason: 'Already owned.' };
  if (it.status !== 'available') return { ok: false, reason: it.reasons[0] || 'Locked.' };
  state.points -= it.price;
  if (it.kind === 'unlock') { state.unlocks[id] = now; if (BIG(id)) state.lastBigUnlock = now; }
  else if (it.key === 'slotToken') state.slotTokens += 1;
  else state.charges[it.key] = (state.charges[it.key] || 0) + it.size;
  return { ok: true, item: it };
}

export function useCharge(state, key) { if ((state.charges[key] || 0) <= 0) return false; state.charges[key]--; return true; }

// Views: genre is always open. Others need unlocks unless shop.gateViews is off.
export function viewOpen(view, state, cfg) {
  if (view === 'genre' || !cfg.get('shop.gateViews')) return true;
  return has(state, { time: 'eraLens', credits: 'personnelGraph', place: 'placeOverlay' }[view]);
}

// Dowsing: nearest unheard work (by lattice distance from the origin hex) predicted at or above the minimum. predict(work) -> number|null.
export function pickDowse(works, hexPos, lattice, origin, predict, cfg) {
  let best = null; const min = cfg.get('shop.dowseMinPredicted');
  for (const w of works) {
    if (w.heard || !hexPos[w.id]) continue; const p = predict(w); if (p == null || p < min) continue;
    const d = lattice.dist(origin, hexPos[w.id]); if (!best || d < best.d) best = { id: w.id, d, predicted: p };
  }
  return best;
}

// Rarity roll: an unheard work one tier rarer than the family has unlocked. fam may be given, otherwise the deepest family with a candidate.
export function pickRoll(works, ms, allowed, rand, cfg, fam = null) {
  const fams = fam ? [fam] : FAMILY_IDS.slice().sort((a, b) => ms.mastery[b] - ms.mastery[a]);
  for (const f of fams) {
    const tier = allowed[f] + 1; if (tier > 5) continue;
    const pool = works.filter((w) => !w.heard && domFam(w) === f && w.tier === tier);
    if (pool.length) return pool[Math.floor(rand() * pool.length)].id;
  }
  return null;
}

// Map slots. Only matter when slots.enabled. Capacity grows with level, chronicles, Foundations and tokens.
export function slotInfo(state, cfg) {
  if (!cfg.get('slots.enabled')) return { enabled: false };
  const lvl = levelFromXp(state.xp, cfg).level;
  const capacity = cfg.get('slots.initial') + cfg.get('slots.perLevel') * (lvl - 1) + cfg.get('slots.perChronicle') * chroniclesDone(state) + cfg.get('slots.perFoundations') * foundationsDone(state) + state.slotTokens - (state.slotsLost || 0);
  return { enabled: true, capacity, used: state.placed.length, free: capacity - state.placed.length };
}
export function place(state, id, cfg) {
  if (state.placed.includes(id)) return { ok: true };
  const s = slotInfo(state, cfg); if (s.enabled && s.free <= 0) return { ok: false, reason: 'No free map slots.' };
  state.placed.push(id); return { ok: true };
}
export function unplace(state, id, cfg) {
  const i = state.placed.indexOf(id); if (i < 0) return { ok: true };
  state.placed.splice(i, 1);
  if (!cfg.get('slots.refundOnRemove')) state.slotsLost = (state.slotsLost || 0) + 1;
  return { ok: true };
}
