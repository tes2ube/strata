// Browser app: Canvas2D map and DOM panels. All state changes go through src/core/game.js; all panel HTML comes from html.js.
// NOT yet run in a browser by the author. Everything it calls in src/core is tested in Node, the drawing and event wiring is not.
import { createSettings } from '../settings/store.js';
import { GROUPS, SETTINGS, TIER_IDS, FAMILY_IDS } from '../settings/definitions.js';
import { WORKS, EDGES, SUBGENRES } from '../data/seed.js';
import { CHRONICLES } from '../data/chronicles.js';
import { createGame, freshState } from '../core/game.js';
import { viewLayout } from '../core/views.js';
import { routeEdges, roundedCommands, endDirection } from '../core/routing.js';
import { spotlight } from '../core/spotlight.js';
import { ratingFromFraction, fractionFromValue } from '../core/rating.js';
import { ringFraction, territoryDays } from '../core/recency.js';
import { creditNames } from '../core/recs.js';
import { familiesFromTags, tierFromListeners } from '../core/library.js';
import { enrichmentQueue } from '../core/sync.js';
import { createHttp } from '../sync/http.js';
import { loadAccounts, saveAccounts, setAccountField } from '../sync/accounts.js';
import { PROVIDERS } from '../sync/providers.js';
import { createEngine } from '../sync/engine.js';
import { loadState, saveState, exportState, importState, pickStorage } from '../core/persist.js';
import { BADGES } from '../core/badges.js';
import { fetchBio, fetchPreview, lookupReleaseGroup, searchReleaseGroups, coverUrlFor, setHttp } from '../data/sources.js';
import { shelfHTML, panelHTML, progressHTML, questsHTML, shopHTML, addResultsHTML, familyPickHTML, syncHTML, tierColor, esc } from './html.js';

const { storage: store, persistent } = pickStorage(() => globalThis.localStorage);
const cfg = createSettings(store);
const $ = (id) => document.getElementById(id);
const canvas = $('map'), ctx = canvas.getContext('2d');
const base = { works: WORKS, edges: EDGES, subgenres: SUBGENRES, chronicles: CHRONICLES };

// ---------- game and saving ----------
const game = createGame({ base, cfg, state: loadState(store, freshState(WORKS, cfg, Date.now())) });
// ---------- sync: accounts, one shared throttled http client, the engine ----------
const accounts = loadAccounts(store);
const http = createHttp({ cfg }); setHttp(http);
const syncUi = { busy: null, progress: null, messages: {}, scope: 'library' };
let syncDraw = 0;
const syncRedraw = () => { if (modalName === 'sync' && !syncDraw) syncDraw = requestAnimationFrame(() => { syncDraw = 0; if (modalName === 'sync') { const keep = document.activeElement; if (!keep || keep.tagName !== 'INPUT' || keep.type === 'radio') openModal('sync'); } }); };
const engine = createEngine({ game, accounts, cfg, http, onProgress: (p) => { syncUi.progress = p; syncRedraw(); }, onCheckpoint: () => save() });
function save() {
  if (!persistent) $('saved').textContent = 'Not saving: this browser blocks storage. Use Progress, Export save.';
  else if (saveState(store, game.state, cfg)) $('saved').textContent = 'Saved locally · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  else $('saved').textContent = 'Could not save (storage full?)';
}

// ---------- derived data ----------
let W = [], byId = {}, genreL = null, L = null, vis = null, E = [], routes = [], sil = [], view = 'genre';
let selected = new Set(), hover = { work: null, edge: null }, mode = null;
const ALL_TYPES = ['precedent', 'inspired', 'contemporary', 'personnel', 'sample', 'other'];
const hiddenIn = () => (L && L.hidden) || new Set();
const shown = (id) => vis.visible.has(id) && L.pos[id] && !hiddenIn().has(id);

function recompute(relayout = true) {
  W = game.works(); byId = Object.fromEntries(W.map((w) => [w.id, w]));
  if (relayout || !genreL) genreL = viewLayout({ view: 'genre', works: W, edges: game.edges(), cfg, prev: genreL && genreL.raw });
  vis = game.visibility(genreL.hex, genreL.lattice);
  if (view === 'genre') L = genreL;
  else if (relayout || !L || L === genreL) { L = viewLayout({ view, works: W, edges: game.edges(), cfg }); }
  E = game.edges().filter((e) => shown(e.a) && shown(e.b));
  routes = routeEdges({ centers: L.pos, halfOf: () => cfg.get('layout.tileSize') / 2, edges: E, lattice: L.lattice, cfg });
  sil = view === 'genre' ? silhouettes() : [];
  queueCovers(); refreshChrome(); draw();
}

// Fogged works just beyond a revealed edge show as faint "?" tiles.
function silhouettes() {
  if (!cfg.get('fog.enabled') || !cfg.get('fog.showSilhouettes')) return [];
  const extra = cfg.get('fog.silhouetteExtra'), lat = genreL.lattice, out = [];
  const centers = vis.reveals.map((r) => ({ h: r.hex || genreL.hex[r.id], s: r.steps })).filter((c) => c.h);
  for (const w of W) {
    if (w.heard || vis.visible.has(w.id) || !genreL.hex[w.id]) continue;
    let best = Infinity; for (const c of centers) best = Math.min(best, lat.dist(c.h, genreL.hex[w.id]) - c.s);
    if (best <= extra) out.push({ id: w.id, d: best });
  }
  return out.sort((a, b) => a.d - b.d).slice(0, cfg.get('fog.silhouetteMax')).map((x) => x.id);
}

