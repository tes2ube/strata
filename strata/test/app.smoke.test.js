// Runs src/render/app.js against a stub DOM. Catches runtime errors (undefined names, bad calls) in the draw, panel and click paths.
// It cannot tell you the screen looks right. Open the app in a browser for that.
import test from 'node:test';
import assert from 'node:assert/strict';
import { network } from './fixtures.js';
import vm from 'node:vm';

const els = new Map(), docListeners = {}, winListeners = {};
const noop = () => {};
function makeEl(id) {
  const listeners = {}, store = { style: {}, dataset: {}, children: [], classList: { toggle: noop, add: noop, remove: noop } };
  const ctxStub = new Proxy({}, { get: (t, k) => (k === 'createRadialGradient' ? () => ({ addColorStop: noop }) : k === 'measureText' ? () => ({ width: 10 }) : k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
  const el = new Proxy(store, {
    get(t, k) {
      if (k === 'addEventListener') return (n, f) => { (listeners[n] ||= []).push(f); };
      if (k === '_fire') return (n, ev) => (listeners[n] || []).forEach((f) => f(ev));
      if (k === 'getContext') return () => ctxStub;
      if (k === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 100, height: 100 });
      if (k === 'querySelector') return () => ({ click: noop, addEventListener: noop });
      if (k === 'querySelectorAll') return () => [];
      if (k === 'appendChild') return (c) => { t.children.push(c); return c; };
      if (k === 'remove' || k === 'setPointerCapture' || k === 'click' || k === 'blur') return noop;
      if (k === 'closest') return () => null;
      if (k in t) return t[k];
      return k === 'value' ? '' : undefined;
    },
    set(t, k, v) { t[k] = v; return true; }
  });
  return el;
}
const byId = (id) => { if (!els.has(id)) els.set(id, makeEl(id)); return els.get(id); };
// A save with points and the view unlocks already owned, so every view can be drawn.
const mem = new Map([['strata.settings.v1', JSON.stringify({ 'data.fetchCovers': false, 'sync.delayMs.musicbrainz': 0, 'sync.delayMs.listenbrainz': 0, 'sync.delayMs.lastfm': 0, 'sync.delayMs.wikidata': 0 })], ['strata.state.v2', JSON.stringify({ v: 2, xp: 0, points: 99999, unlocks: { personnelGraph: 1 }, works: {} })]]);
Object.assign(globalThis, {
  localStorage: { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) },
  document: { getElementById: byId, createElement: (tag) => makeEl(tag), querySelectorAll: () => [], addEventListener: (n, f) => { (docListeners[n] ||= []).push(f); } },
  addEventListener: (n, f) => { (winListeners[n] ||= []).push(f); }, innerWidth: 1600, innerHeight: 900, devicePixelRatio: 1,
  requestAnimationFrame: (f) => f(), setInterval: () => 0, Path2D: class { }, Image: class { }, Audio: class { play() { } pause() { } },
  alert: noop, confirm: () => true, fetch: network([[/wikipedia|itunes|deezer|coverartarchive/, () => ({ status: 404, json: {} })]])
});
const click = (act, data = {}) => (docListeners.click || []).forEach((f) => f({ target: { closest: () => ({ dataset: { act, ...data } }) } }));
const canvas = () => byId('map');

test('app loads, draws the genre map, selects a work, rates it, and opens every modal', async () => {
  if (process.env.STRATA_BUNDLE === '1') { const { bundle } = await import('../tools/build-app.js'); vm.runInThisContext(bundle(), { filename: 'Strata.html (bundle)' }); }   // the same code the single-file build ships
  else await import('../src/render/app.js');
  assert.ok(byId('shelf').innerHTML.includes('Illmatic'), 'shelf lists heard works');
  assert.ok(byId('lvl').innerHTML.includes('Lv'));
  click('select', { id: 'ill' });
  assert.ok(byId('panelbody').innerHTML.includes('Illmatic'), 'panel renders');
  byId('ratingbar')._fire('click', { clientY: 10 });
  click('openShop'); assert.ok(byId('modalbody').innerHTML.includes('Credits Lens'));
  byId('btnQuests').onclick(); assert.ok(byId('modalbody').innerHTML.includes('Native Tongues'));
  byId('btnProgress').onclick(); assert.ok(byId('modalbody').innerHTML.includes('TASTE SIGNATURE'));
  click('beginChronicle', { id: 'berlin' });
  click('grow', { id: 'ill', kind: 'inspired' });
  click('startThread', { id: 'ill' });
  click('addOpen'); assert.ok(byId('adddlg').innerHTML.includes('GENRE FAMILIES'));
  click('exportSave');
});

test('purchases work and every view draws without errors', () => {
  for (const id of ['creditsLens', 'eraLens', 'placeOverlay', 'lensPack', 'flarePack', 'dowsePack', 'rollPack']) click('buy', { id });
  assert.ok(!byId('tabs').innerHTML.includes('🔒'), 'all views unlocked');
  for (const v of ['time', 'credits', 'place', 'genre']) { click('view', { id: v }); assert.ok(byId('hud').textContent.includes('visible'), v); }
  click('toolFlare'); canvas()._fire('pointerup', { clientX: 400, clientY: 400 });
  click('toolDowse'); click('toolRoll');
  click('select', { id: 'ill' }); click('creditReveal', { id: 'ill', kind: 'producers' });
  assert.ok(byId('panelbody').innerHTML.includes('Large Professor'), 'credits revealed after the lens');
  canvas()._fire('pointermove', { clientX: 500, clientY: 400 });
  canvas()._fire('wheel', { clientX: 500, clientY: 400, deltaY: -100, preventDefault: noop });
});

const until = async (fn, ms = 4000) => { const t = Date.now(); while (!fn()) { if (Date.now() - t > ms) throw new Error('timed out'); await new Promise((r) => setTimeout(r, 10)); } };
const change = (provider, field, value) => (docListeners.change || []).forEach((f) => f({ target: { dataset: { provider, field }, value } }));

test('sync screen: save account, import from ListenBrainz, verify, see provenance, pick a family, toggle the starter policy', async () => {
  click('syncTest', { id: 'listenbrainz' });
  await until(() => byId('modalbody').innerHTML.includes('Fill in'));
  byId('btnSync').onclick(); assert.ok(byId('modalbody').innerHTML.includes('VERIFY AGAINST SOURCES') && byId('modalbody').innerHTML.includes('HOW MUCH IS CHECKED'));
  change('listenbrainz', 'username', 'me'); assert.ok(JSON.parse(mem.get('strata.accounts.v1')).listenbrainz.username === 'me');
  assert.ok(!mem.get('strata.settings.v1').includes('"me"'), 'accounts are not in settings');
  click('syncImport', { id: 'listenbrainz' });
  await until(() => byId('modalbody').innerHTML.includes('Imported 2')).catch((e) => { console.log(byId('modalbody').innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 900)); throw e; });
  assert.ok(byId('shelf').innerHTML.includes('NEEDS A GENRE FAMILY'), 'the new work has no recognisable genre yet');
  click('syncVerify'); await until(() => byId('modalbody').innerHTML.includes('Checked'));
  click('select', { id: 'ill' });
  assert.ok(byId('panelbody').innerHTML.includes('Verified from MusicBrainz'), 'provenance shown after verifying');
  click('creditReveal', { id: 'ill', kind: 'players' });
  assert.ok(byId('panelbody').innerHTML.includes('Olu Dara') && byId('panelbody').innerHTML.includes('trumpet'), 'credits shown are the verified ones from MusicBrainz');
  assert.ok(!byId('panelbody').innerHTML.includes('Large Professor'), 'remembered credits are gone once verified');
  click('pendingPick', { id: byId('shelf').innerHTML.match(/data-act="pendingPick" data-id="([^"]+)"/)?.[1] }); assert.ok(byId('adddlg').innerHTML.includes('Which genre family'));
  click('togglePolicy'); assert.ok(JSON.parse(mem.get('strata.settings.v1'))['sync.unverifiedSeed'] === 'hide');
  click('discography', { id: 'ill' });
});
