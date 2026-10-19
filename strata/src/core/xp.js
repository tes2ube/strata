// XP math. All numbers come from settings.
export function ratingXp({ work, rating, predicted, chainLen = 0, restedPool = 0, firstInFamily = false, firstInSub = false, isReRate = false, lineageDepth = 0, viaCredit = false }, cfg) {
  const tierIds = ['mainstream', 'essential', 'cult', 'niche', 'deepcut', 'ghost'];
  const base = isReRate ? cfg.get('xp.reRateBase') : cfg.get('xp.rateBase');
  const tierM = cfg.get(`tiers.${tierIds[work.tier]}.xpMult`);
  let badgeM = 1;
  for (const b of work.badges || []) if (cfg.get(`badges.${b}.enabled`)) badgeM *= cfg.get(`badges.${b}.xpMult`) ** (b === 'deepend' && rating < 7 ? 0 : 1);
  let bonus = 0;
  if (predicted != null && Math.abs(rating - predicted) >= cfg.get('xp.surpriseThreshold')) bonus += cfg.get('xp.surpriseBonus');
  if (rating <= cfg.get('xp.lowRatingFloor')) bonus += cfg.get('xp.lowRatingBonus');
  const chainBonus = Math.min(cfg.get('xp.chainCap'), chainLen * cfg.get('xp.chainPerLink'));
  const restedUse = Math.min(restedPool, base * cfg.get('xp.restedRate'));
  let xp = base * tierM * badgeM * (1 + bonus + chainBonus) + restedUse;
  xp += lineageDepth * cfg.get('xp.lineageDepthBonus') + (viaCredit ? cfg.get('xp.creditHopBonus') : 0);
  if (firstInFamily) xp += cfg.get('xp.leapBase'); else if (firstInSub) xp += cfg.get('xp.leapSubBase');
  return { xp: Math.round(xp), restedUsed: restedUse, chainBonus };
}
export const pointsFromXp = (xp, cfg) => Math.floor(xp * cfg.get('xp.pointsPerXp'));
export function levelFromXp(xp, cfg) {
  let lvl = 1, need = cfg.get('xp.levelBase'), left = xp;
  while (left >= need && lvl < 999) { left -= need; need *= cfg.get('xp.levelGrowth'); lvl++; }
  return { level: lvl, into: left, need: Math.round(need) };
}
export function restedPoolAfter(pool, daysAway, cfg) { return Math.min(cfg.get('xp.restedCap'), pool + daysAway * cfg.get('xp.restedPerDay')); }