// ---------- view transform ----------
const vw = { x: 0, y: 0, k: 0.8 };
function resize() { const r = devicePixelRatio || 1; canvas.width = innerWidth * r; canvas.height = innerHeight * r; draw(); }
const toWorld = (sx, sy) => ({ x: (sx - vw.x) / vw.k, y: (sy - vw.y) / vw.k });
function centerOn(id) { const p = L.pos[id]; if (!p) return; vw.x = innerWidth / 2 - 100 - p.x * vw.k; vw.y = innerHeight / 2 - p.y * vw.k; draw(); }
function fitView() {
  const ids = W.filter((w) => shown(w.id)).map((w) => w.id); if (!ids.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const id of ids) { const p = L.pos[id]; x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  const aw = Math.max(300, innerWidth - 720), ah = Math.max(300, innerHeight - 200);
  const k = Math.min(cfg.get('ui.zoomMax'), Math.max(cfg.get('ui.zoomMin'), Math.min(aw / (x1 - x0 + 300), ah / (y1 - y0 + 300))));
  vw.k = k; vw.x = 290 + aw / 2 - (x0 + x1) / 2 * k; vw.y = 70 + ah / 2 - (y0 + y1) / 2 * k; draw();
}

// ---------- color helpers ----------
const hueOf = (w) => { let x = 0, y = 0; for (const [i, wt] of Object.entries(w.fam)) { const h = cfg.get(`genres.${FAMILY_IDS[i]}.hue`) * Math.PI / 180; x += Math.cos(h) * wt; y += Math.sin(h) * wt; } return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360; };
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
const dashOf = (t) => ({ solid: [], dashed: [8, 6], dotted: [1.5, 5] })[cfg.get(`routing.${t}.dash`)];

function edgeStyle(e) {
  let rel = e.type === 'influence' ? 'other' : e.type;
  const focus = new Set([...selected, hover.work].filter(Boolean));
  if (e.type === 'influence') { if (focus.has(e.b)) rel = 'precedent'; else if (focus.has(e.a)) rel = 'inspired'; }
  return { rel, color: cfg.get(`routing.${rel}.color`), dash: dashOf(rel), arrow: e.type === 'influence' || cfg.get(`routing.${rel}.arrow`) };
}

// ---------- covers: fetched one at a time, drawn when loaded ----------
const covers = new Map(); let coverBusy = false;
async function queueCovers() {
  if (coverBusy || !cfg.get('data.fetchCovers')) return; coverBusy = true;
  try {
    for (const w of W) {
      if (!shown(w.id) || covers.has(w.id)) continue;
      covers.set(w.id, { img: null });
      const url = await coverUrlFor(w, cfg); if (!url) continue;
      await new Promise((res) => { const img = new Image(); img.onload = () => { covers.set(w.id, { img }); draw(); if (selected.has(w.id)) showPanel(); res(); }; img.onerror = res; img.src = url; });
    }
  } finally { coverBusy = false; }
}
const coverOf = (id) => { const c = covers.get(id); return c && c.img && c.img.complete && c.img.naturalWidth ? c.img : null; };

// ---------- drawing ----------
function polyLen(pts) { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return l; }
function polyMid(pts) { let half = polyLen(pts) / 2; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); if (half <= d) { const t = half / d; return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t }; } half -= d; } return pts[0]; }
function tracePath(pts) { for (const c of roundedCommands(pts, cfg.get('routing.cornerRadius'))) { if (c.op === 'M') ctx.moveTo(c.x, c.y); else if (c.op === 'L') ctx.lineTo(c.x, c.y); else ctx.quadraticCurveTo(c.cx, c.cy, c.x, c.y); } }

let dirty = false;
function draw() { if (dirty) return; dirty = true; requestAnimationFrame(render); }
function render() {
  dirty = false; if (!L) return;
  const r = devicePixelRatio || 1;
  ctx.setTransform(r, 0, 0, r, 0, 0); ctx.fillStyle = cfg.get('ui.background'); ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.save(); ctx.translate(vw.x, vw.y); ctx.scale(vw.k, vw.k);
  const sp = cfg.get('layout.spacing'), tile = cfg.get('layout.tileSize');
  if (view === 'genre') drawTerritories();
  if (view === 'time') drawTimeFrame();
  if (cfg.get('layout.showHexDots')) {
    ctx.fillStyle = `rgba(140,155,175,${cfg.get('layout.hexDotOpacity')})`;
    const x0 = -vw.x / vw.k, y0 = -vw.y / vw.k, x1 = x0 + innerWidth / vw.k, y1 = y0 + innerHeight / vw.k;
    const a = L.lattice.toAxial(x0, y0), b = L.lattice.toAxial(x1, y1), qs = Math.abs(b.q - a.q) + Math.abs(b.r - a.r) + 4;
    for (let q = Math.min(a.q, b.q) - qs; q <= Math.max(a.q, b.q) + qs; q++) for (let rr = Math.min(a.r, b.r) - 2; rr <= Math.max(a.r, b.r) + 2; rr++) { const p = L.lattice.pointOf(q, rr); if (p.x < x0 - sp || p.x > x1 + sp || p.y < y0 - sp || p.y > y1 + sp) continue; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 7); ctx.fill(); }
  }
  const sl = spotlight({ hoverWork: hover.work, hoverEdge: hover.edge, selected, edges: E, cfg, allTypes: ALL_TYPES });
  const dim = cfg.get('spotlight.dimOpacity'), lit = (id) => !sl.active || sl.works.has(id);
  E.forEach((e, i) => {
    const isLit = !sl.active || sl.edges.has(e), st = edgeStyle(e);
    ctx.globalAlpha = isLit ? 1 : dim; ctx.strokeStyle = st.color; ctx.lineWidth = isLit && sl.active ? cfg.get('routing.widthSelected') : cfg.get('routing.width'); ctx.setLineDash(st.dash); ctx.lineCap = st.dash[0] < 2 ? 'round' : 'butt';
    ctx.beginPath(); tracePath(routes[i].points); ctx.stroke(); ctx.setLineDash([]);
    if (st.arrow) { const p = routes[i].points[routes[i].points.length - 1], d = endDirection(routes[i].points), s = cfg.get('routing.arrowSize'); ctx.fillStyle = st.color; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - d.x * s - d.y * s * 0.5, p.y - d.y * s + d.x * s * 0.5); ctx.lineTo(p.x - d.x * s + d.y * s * 0.5, p.y - d.y * s - d.x * s * 0.5); ctx.closePath(); ctx.fill(); }
  });
  ctx.globalAlpha = 1;
  if (view === 'genre') {
    for (const id of sil) drawSilhouette(id, tile);
    if (cfg.get('fog.enabled')) { const off = fogCanvas(); ctx.save(); ctx.setTransform(r, 0, 0, r, 0, 0); ctx.drawImage(off, 0, 0, innerWidth, innerHeight); ctx.restore(); }
  }
  const order = W.filter((w) => shown(w.id)).sort((a, b) => (selected.has(a.id) - selected.has(b.id)) || ((hover.work === a.id) - (hover.work === b.id)));
  for (const w of order) drawTile(w, tile, lit(w.id) ? 1 : dim);
  const focusEdges = hover.edge ? [hover.edge] : E.filter((e) => sl.edges.has(e) && (selected.has(e.a) || selected.has(e.b) || hover.work === e.a || hover.work === e.b));
  ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const e of (cfg.get('routing.labelsOnHoverOnly') ? focusEdges : [...sl.edges])) {
    const i = E.indexOf(e); if (i < 0) continue;
    const st = edgeStyle(e), m = polyMid(routes[i].points), label = st.rel === 'other' ? 'linked' : st.rel, wd = ctx.measureText(label).width + 16;
    ctx.fillStyle = '#0B0E12'; ctx.strokeStyle = st.color; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(m.x - wd / 2, m.y - 10, wd, 20, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = st.color; ctx.fillText(label, m.x, m.y + 1);
  }
  ctx.restore();
  drawMinimap(); hud();
}

