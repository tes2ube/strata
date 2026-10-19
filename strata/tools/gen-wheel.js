// Mastery wheel for the docs, from the seed data: node tools/gen-wheel.js (npm run docs)
import { writeFileSync } from 'node:fs';
import { plainSettings } from '../src/settings/store.js';
import { FAMILY_IDS } from '../src/settings/definitions.js';
import { computeMastery, allowedTier } from '../src/core/fog.js';
import { wheelSvg } from '../src/render/wheel.js';
import { WORKS } from '../src/data/seed.js';
const cfg = plainSettings(); const ms = computeMastery(WORKS, cfg);
writeFileSync(new URL('../docs/mastery-wheel.svg', import.meta.url), wheelSvg(ms, cfg));
console.log('wrote docs/mastery-wheel.svg', Object.fromEntries(FAMILY_IDS.map((f) => [f, [Math.round(ms.mastery[f]), allowedTier(f, ms, cfg)]])));
