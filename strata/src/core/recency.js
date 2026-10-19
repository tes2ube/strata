// Recency ring fraction from days since last engagement: full for fullDays, half at halfDays, minimum after emptyDays.
export function ringFraction(days, cfg) {
  const full = cfg.get('recency.fullDays'), half = cfg.get('recency.halfDays'), end = cfg.get('recency.emptyDays'), min = cfg.get('recency.minRing');
  if (days <= full) return 1;
  if (days >= end) return min;
  if (days <= half) return 1 - 0.5 * (days - full) / (half - full);
  return 0.5 - (0.5 - min) * (days - half) / (end - half);
}
export function territoryDays(daysList, cfg) {
  if (!daysList.length) return Infinity;
  const mode = cfg.get('recency.territoryMode');
  if (mode === 'latest') return Math.min(...daysList);
  if (mode === 'average') return daysList.reduce((a, b) => a + b, 0) / daysList.length;
  const s = [...daysList].sort((a, b) => a - b); return s[Math.floor(s.length / 2)];
}