function drawTerritories() {
  ctx.globalCompositeOperation = 'lighter';
  L.anchors.forEach((a, i) => { const h = cfg.get(`genres.${FAMILY_IDS[i]}.hue`), R = cfg.get('genres.territoryRadius'); const g = ctx.createRadialGradient(a.x * 1.08, a.y * 1.08, 0, a.x * 1.08, a.y * 1.08, R); g.addColorStop(0, hsl(h, cfg.get('genres.saturation'), 40, cfg.get('genres.territoryOpacity') * 0.6)); g.addColorStop(1, hsl(h, cfg.get('genres.saturation'), 40, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(a.x * 1.08, a.y * 1.08, R, 0, 7); ctx.fill(); });
  ctx.globalCompositeOperation = 'source-over';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  L.anchors.forEach((a, i) => {
    const id = FAMILY_IDS[i], h = cfg.get(`genres.${id}.hue`), ws = W.filter((w) => w.heard && (w.fam[i] || 0) >= 0.5);
    const d = territoryDays(ws.map((w) => w.daysAgo), cfg), x = a.x * 1.38, y = a.y * 1.38;
    const rec = ws.length ? `visited ${d < 1 ? 'today' : d < 14 ? Math.round(d) + ' days ago' : d < 60 ? Math.round(d / 7) + ' weeks ago' : Math.round(d / 30) + ' months ago'}` : 'unexplored';
    ctx.font = '12px ui-monospace, monospace'; ctx.fillStyle = hsl(h, 70, 72); ctx.fillText(cfg.get(`genres.${id}.name`).toUpperCase(), x, y);
    ctx.font = '10.5px ui-monospace, monospace'; ctx.fillStyle = cfg.get('ui.mutedText'); ctx.fillText(rec, x, y + 15);
    ctx.fillStyle = '#222A33'; ctx.fillRect(x - 35, y + 22, 70, 3); if (ws.length) { ctx.fillStyle = hsl(h, 70, 62); ctx.fillRect(x - 35, y + 22, 70 * ringFraction(d, cfg), 3); }
  });
}

function drawTimeFrame() {
  const xs = Object.values(L.pos).map((p) => p.x), x0 = Math.min(...xs) - 160, x1 = Math.max(...xs) + 160, lanes = L.lanes || [];
  ctx.textBaseline = 'middle'; ctx.font = '12px ui-monospace, monospace';
  for (const ln of lanes) { const h = cfg.get(`genres.${ln.fam}.hue`); ctx.strokeStyle = hsl(h, 50, 45, 0.25); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, ln.y); ctx.lineTo(x1, ln.y); ctx.stroke(); ctx.fillStyle = hsl(h, 70, 72); ctx.textAlign = 'left'; ctx.fillText(cfg.get(`genres.${ln.fam}.name`).toUpperCase(), x0, ln.y - 20); }
  if (cfg.get('views.showDecades') && lanes.length) {
    const top = lanes[0].y - cfg.get('views.laneHeight') / 2, bot = lanes[lanes.length - 1].y + cfg.get('views.laneHeight') / 2;
    for (const d of L.decades || []) { ctx.strokeStyle = 'rgba(140,155,175,.18)'; ctx.beginPath(); ctx.moveTo(d.x, top); ctx.lineTo(d.x, bot); ctx.stroke(); ctx.fillStyle = cfg.get('ui.mutedText'); ctx.textAlign = 'center'; ctx.fillText(d.year + 's', d.x, top - 10); }
  }
}

function drawSilhouette(id, tile) {
  const p = genreL.pos[id]; if (!p) return; const x = p.x - tile / 2, y = p.y - tile / 2;
  ctx.fillStyle = '#1A2129'; ctx.strokeStyle = '#2B3644'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x, y, tile, tile, 9); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#46525F'; ctx.font = `500 ${tile * 0.36}px ui-monospace, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', p.x, p.y + 1);
}

let fogC = null;
function fogCanvas() {
  const c = fogC || (fogC = document.createElement('canvas')); c.width = innerWidth; c.height = innerHeight; const g = c.getContext('2d');
  g.fillStyle = cfg.get('fog.color'); g.globalAlpha = cfg.get('fog.opacity'); g.fillRect(0, 0, c.width, c.height); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out';
  g.filter = `blur(${cfg.get('fog.softness') * vw.k / 2}px)`;
  const sp = cfg.get('layout.spacing');
  for (const rv of vis.reveals) { const p = rv.hex ? genreL.lattice.pointOf(rv.hex.q, rv.hex.r) : genreL.pos[rv.id]; if (!p) continue; g.beginPath(); g.arc(p.x * vw.k + vw.x, p.y * vw.k + vw.y, (rv.steps + 0.6) * sp * vw.k, 0, 7); g.fill(); }
  g.beginPath(); g.arc(vw.x, vw.y, cfg.get('layout.hubRadius') * 1.4 * vw.k, 0, 7); g.fill();
  return c;
}

