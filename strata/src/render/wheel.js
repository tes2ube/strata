// Mastery wheel as an SVG string: one slice per family, rings outward are rarity tiers. Lit = unlocked, partial arc = progress to the next ring.
// No DOM, so the docs tool and the app both use it. Sizes are fixed art constants, colors and names come from settings.
import { TIER_IDS, FAMILY_IDS } from '../settings/definitions.js';
import { allowedTier } from '../core/fog.js';

export function wheelSvg(ms, cfg, { charters = { family: {} }, size = 720 } = {}) {
  const C = 360, R0 = 62, T = 34, G = 5, N = FAMILY_IDS.length, GAP = 2.2;
  const pt = (r, a) => [C + r * Math.cos(a), C + r * Math.sin(a)];
  const arc = (r0, r1, a0, a1) => { const [x0, y0] = pt(r1, a0), [x1, y1] = pt(r1, a1), [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0); const big = a1 - a0 > Math.PI ? 1 : 0; return `M${x0} ${y0}A${r1} ${r1} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${big} 0 ${x3} ${y3}Z`; };
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" width="${size}" height="${size}" role="img" aria-label="Mastery wheel"><rect width="720" height="720" fill="${cfg.get('ui.background')}"/>`;
  FAMILY_IDS.forEach((f, i) => {
    const hue = cfg.get(`genres.${f}.hue`), a0 = -Math.PI / 2 + i * 2 * Math.PI / N + GAP * Math.PI / 180, a1 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / N - GAP * Math.PI / 180;
    const allowed = Math.max(allowedTier(f, ms, cfg), charters.family?.[f] ? 1 : 0);
    TIER_IDS.forEach((t, k) => {
      const r0 = R0 + k * (T + G), r1 = r0 + T;
      svg += `<path d="${arc(r0, r1, a0, a1)}" fill="#161C23"/>`;
      const lit = k <= allowed; let frac = 0;
      if (lit) frac = 1; else if (k === allowed + 1) frac = Math.min(1, ms.mastery[f] / cfg.get(`tiers.${t}.unlockMastery`));
      if (frac > 0) svg += `<path d="${arc(r0, r1, a0, a0 + (a1 - a0) * frac)}" fill="hsl(${hue} ${lit ? 62 : 40}% ${28 + k * 6}%)" ${lit ? '' : 'opacity=".7"'}/>`;
      svg += `<path d="${arc(r0, r1, a0, a1)}" fill="none" stroke="${cfg.get(`tiers.${t}.color`)}" stroke-width="${lit ? 1.5 : 0.6}" opacity="${lit ? 0.9 : 0.35}"/>`;
    });
    const am = (a0 + a1) / 2, [lx, ly] = pt(R0 + N * (T + G) - G + 36, am);
    svg += `<text x="${lx}" y="${ly}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="hsl(${hue} 70% 72%)">${cfg.get(`genres.${f}.name`)}</text>`;
  });
  svg += `<circle cx="${C}" cy="${C}" r="${R0 - 14}" fill="${cfg.get('ui.background')}" stroke="${cfg.get('ui.text')}" stroke-width="2"/><circle cx="${C}" cy="${C}" r="10" fill="none" stroke="${cfg.get('ui.text')}" stroke-width="2"/><circle cx="${C}" cy="${C}" r="3" fill="${cfg.get('ui.text')}"/>`;
  TIER_IDS.forEach((t, k) => { svg += `<text x="${C + 8}" y="${C - R0 - k * (T + G) - T / 2 + 4}" font-family="ui-monospace,monospace" font-size="10" fill="${cfg.get('ui.mutedText')}">${cfg.get(`tiers.${t}.name`)}</text>`; });
  return svg + '</svg>';
}
