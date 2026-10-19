import test from 'node:test';
import assert from 'node:assert/strict';
import { plainSettings } from '../src/settings/store.js';
import { createGame } from '../src/core/game.js';
import { WORKS, EDGES, SUBGENRES } from '../src/data/seed.js';
import { CHRONICLES } from '../src/data/chronicles.js';
import { layout } from '../src/core/layout.js';
import { shelfHTML, panelHTML, progressHTML, questsHTML, shopHTML, ratingText, esc, addResultsHTML, familyPickHTML } from '../src/render/html.js';

const cfg = plainSettings();
const game = createGame({ base: { works: WORKS.map((w) => ({ ...w })), edges: EDGES, subgenres: SUBGENRES, chronicles: CHRONICLES }, cfg, now: () => Date.UTC(2026, 9, 12) });

test('rating text matches the bar wording', () => {
  assert.equal(ratingText(9, cfg), 'decent 9'); assert.equal(ratingText(8.7, cfg), 'light 9'); assert.equal(ratingText(9.3, cfg), 'strong 9'); assert.equal(ratingText(0, cfg), '');
});
test('escape handles markup in titles', () => assert.equal(esc('<b>"x"&'), '&lt;b&gt;&quot;x&quot;&amp;'));

test('shelf, panel, progress, quests and shop render without throwing and contain key content', () => {
  const ws = game.works();
  assert.match(shelfHTML(ws, cfg, 'ill'), /Illmatic/);
  const w = ws.find((x) => x.id === 'ill');
  const html = panelHTML({ work: w, tierName: 'Essential', famNames: ['Hip Hop'], subNames: ['Boom bap'], predicted: 8.2, credits: game.credits('ill'), growCounts: { precedent: 2, inspired: 3, contemporary: 1, sample: 0, personnel: 0 }, charges: game.state.charges, cover: null, slots: { enabled: false }, placed: true, dowse: false }, cfg);
  assert.match(html, /Illmatic/); assert.match(html, /Credits Lens/);
  const L = layout({ works: ws, edges: game.edges(), cfg }), v = game.visibility(L.hex, L.lattice);
  const p = progressHTML({ level: game.level(), rested: 0, points: 0, xp: 0, stats: game.state.stats, longest: 0, reveal: game.reveal(v.visible), taste: game.taste(), ms: v.ms, charters: game.state.charters }, cfg);
  assert.match(p, /TASTE SIGNATURE/); assert.match(p, /<svg/);
  assert.match(questsHTML(game.board(), cfg), /Berlin, 1977/);
  assert.match(shopHTML(game.shopItems(), 10), /Credits Lens/);
  game.state.points = 999; game.buy('creditsLens'); game.revealCredit('ill', 'producers');
  assert.match(panelHTML({ work: w, tierName: 'Essential', famNames: [], subNames: [], predicted: null, credits: game.credits('ill'), growCounts: {}, charges: game.state.charges }, cfg), /Large Professor/);
  assert.match(addResultsHTML([{ title: 'A', artist: 'B', year: 2000, type: 'Album', tags: ['x'] }], cfg), /addPick/);
  assert.match(familyPickHTML(cfg), /Jazz/);
});