function drawTile(w, tile, alpha) {
  const p = L.pos[w.id], sel = selected.has(w.id), s = tile * (sel ? cfg.get('layout.selectedScale') : 1), x = p.x - s / 2, y = p.y - s / 2, h = hueOf(w);
  const rw = cfg.get('tiers.ringWidth'), gap = cfg.get('tiers.ringGap'), rc = tierColor(w.tier, cfg);
  ctx.globalAlpha = alpha;
  ctx.lineWidth = rw; ctx.strokeStyle = rc; ctx.beginPath(); ctx.roundRect(x - gap - rw / 2, y - gap - rw / 2, s + 2 * gap + rw, s + 2 * gap + rw, 9); ctx.stroke();
  ctx.globalAlpha = alpha * (w.heard ? cfg.get('ui.seenDim') : cfg.get('ui.unheardBrightness'));
  const img = coverOf(w.id);
  if (img) { ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, s, s, 6); ctx.clip(); ctx.drawImage(img, x, y, s, s); ctx.restore(); }
  else { ctx.fillStyle = hsl(h, 42, 31); ctx.beginPath(); ctx.roundRect(x, y, s, s, 6); ctx.fill(); ctx.fillStyle = hsl(h, 70, 88); ctx.font = `500 ${s * 0.3}px ui-monospace, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(w.title.replace(/^[^A-Za-z0-9]+/, '').slice(0, 2).toUpperCase(), p.x, p.y); }
  ctx.globalAlpha = alpha;
  if (w.heard) { const f = ringFraction(w.daysAgo, cfg); ctx.strokeStyle = '#2B3644'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + s - 8, y + s - 8, 6, 0, 7); ctx.stroke(); ctx.strokeStyle = '#9FE8FF'; ctx.beginPath(); ctx.arc(x + s - 8, y + s - 8, 6, -Math.PI / 2, -Math.PI / 2 + f * 2 * Math.PI); ctx.stroke(); }
  let bx = x + 3; const bs = cfg.get('badges.size');
  for (const b of w.badges || []) { if (!cfg.get(`badges.${b}.enabled`)) continue; ctx.save(); ctx.translate(bx, y + 3); ctx.scale(bs / 24, bs / 24); ctx.strokeStyle = cfg.get('badges.matchRingColor') ? rc : '#E8E4DA'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.stroke(new Path2D(BADGES[b].d)); ctx.restore(); bx += bs + 2; }
  const dz = game.state.dowse; if (dz && dz.id === w.id) { ctx.strokeStyle = '#F2B84B'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(p.x, p.y, s * 0.95, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  if (cfg.get('ui.playOnHover') && hover.work === w.id) { ctx.fillStyle = 'rgba(11,14,18,.55)'; ctx.beginPath(); ctx.roundRect(x, y, s, s, 6); ctx.fill(); ctx.fillStyle = '#EDE9DF'; ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, 7); ctx.fill(); ctx.fillStyle = '#0B0E12'; ctx.beginPath(); ctx.moveTo(p.x - 4, p.y - 7); ctx.lineTo(p.x + 8, p.y); ctx.lineTo(p.x - 4, p.y + 7); ctx.closePath(); ctx.fill(); }
  const md = cfg.get('ui.labelMode'), litNow = alpha >= 1;
  if (vw.k >= cfg.get('ui.labelZoom') && (md === 'all' || (md === 'heard-and-lit' && (w.heard || litNow && (selected.size || hover.work))) || (md === 'lit' && litNow && (selected.size || hover.work)) || sel || hover.work === w.id)) { ctx.fillStyle = cfg.get('ui.text'); ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(w.title.length > 22 ? w.title.slice(0, 21) + '…' : w.title, p.x, y + s + 8); }
  ctx.globalAlpha = 1;
}

const mini = $('mini'), mctx = mini.getContext('2d'); let miniMap = null;
function drawMinimap() {
  const S = cfg.get('ui.minimapSize'), r = devicePixelRatio || 1; mini.style.width = mini.style.height = S + 'px'; mini.width = mini.height = S * r; mctx.setTransform(r, 0, 0, r, 0, 0); mctx.clearRect(0, 0, S, S);
  const ids = W.filter((w) => shown(w.id)).map((w) => w.id); if (!ids.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const id of ids) { const p = L.pos[id]; x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  const pad = 80, k = (S - 8) / Math.max(x1 - x0 + pad * 2, y1 - y0 + pad * 2), ox = (S - (x1 - x0) * k) / 2 - x0 * k, oy = (S - (y1 - y0) * k) / 2 - y0 * k; miniMap = { k, ox, oy };
  for (const id of ids) { const w = byId[id], p = L.pos[id]; mctx.fillStyle = hsl(hueOf(w), 60, 62); mctx.strokeStyle = mctx.fillStyle; if (w.heard) { mctx.beginPath(); mctx.arc(p.x * k + ox, p.y * k + oy, 3, 0, 7); mctx.fill(); } else { mctx.lineWidth = 1.5; mctx.beginPath(); mctx.arc(p.x * k + ox, p.y * k + oy, 2.5, 0, 7); mctx.stroke(); } }
  const a = toWorld(0, 0), b = toWorld(innerWidth, innerHeight); mctx.strokeStyle = '#fff'; mctx.lineWidth = 1; mctx.strokeRect(a.x * k + ox, a.y * k + oy, (b.x - a.x) * k, (b.y - a.y) * k);
}
mini.addEventListener('pointerdown', (e) => { if (!miniMap) return; const r = mini.getBoundingClientRect(), wx = (e.clientX - r.left - miniMap.ox) / miniMap.k, wy = (e.clientY - r.top - miniMap.oy) / miniMap.k; vw.x = innerWidth / 2 - wx * vw.k; vw.y = innerHeight / 2 - wy * vw.k; draw(); });

function hud() { $('hud').textContent = `${[...vis.visible].filter((id) => !hiddenIn().has(id)).length}/${W.length} visible · zoom ${vw.k.toFixed(2)} · selected ${selected.size}${view !== 'genre' && hiddenIn().size ? ` · ${hiddenIn().size} not placeable here` : ''}`; }

// ---------- map interaction ----------
function pick(sx, sy) {
  const p = toWorld(sx, sy), tile = cfg.get('layout.tileSize');
  for (const w of W) { if (!shown(w.id)) continue; const q = L.pos[w.id]; if (Math.abs(p.x - q.x) <= tile / 2 + 6 && Math.abs(p.y - q.y) <= tile / 2 + 6) return { work: w.id, play: Math.hypot(p.x - q.x, p.y - q.y) < 15 }; }
  let best = null;
  E.forEach((e, i) => { const pts = routes[i].points; for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], b = pts[k], dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1))), d = Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y); if (d < 8 / vw.k && (!best || d < best.d)) best = { d, edge: e }; } });
  return best ? { edge: best.edge } : {};
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, vx: vw.x, vy: vw.y, moved: false }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true; if (drag.moved) { vw.x = drag.vx + dx; vw.y = drag.vy + dy; draw(); return; } }
  const h = pick(e.clientX, e.clientY); if (h.work !== hover.work || h.edge !== hover.edge) { hover = { work: h.work || null, edge: h.edge || null }; canvas.style.cursor = mode ? 'crosshair' : h.work || h.edge ? 'pointer' : 'default'; draw(); }
});
canvas.addEventListener('pointerup', (e) => {
  const moved = drag?.moved; drag = null; if (moved) return;
  if (mode === 'flare') { const w = toWorld(e.clientX, e.clientY), hex = genreL.lattice.toAxial(w.x, w.y); const r = game.useFlare(hex); setMode(null); if (r.ok) { toast('Flare lit. The fog lifts around it.'); afterChange(false); } else toast(r.reason); return; }
  const h = pick(e.clientX, e.clientY), multi = e[cfg.get('spotlight.multiSelectKey') + 'Key'];
  if (h.work) {
    if (!multi) { const was = selected.has(h.work) && selected.size === 1; selected.clear(); if (!was) selected.add(h.work); } else selected.has(h.work) ? selected.delete(h.work) : selected.add(h.work);
    if (cfg.get('recency.countOpenAsEngaged') && selected.has(h.work)) game.touch(h.work);
    showPanel(); draw(); if (h.play && selected.has(h.work)) playPreview(h.work);
  } else if (!multi) { selected.clear(); showPanel(); draw(); }
});
canvas.addEventListener('wheel', (e) => { e.preventDefault(); const k0 = vw.k, k1 = Math.min(cfg.get('ui.zoomMax'), Math.max(cfg.get('ui.zoomMin'), k0 * Math.exp(-e.deltaY * 0.0012))); vw.x = e.clientX - (e.clientX - vw.x) * k1 / k0; vw.y = e.clientY - (e.clientY - vw.y) * k1 / k0; vw.k = k1; draw(); }, { passive: false });
addEventListener('resize', resize);

// ---------- notices ----------
function toast(msg, big = false) { const t = document.createElement('div'); t.className = 'toast' + (big ? ' big' : ''); t.textContent = msg; $('toasts').appendChild(t); setTimeout(() => t.remove(), cfg.get('ui.toastMs')); }
function announce(res) {
  if (!res.ok) return toast(res.reason || 'Could not do that.');
  if (res.note) return toast(res.note);
  toast(`+${res.xp} XP${res.predicted != null ? ` · the map expected ${res.predicted.toFixed(1)}` : ''}${res.firstInFamily ? ' · new territory' : ''}`, true);
  if (res.thread) toast(`Thread: ${res.thread.label}, chain of ${res.thread.links}`);
  for (const ev of res.events) {
    if (ev.type === 'levelUp') toast(`Level ${ev.level}`, true);
    else if (ev.type === 'chronicleStep') toast(`${ev.title}: ${ev.have} of ${ev.total}`);
    else if (ev.type === 'chronicleDone') toast(`Chronicle finished: ${ev.title}. +${ev.xp} XP, +${ev.points} pts, +${ev.lens} lens charges`, true);
    else if (ev.type === 'questDone') toast(`Quest done: ${ev.title}. +${ev.xp} XP, +${ev.points} pts`, true);
    else if (ev.type === 'foundationsDone') toast(`Foundations finished: ${cfg.get(`genres.${ev.id}.name`)}. +${ev.xp} XP`, true);
  }
}

// ---------- chrome: shelf, threads, level box, tabs, legend, tools, minimap text ----------
function refreshChrome() {
  $('shelf').innerHTML = shelfHTML(W, cfg, [...selected].pop(), game.pendingWorks());
  const th = game.threads();
  $('threads').innerHTML = `<b class="mono lab">THREADS</b>${th.map((t) => `<button class="thread${t.active ? ' active' : ''}" data-act="threadGo" data-id="${esc(t.ids[t.ids.length - 1])}" title="${esc(t.kind)}">${esc(t.label)} · ${t.active ? `chain of ${t.links}` : `paused at ${t.links}`}</button>`).join('')}<button class="thread" style="border-style:dashed" data-act="startThread" data-id="${esc([...selected].pop() || '')}">+ start a thread</button><span class="sp"></span><span class="muted small">Jumping around never resets a thread</span>`;
  const lv = game.level();
  $('lvl').innerHTML = `<div class="top"><b>${esc(lv.title)} · Lv ${lv.level}</b><span class="mono amber-t">${game.state.points.toLocaleString()} pts</span></div><div class="track" style="margin-top:5px"><div style="width:${Math.round(lv.frac * 100)}%"></div></div>`;
  $('tabs').innerHTML = [['genre', 'Genre'], ['time', 'Time'], ['credits', 'Credits'], ['place', 'Place']].map(([v, n]) => `<button data-act="view" data-id="${v}" class="${v === view ? 'on' : ''}${game.viewOpen(v) ? '' : ' locked'}">${n}${game.viewOpen(v) ? '' : ' 🔒'}</button>`).join('');
  const ch = game.state.charges, any = ch.flare || ch.dowse || ch.roll;
  $('tools').style.display = any || mode ? 'flex' : 'none';
  $('tools').innerHTML = `${ch.flare ? `<button data-act="toolFlare">${mode === 'flare' ? 'Click the map…' : `Flare ×${ch.flare}`}</button>` : ''}${ch.dowse ? `<button data-act="toolDowse">Dowse ×${ch.dowse}</button>` : ''}${ch.roll ? `<button data-act="toolRoll">Rarity roll ×${ch.roll}</button>` : ''}`;
  const seen = vis.visible.size, scouted = W.filter((w) => !w.heard && vis.visible.has(w.id)).length;
  const unexplored = FAMILY_IDS.filter((f) => !W.some((w) => w.heard && (w.fam[FAMILY_IDS.indexOf(f)] || 0) >= 0.5));
  $('minitext').innerHTML = `<span style="color:var(--text)">${seen} revealed</span><br>${scouted} scouted, unheard<br>${W.length - seen} still in fog<br>${unexplored.length ? `<span class="amber-t">${esc(cfg.get(`genres.${unexplored[0]}.name`))}: never visited</span>` : 'every family visited'}`;
}
function buildLegend() {
  const el = $('legend'); el.innerHTML = '<h3>CHAINS FOLLOW</h3>';
  for (const t of ['precedent', 'inspired', 'contemporary', 'personnel', 'sample']) {
    const lab = document.createElement('label'); lab.innerHTML = `<input type="checkbox" ${cfg.get('spotlight.follow.' + t) ? 'checked' : ''}><span class="sw" style="border-color:${cfg.get(`routing.${t}.color`)}"></span>${t}`;
    lab.querySelector('input').addEventListener('change', (e) => { cfg.set('spotlight.follow.' + t, e.target.checked); draw(); }); el.appendChild(lab);
  }
  const h = document.createElement('h3'); h.textContent = 'RARITY RINGS'; h.style.marginTop = '8px'; el.appendChild(h);
  const row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px 10px;font-size:11px;color:var(--muted)';
  row.innerHTML = TIER_IDS.map((t) => `<span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;border:3px solid ${cfg.get(`tiers.${t}.color`)}"></span>${esc(cfg.get(`tiers.${t}.name`))}</span>`).join(''); el.appendChild(row);
  const n = document.createElement('div'); n.style.cssText = 'font-size:11px;color:var(--muted);margin-top:6px;line-height:15px'; n.textContent = 'Dim art = heard. Bright art = not heard yet. Gauge in the corner = how recently you engaged. Hue is genre; where two meet you see the blend. Dark areas are fog you have not explored. "?" tiles hint at something just past the edge.'; el.appendChild(n);
}
function setMode(m) { mode = m; canvas.style.cursor = m ? 'crosshair' : 'default'; if (vis) refreshChrome(); }

