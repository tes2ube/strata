import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildHtml, bundle } from '../tools/build-app.js';
import { pickStorage } from '../src/core/persist.js';

test('single-file build: one inline script, no module tag, nothing fetched from a server, no import or export left', () => {
  const html = buildHtml();
  assert.ok(!/type="module"/.test(html)); assert.ok(!/<script[^>]+\ssrc=/.test(html), 'no external scripts');
  assert.ok(!/<link[^>]+href=/.test(html), 'no external stylesheets or fonts');
  assert.equal((html.match(/<script>/g) || []).length, 1);
  assert.ok(!/^(import|export)\s/m.test(bundle()));
  assert.ok(html.includes('id="map"') && html.includes('__req("src/render/app.js")'));
  assert.ok(html.length > 100000 && html.length < 3000000);
});

test('Strata.html on disk matches a fresh build (npm test rebuilds it first, so this only fails if someone edits it by hand)', () => {
  const file = fileURLToPath(new URL('../Strata.html', import.meta.url));
  assert.ok(existsSync(file), 'run npm run build');
  assert.equal(readFileSync(file, 'utf8'), buildHtml());
});

test('storage fallback: works with localStorage, and survives a browser that blocks it', () => {
  const real = new Map(), ok = pickStorage(() => ({ getItem: (k) => real.get(k) ?? null, setItem: (k, v) => real.set(k, v), removeItem: (k) => real.delete(k) }));
  assert.equal(ok.persistent, true);
  for (const get of [() => { throw new Error('SecurityError'); }, () => ({ getItem() { return null; }, setItem() { throw new Error('QuotaExceeded'); }, removeItem() {} })]) {
    const f = pickStorage(get); assert.equal(f.persistent, false);
    f.storage.setItem('a', 1); assert.equal(f.storage.getItem('a'), '1'); assert.equal(f.storage.getItem('b'), null); f.storage.removeItem('a'); assert.equal(f.storage.getItem('a'), null);
  }
});
