// Settings store: flat dotted keys, overrides persisted separately from defaults.
import { defaults, SETTINGS } from './definitions.js';

const DEFAULTS = defaults();
const META = Object.fromEntries(SETTINGS.map((s) => [s.key, s]));

export function createSettings(storage = globalThis.localStorage, storageKey = 'strata.settings.v1') {
  let overrides = {};
  const listeners = new Set();
  try { overrides = JSON.parse(storage?.getItem(storageKey) || '{}'); } catch { overrides = {}; }

  function coerce(key, v) {
    const m = META[key];
    if (!m) return v;
    if (m.type === 'number') { let n = Number(v); if (!Number.isFinite(n)) n = m.default; if (m.min != null) n = Math.max(m.min, n); if (m.max != null) n = Math.min(m.max, n); return n; }
    if (m.type === 'boolean') return v === true || v === 'true';
    return String(v);
  }
  const api = {
    get(key) { if (!(key in DEFAULTS)) throw new Error('Unknown setting: ' + key); return key in overrides ? overrides[key] : DEFAULTS[key]; },
    set(key, v) { overrides[key] = coerce(key, v); if (overrides[key] === DEFAULTS[key]) delete overrides[key]; persist(); },
    reset(key) { if (key) delete overrides[key]; else overrides = {}; persist(); },
    isModified(key) { return key in overrides; },
    all() { return { ...DEFAULTS, ...overrides }; },
    exportJSON() { return JSON.stringify(overrides, null, 2); },
    importJSON(s) { const o = JSON.parse(s); overrides = {}; for (const k of Object.keys(o)) if (k in DEFAULTS) overrides[k] = coerce(k, o[k]); persist(); },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
  function persist() { try { storage?.setItem(storageKey, JSON.stringify(overrides)); } catch { /* ignore */ } listeners.forEach((f) => f()); }
  return api;
}

// Plain-object settings for tests and tools: cfg(overrides) -> { get }
export function plainSettings(over = {}) {
  const all = { ...DEFAULTS, ...over };
  return { get: (k) => { if (!(k in all)) throw new Error('Unknown setting: ' + k); return all[k]; }, all: () => all };
}