// ---------- info panel ----------
let audio = null;
const selectedId = () => [...selected].pop();
function showPanel() {
  const panel = $('panel'), id = selectedId(); refreshChrome();
  if (!id) { panel.style.display = 'none'; return; }
  const w = byId[id]; panel.style.display = 'block';
  const growCounts = {}; for (const k of ['precedent', 'inspired', 'contemporary', 'sample', 'personnel']) growCounts[k] = game.growCandidates(id, k).filter((x) => !x.heard && !vis.visible.has(x.id)).length;
  const src = coverOf(id);
  $('panelbody').innerHTML = panelHTML({
    work: w, tierName: cfg.get(`tiers.${TIER_IDS[w.tier]}.name`),
    famNames: Object.entries(w.fam).filter(([, wt]) => wt >= 0.3).map(([i]) => cfg.get(`genres.${FAMILY_IDS[i]}.name`)),
    subNames: (w.subs || []).map((s) => SUBGENRES.find((x) => x.id === s)?.name).filter(Boolean),
    predicted: game.predicted(id), credits: game.credits(id), growCounts, charges: game.state.charges, cover: src ? src.src : null,
    slots: game.slots(), placed: game.state.placed.includes(id), dowse: !!(game.state.dowse && game.state.dowse.id === id),
    prov: game.provenance(id), canArtist: !!game.state.facts[id]?.artistMbids?.length
  }, cfg) + '<div class="hr"></div><span class="mono lab">ABOUT</span><p id="bio" class="muted small">Loading…</p><span class="mono lab">ON MUSICBRAINZ</span><p id="mb" class="muted small">Loading…</p>';
  $('ratingfill').style.height = (w.heard ? fractionFromValue(w.rating, cfg) * 100 : 0) + '%';
  fetchBio(w.title, w.artist, cfg).then((b) => { if ($('bio') && selectedId() === id) $('bio').innerHTML = b ? `${esc(b.text)} <a href="${esc(b.url)}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(b.source)}</a>` : 'No bio found.'; });
  lookupReleaseGroup(w, cfg).then((r) => { if ($('mb') && selectedId() === id) $('mb').textContent = r ? `${r.genres.concat(r.tags).slice(0, 8).join(', ') || 'no tags'}; ${r.relations.length} relationships` : 'Not found on MusicBrainz.'; });
}
async function playPreview(id) {
  const w = byId[id]; const p = await fetchPreview(w.title, w.artist, cfg);
  if (!p) return toast('No preview found (Deezer needs a CORS proxy; try iTunes in settings).');
  audio?.pause(); audio = new Audio(p.url); audio.play();
  if (cfg.get('recency.countPlayAsEngaged')) { game.touch(id); draw(); }
}
(() => {
  const bar = $('ratingbar'), tip = $('ratingtip'), hv = $('ratinghover');
  const frac = (e) => { const r = bar.getBoundingClientRect(); return 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)); };
  bar.addEventListener('mousemove', (e) => { const f = frac(e), r = ratingFromFraction(f, cfg); tip.style.display = 'block'; tip.style.left = e.clientX + 18 + 'px'; tip.style.top = e.clientY - 14 + 'px'; tip.textContent = r.label + (cfg.get('rating.showNumeric') ? ` (${r.value})` : ''); hv.style.display = 'block'; hv.style.bottom = f * 100 + '%'; });
  bar.addEventListener('mouseleave', () => { tip.style.display = 'none'; hv.style.display = 'none'; });
  bar.addEventListener('click', (e) => { const id = selectedId(); if (!id) return; const r = ratingFromFraction(frac(e), cfg); announce(game.rate(id, r.value)); afterChange(false); });
})();

