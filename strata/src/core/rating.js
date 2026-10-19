// Vertical rating bar: continuous position -> light/decent/strong steps, with border zones between steps.
// f is 0 at the bottom of the bar and 1 at the top. Each integer owns an equal slice; each slice is split in thirds.
export function ratingFromFraction(f, cfg) {
  const lo = cfg.get('rating.min'), hi = cfg.get('rating.max');
  const step = cfg.get('rating.subStep'), band = cfg.get('rating.borderBand');
  const slices = hi - lo + 1;
  const v = Math.min(slices - 1e-9, Math.max(0, f * slices)); // 0 .. slices
  const n = lo + Math.floor(v);
  const within = v - Math.floor(v);                           // 0..1 inside the integer slice
  const thirds = within * 3;                                   // 0..3
  const idx = Math.min(2, Math.floor(thirds));
  const fracInThird = thirds - Math.floor(thirds);
  const names = ['light', 'decent', 'strong'];
  const val = (nn, i) => nn + (i - 1) * step;
  const nearLow = fracInThird < band / 2, nearHigh = fracInThird > 1 - band / 2;
  let kind = 'step', label, value, parts;
  if (nearLow && !(idx === 0 && n === lo)) {
    // border with the previous step
    const pi = idx === 0 ? 2 : idx - 1, pn = idx === 0 ? n - 1 : n;
    kind = 'border';
    value = (val(pn, pi) + val(n, idx)) / 2;
    label = idx === 0 ? `strong ${pn} / light ${n}` : `${names[pi]}/${names[idx]} ${n}`;
    parts = [[pn, names[pi]], [n, names[idx]]];
  } else if (nearHigh && !(idx === 2 && n === hi)) {
    const ni = idx === 2 ? 0 : idx + 1, nn = idx === 2 ? n + 1 : n;
    kind = 'border';
    value = (val(n, idx) + val(nn, ni)) / 2;
    label = idx === 2 ? `strong ${n} / light ${nn}` : `${names[idx]}/${names[ni]} ${n}`;
    parts = [[n, names[idx]], [nn, names[ni]]];
  } else {
    value = val(n, idx);
    label = `${names[idx]} ${n}`;
    parts = [[n, names[idx]]];
  }
  return { n, kind, label, value: Math.round(value * 1000) / 1000, parts };
}
// Inverse for drawing the fill: numeric value -> bar fraction (approximate, center of the step).
export function fractionFromValue(value, cfg) {
  const lo = cfg.get('rating.min'), hi = cfg.get('rating.max'), slices = hi - lo + 1;
  return Math.min(1, Math.max(0, (value - lo + 0.5) / slices));
}
