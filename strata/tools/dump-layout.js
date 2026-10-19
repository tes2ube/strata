// Dumps layout + routes as JSON (used to eyeball the result): node tools/dump-layout.js > /tmp/layout.json
import { plainSettings } from '../src/settings/store.js';
import { layout } from '../src/core/layout.js';
import { routeEdges, pathString } from '../src/core/routing.js';
import { WORKS, EDGES } from '../src/data/seed.js';
const cfg = plainSettings();
const L = layout({ works: WORKS.map((w) => ({ ...w })), edges: EDGES, cfg });
const routes = routeEdges({ centers: L.pos, halfOf: () => cfg.get('layout.tileSize') / 2, edges: EDGES, lattice: L.lattice, cfg });
console.log(JSON.stringify({ pos: L.pos, routes: routes.map((r, i) => ({ ...r, e: EDGES[i] })), works: WORKS.map((w) => ({ id: w.id, heard: w.heard, title: w.title })), spacing: cfg.get('layout.spacing') }));