// Everything that changes state ends here: save, recompute, redraw panels.
function afterChange(relayout) { save(); recompute(relayout); showPanel(); if (modalName) openModal(modalName); }

// ---------- modals ----------
let modalName = null;
function openModal(name) {
  modalName = name; $('modal').style.display = 'flex'; $('modaltitle').textContent = { progress: 'Progress', quests: 'Quests', shop: 'Shop', sync: 'Sync' }[name];
  document.addEventListener('change', (e) => { const t = e.target; if (t?.dataset?.provider) { setAccountField(accounts, t.dataset.provider, t.dataset.field, t.value); saveAccounts(store, accounts); } });
document.querySelectorAll('#modal [data-modal]').forEach((b) => b.classList.toggle('on', b.dataset.modal === name));
  const body = $('modalbody');
  if (name === 'progress') body.innerHTML = progressHTML({ level: game.level(), rested: game.state.rested, points: game.state.points, xp: game.state.xp, stats: game.state.stats, longest: game.state.longestChain, reveal: game.reveal(vis.visible), taste: game.taste(), ms: vis.ms, charters: game.state.charters }, cfg) + '<div class="pad"><button data-act="exportSave">Export save</button> <button data-act="importSave">Import save</button> <button data-act="resetProgress">Reset progress</button></div>';
  if (name === 'quests') body.innerHTML = questsHTML(game.board(), cfg);
  if (name === 'shop') body.innerHTML = shopHTML(game.shopItems(), game.state.points);
  if (name === 'sync') {
    const queue = enrichmentQueue(game.state, [...game.works(), ...game.pendingWorks()], cfg, syncUi.scope);
    body.innerHTML = syncHTML({ summary: game.syncSummary(), providers: PROVIDERS, accounts, ui: syncUi, estimate: engine.estimate(queue), queue, policy: cfg.get('sync.unverifiedSeed'), scope: syncUi.scope }, cfg);
  }
}
const closeModal = () => { modalName = null; $('modal').style.display = 'none'; };

// ---------- add a work ----------
let addResults = [], addPicked = null;
function openAdd() {
  const d = $('adddlg'); d.style.display = 'flex';
  const rs = [], step = cfg.get('rating.subStep');
  for (let n = cfg.get('rating.max'); n >= cfg.get('rating.min'); n--) for (const [lab, off] of [['strong', step], ['decent', 0], ['light', -step]]) rs.push(`<option value="${n + off}" ${n === 8 && lab === 'decent' ? 'selected' : ''}>${lab} ${n}</option>`);
  d.innerHTML = `<b style="font-size:16px">Add something I've heard</b>
<div style="display:flex;gap:8px"><input type="text" id="addq" placeholder="Album and artist, e.g. Madvillainy Madvillain"><button data-act="addSearch">Search</button></div>
<div id="addres" class="muted small">Search MusicBrainz, or fill the fields below by hand.</div>
<div style="display:grid;grid-template-columns:1fr 1fr 90px;gap:8px"><input type="text" id="addtitle" placeholder="Title"><input type="text" id="addartist" placeholder="Artist"><input type="number" id="addyear" placeholder="Year"></div>
<div><span class="mono lab">GENRE FAMILIES</span><div class="chips" id="addfams">${familyPickHTML(cfg)}</div></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label>Rarity<select id="addtier">${TIER_IDS.map((t, i) => `<option value="${i}" ${i === cfg.get('data.defaultTier') ? 'selected' : ''}>${esc(cfg.get(`tiers.${t}.name`))}</option>`).join('')}</select></label>
<label>Your rating<select id="addrating">${rs.join('')}</select></label></div>
<label><input type="checkbox" id="addheard" checked> I have heard it (earns XP). Untick to just put it on the map.</label>
<div style="display:flex;gap:8px;justify-content:flex-end"><button data-act="addCancel">Cancel</button><button data-act="addConfirm" style="background:var(--text);color:var(--bg)">Add to map</button></div>`;
  addResults = []; addPicked = null;
}
async function addSearch() {
  const q = $('addq').value.trim(); if (!q) return; $('addres').textContent = 'Searching…';
  addResults = await searchReleaseGroups(q, cfg); $('addres').innerHTML = addResultsHTML(addResults, cfg);
}
async function addPick(i) {
  const r = addResults[i]; if (!r) return; addPicked = r;
  $('addtitle').value = r.title; $('addartist').value = r.artist; $('addyear').value = r.year || '';
  const fam = familiesFromTags(r.tags, cfg); document.querySelectorAll('#addfams input').forEach((c) => { c.checked = !!(fam && fam[c.dataset.fam]); });
  try { const pop = await engine.popularity([r.mbid]); const n = pop[r.mbid]?.listeners; if (n != null) $('addtier').value = String(tierFromListeners(n, cfg)); } catch { /* keep the default tier */ }
}
function openFamilyPick(id) {
  const w = game.pendingWorks().find((x) => x.id === id); if (!w) return;
  const d = $('adddlg'); d.style.display = 'flex';
  d.innerHTML = `<b style="font-size:16px">Which genre family is "${esc(w.title)}"?</b><div class="muted small">${esc(w.artist)}. Nothing in the data said, and Strata will not guess. Verifying may fill this in on its own.</div><div class="chips" id="addfams">${familyPickHTML(cfg)}</div><div style="display:flex;gap:8px;justify-content:flex-end"><button data-act="addCancel">Cancel</button><button data-act="pendingSave" data-id="${esc(id)}" style="background:var(--text);color:var(--bg)">Save</button></div>`;
}
async function discography(id) {
  toast('Fetching the discography from MusicBrainz…');
  const r = await engine.discography(id); if (!r.ok) return toast(r.reason);
  const d = $('adddlg'); d.style.display = 'flex'; discoRecords = r.records;
  d.innerHTML = `<b style="font-size:16px">${r.records.length} more albums and EPs by this artist</b><div class="muted small">From MusicBrainz, not in your library yet (${r.total} found, live albums and compilations left out). They go on the map as unheard.</div><div class="shelflist" style="max-height:300px">${r.records.map((x) => `<div class="small pad">${esc(x.title)} <span class="muted">· ${x.year || '?'}</span></div>`).join('') || '<div class="muted pad">Nothing new.</div>'}</div><div style="display:flex;gap:8px;justify-content:flex-end"><button data-act="addCancel">Close</button><button data-act="discoAdd" ${r.records.length ? '' : 'disabled'} style="background:var(--text);color:var(--bg)">Add all to the map</button></div>`;
}
let discoRecords = [];
const sumTxt = (r) => r.ok ? `Imported ${r.fetched}: ${r.added} new, ${r.matched} already in your library${r.unclassified ? `, ${r.unclassified} need a genre family` : ''}${r.capped ? `. Stopped at the ${r.capped} work limit.` : ''}.${r.note ? ' ' + r.note : ''}` : r.message;
async function runSync(kind, id) {
  if (syncUi.busy) return; syncUi.busy = kind === 'verify' ? 'verify' : id; syncUi.progress = null; syncUi.messages[kind === 'verify' ? 'verify' : id] = null; openModal('sync');
  try {
    if (kind === 'test') syncUi.messages[id] = await engine.testAccount(id);
    else if (kind === 'import') { const r = await engine.importFrom(id); syncUi.messages[id] = { ok: r.ok, message: sumTxt(r) }; }
    else if (kind === 'collections') { const c = await engine.listCollections(); syncUi.messages[id] = { ok: true, message: c.length ? c.map((x) => `${x.name} (${x.type}) id ${x.id}`).join('  |  ') : 'No collections found.' }; }
    else if (kind === 'verify') { const r = await engine.verify({ scope: syncUi.scope }); syncUi.messages.verify = { ok: r.ok && !r.stopped, message: r.stopped ? `Stopped. ${r.done} of ${r.total} done; the rest will carry on next time.` : r.ok ? `Checked ${r.total} work${r.total === 1 ? '' : 's'}${r.failed ? `, ${r.failed} had problems (listed below)` : ''}.${r.phases?.popularityError ? ' Popularity: ' + r.phases.popularityError : ''}${r.phases?.wikidataError ? ' Wikidata: ' + r.phases.wikidataError : ''}${r.phases?.similarError ? ' Last.fm: ' + r.phases.similarError : ''}` : r.message }; }
  } catch (e) { syncUi.messages[kind === 'verify' ? 'verify' : id] = { ok: false, message: e.message }; }
  syncUi.busy = null; syncUi.progress = null; afterChange(true);
}
function addConfirm() {
  const picked = [...document.querySelectorAll('#addfams input')].filter((c) => c.checked).map((c) => Number(c.dataset.fam));
  const fam = {}; picked.forEach((i) => { fam[i] = Math.round(100 / picked.length) / 100; });
  const res = game.addWork({ title: $('addtitle').value.trim(), artist: $('addartist').value.trim(), year: Number($('addyear').value) || new Date().getFullYear(), fam: picked.length ? fam : null, tags: addPicked?.tags, tier: Number($('addtier').value), mbid: addPicked?.mbid, heard: $('addheard').checked, rating: Number($('addrating').value) });
  if (!res.ok) { if (res.id) { $('adddlg').style.display = 'none'; selected = new Set([res.id]); afterChange(true); centerOn(res.id); } return toast(res.reason); }
  $('adddlg').style.display = 'none'; selected = new Set([res.id]); if (res.rate) announce(res.rate); toast(`Added with ${res.links} connection${res.links === 1 ? '' : 's'}.`);
  afterChange(true); centerOn(res.id);
}

// ---------- search ----------
function runSearch() {
  const q = $('search').value.trim().toLowerCase(), box = $('results'); if (!q) { box.style.display = 'none'; return; }
  const lens = game.state.unlocks.creditsLens;
  const hits = W.filter((w) => shown(w.id)).filter((w) => [w.title, w.artist, ...Object.keys(w.fam).map((i) => cfg.get(`genres.${FAMILY_IDS[i]}.name`)), ...(w.subs || []).map((s) => SUBGENRES.find((x) => x.id === s)?.name || ''), ...(lens ? creditNames(w) : [])].some((s) => s.toLowerCase().includes(q))).slice(0, cfg.get('ui.searchMax'));
  box.innerHTML = hits.length ? hits.map((w) => `<button class="shelfrow" data-act="searchPick" data-id="${esc(w.id)}"><span class="grow"><b>${esc(w.title)}</b><span class="muted">${esc(w.artist)} · ${w.year}</span></span></button>`).join('') : '<div class="muted pad">Nothing revealed matches. It may be in the fog.</div>';
  box.style.display = 'block';
}
$('search').addEventListener('input', runSearch);
$('search').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('results').querySelector('[data-act=searchPick]')?.click(); if (e.key === 'Escape') { $('results').style.display = 'none'; $('search').blur(); } });

// ---------- one click handler for every data-act ----------
function setView(v) {
  if (!game.viewOpen(v)) { toast(`Locked. ${{ time: 'The Era Lens', credits: 'The Personnel graph', place: 'The Place overlay' }[v]} opens this view.`); return openModal('shop'); }
  view = v; L = null; closeModal(); recompute(true); fitView();
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (!t) { if (!e.target.closest('#searchwrap')) $('results').style.display = 'none'; return; }
  const a = t.dataset.act, id = t.dataset.id;
  const sel = (i) => { selected = new Set([i]); if (cfg.get('recency.countOpenAsEngaged')) game.touch(i); showPanel(); centerOn(i); };
  switch (a) {
    case 'select': case 'threadGo': case 'searchPick': if (id) { if (!shown(id)) { toast('That work is not on this view.'); break; } $('results').style.display = 'none'; sel(id); } break;
    case 'view': setView(id); break;
    case 'play': playPreview(selectedId()); break;
    case 'grow': { const r = game.grow(id, t.dataset.kind); toast(r.ok ? `${r.added.length} new on the map${r.added.length < r.shown.length ? ` (${r.shown.length - r.added.length} already there)` : ''}` : r.reason); afterChange(false); break; }
    case 'creditGrow': { const r = game.grow(id, 'credit', t.dataset.name); toast(r.ok ? `Following ${t.dataset.name}: ${r.added.length} new` : r.reason); afterChange(false); break; }
    case 'creditReveal': { const r = game.revealCredit(id, t.dataset.kind); if (!r.ok) toast(r.reason); afterChange(false); break; }
    case 'startThread': if (id) { game.startThread(id); toast('Thread started. Rate a connected work to extend it.'); afterChange(false); } else toast('Select a work first.'); break;
    case 'place': case 'unplace': { const r = game[a](id); if (!r.ok) toast(r.reason); afterChange(false); break; }
    case 'addOpen': openAdd(); break;
    case 'addCancel': $('adddlg').style.display = 'none'; break;
    case 'addSearch': addSearch(); break;
    case 'addPick': addPick(Number(t.dataset.i)); break;
    case 'addConfirm': addConfirm(); break;
    case 'openShop': openModal('shop'); break;
    case 'syncTest': runSync('test', id); break;
    case 'syncImport': runSync('import', id); break;
    case 'syncCollections': runSync('collections', 'musicbrainz'); break;
    case 'syncVerify': runSync('verify'); break;
    case 'syncStop': engine.cancel(); break;
    case 'scopeSet': syncUi.scope = id; openModal('sync'); break;
    case 'togglePolicy': cfg.set('sync.unverifiedSeed', cfg.get('sync.unverifiedSeed') === 'hide' ? 'show' : 'hide'); selected.clear(); afterChange(true); break;
    case 'verifyOne': { const w = byId[id] || game.pendingWorks().find((x) => x.id === id); toast('Verifying…'); const hasId = game.state.facts[id]?.mbid || w?.mbid; engine.verifyWork({ id, steps: [hasId ? 'rg' : 'match', 'credits', 'artist'] }).then(() => engine.globalPhases()).then(() => { game.afterSync(); afterChange(true); toast('Done.'); }).catch((e) => { toast(e.message); }); break; }
    case 'discography': discography(id); break;
    case 'discoAdd': { const r = game.importRecords(discoRecords, 'musicbrainz', { asHeard: false }); $('adddlg').style.display = 'none'; toast(`${r.added.length} added to the map as unheard.`); afterChange(true); break; }
    case 'pendingPick': openFamilyPick(id); break;
    case 'pendingSave': { const picked = [...document.querySelectorAll('#addfams input')].filter((c) => c.checked).map((c) => Number(c.dataset.fam)); const fam = {}; picked.forEach((i) => { fam[i] = Math.round(100 / picked.length) / 100; }); const r = game.setFamilies(id, picked.length ? fam : null); if (!r.ok) toast(r.reason); else { $('adddlg').style.display = 'none'; afterChange(true); } break; }
    case 'beginChronicle': { const r = game.beginChronicle(id); toast(r.ok ? 'Chronicle begun. Its works are on the map.' : r.reason); afterChange(true); break; }
    case 'buy': { const r = game.buy(id); toast(r.ok ? `Bought ${r.item.name}` : r.reason); afterChange(true); break; }
    case 'toolFlare': if (view !== 'genre') toast('Flares work in the genre view.'); else setMode(mode === 'flare' ? null : 'flare'); break;
    case 'toolDowse': {
      const c = toWorld(innerWidth / 2, innerHeight / 2), origin = selectedId() ? genreL.hex[selectedId()] : genreL.lattice.toAxial(c.x, c.y);
      const r = game.useDowse(origin, genreL.hex, genreL.lattice); toast(r.ok ? `A rod points to ${byId[r.id].title}, expected ${r.predicted.toFixed(1)}.` : r.reason, r.ok);
      afterChange(false); if (r.ok && L.pos[r.id]) centerOn(r.id); break;
    }
    case 'toolRoll': { const r = game.useRoll(); toast(r.ok ? 'The roll revealed a rarer work.' : r.reason, r.ok); afterChange(false); if (r.ok && L.pos[r.id]) centerOn(r.id); break; }
    case 'exportSave': { const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([exportState(game.state)], { type: 'application/json' })); el.download = 'strata-save.json'; el.click(); break; }
    case 'importSave': { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = async () => { try { game.replaceState(importState(await i.files[0].text(), freshState(WORKS, cfg, Date.now()))); selected.clear(); afterChange(true); toast('Save imported.'); } catch (err) { toast(err.message); } }; i.click(); break; }
    case 'resetProgress': if (!cfg.get('persist.confirmReset') || confirm('Reset all progress? Settings are kept.')) { game.replaceState(freshState(WORKS, cfg, Date.now())); selected.clear(); afterChange(true); } break;
  }
});
document.querySelectorAll('#modal [data-modal]').forEach((b) => b.addEventListener('click', () => openModal(b.dataset.modal)));
$('modalClose').onclick = closeModal; $('btnProgress').onclick = () => openModal('progress'); $('btnQuests').onclick = () => openModal('quests'); $('btnShop').onclick = () => openModal('shop'); $('btnSync').onclick = () => openModal('sync'); $('lvl').onclick = () => openModal('progress');
addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); $('adddlg').style.display = 'none'; setMode(null); } });

// ---------- settings panel ----------
function buildSettings() {
  const body = $('sbody'); body.innerHTML = '';
  for (const [g, name] of GROUPS) {
    const d = document.createElement('details'); d.dataset.group = g; const s = document.createElement('summary'); s.textContent = name; d.appendChild(s);
    for (const def of SETTINGS.filter((x) => x.group === g)) {
      const row = document.createElement('div'); row.className = 'row' + (cfg.isModified(def.key) ? ' mod' : ''); row.dataset.text = (def.label + ' ' + def.help + ' ' + def.key).toLowerCase();
      const v = cfg.get(def.key); let input;
      if (def.type === 'boolean') { input = document.createElement('input'); input.type = 'checkbox'; input.checked = v; }
      else if (def.type === 'select') { input = document.createElement('select'); def.options.forEach((o) => { const op = document.createElement('option'); op.value = op.textContent = o; input.appendChild(op); }); input.value = v; }
      else if (def.type === 'color') { input = document.createElement('input'); input.type = 'color'; input.value = v; }
      else { input = document.createElement('input'); input.type = def.type === 'number' ? 'number' : 'text'; input.value = v; if (def.type === 'number') { if (def.min != null) input.min = def.min; if (def.max != null) input.max = def.max; input.step = def.step ?? (Number.isInteger(def.default) ? 1 : 0.01); } }
      input.addEventListener('change', () => { cfg.set(def.key, def.type === 'boolean' ? input.checked : input.value); onSettingsChanged(def.group); buildSettings(); });
      const lab = document.createElement('div'); lab.innerHTML = `<label>${esc(def.label)}</label><small>${esc(def.help)} <code>${esc(def.key)}</code></small>`;
      const rs = document.createElement('button'); rs.textContent = '↺'; rs.title = 'Reset to default'; rs.style.padding = '0'; rs.style.visibility = cfg.isModified(def.key) ? 'visible' : 'hidden'; rs.onclick = () => { cfg.reset(def.key); onSettingsChanged(def.group); buildSettings(); };
      row.append(lab, input, rs); d.appendChild(row);
    }
    body.appendChild(d);
  }
  applyFilter();
}
function applyFilter() { const q = $('sfilter').value.toLowerCase(); document.querySelectorAll('#sbody .row').forEach((r) => { r.style.display = !q || r.dataset.text.includes(q) ? '' : 'none'; }); document.querySelectorAll('#sbody details').forEach((d) => { if (q) d.open = true; }); }
let t0; function onSettingsChanged(group) { clearTimeout(t0); t0 = setTimeout(() => { buildLegend(); recompute(['layout', 'genres', 'routing', 'views'].includes(group)); showPanel(); }, 150); }
$('sfilter').addEventListener('input', applyFilter);
$('btnSettings').onclick = () => { const s = $('settings'); s.style.display = s.style.display === 'flex' ? 'none' : 'flex'; if (s.style.display === 'flex') buildSettings(); };
$('sexport').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([cfg.exportJSON()], { type: 'application/json' })); a.download = 'strata-settings.json'; a.click(); };
$('simport').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = async () => { cfg.importJSON(await i.files[0].text()); buildSettings(); buildLegend(); recompute(true); }; i.click(); };
$('sreset').onclick = () => { if (!cfg.get('persist.confirmReset') || confirm('Reset all settings to defaults?')) { cfg.reset(); buildSettings(); buildLegend(); recompute(true); } };
setInterval(save, cfg.get('persist.autosaveSeconds') * 1000);
addEventListener('beforeunload', save);

// ---------- start ----------
vw.x = innerWidth / 2 - 300; vw.y = innerHeight / 2;
buildLegend(); resize(); recompute(true); save();
