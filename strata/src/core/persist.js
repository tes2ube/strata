// Saving: versioned state, rolling backups, JSON export/import, and migration from the first prototype's save. Pure: storage is passed in.
export const STATE_KEY = 'strata.state.v2', OLD_KEY = 'strata.state.v1', BACKUP_KEY = 'strata.backup.';

export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.v === 2) return raw;
  if (raw.works && typeof raw.xp === 'number') return { ...raw, v: 2, migratedFrom: 1 }; // v1 had xp, points, chain, works
  return null;
}

// Fills every field a current save needs, keeping whatever the loaded state has.
export function withDefaults(s, base) {
  const out = { ...base, ...s };
  for (const k of ['unlocks', 'charges', 'chronicles', 'quests', 'foundations', 'via', 'revealed', 'charters', 'facts', 'artists', 'places', 'wd', 'imports']) out[k] = { ...base[k], ...(s?.[k] || {}) };
  out.sync = { ...base.sync, ...(s?.sync || {}) }; out.sync.runs = Array.isArray(out.sync.runs) ? out.sync.runs : []; out.sync.failures = out.sync.failures || {};
  out.charters = { family: {}, sub: {}, ...(s?.charters || {}) };
  for (const k of ['threads', 'scouted', 'flares', 'placed', 'added', 'addedEdges', 'syncEdges']) out[k] = Array.isArray(s?.[k]) ? s[k] : base[k];
  out.works = { ...base.works, ...(s?.works || {}) };
  return out;
}

export function loadState(storage, base) {
  for (const key of [STATE_KEY, OLD_KEY]) {
    try { const m = migrate(JSON.parse(storage.getItem(key) || 'null')); if (m) return withDefaults(m, base); } catch { /* try next */ }
  }
  return null;
}

let lastBackup = 0;
export function saveState(storage, state, cfg, now = Date.now()) {
  const json = JSON.stringify(state);
  try {
    storage.setItem(STATE_KEY, json);
    const n = cfg.get('persist.backups');
    if (n > 0 && now - lastBackup > 6e4) {   // at most one backup a minute, rotating through n slots
      const slot = Math.floor(now / 6e4) % n; storage.setItem(BACKUP_KEY + slot, json); lastBackup = now;
    }
    return true;
  } catch { return false; }
}
export const exportState = (state) => JSON.stringify(state, null, 2);
export function importState(json, base) {
  const m = migrate(JSON.parse(json)); if (!m) throw new Error('Not a Strata save file.');
  return withDefaults(m, base);
}

// Some browsers refuse localStorage for pages opened from disk, or in private windows. Probe it, and fall back to memory
// so the app still runs (progress then lasts only until the tab closes; Export save still works).
export function pickStorage(get) {
  try { const s = get(); const k = 'strata.probe'; s.setItem(k, '1'); s.removeItem(k); return { storage: s, persistent: true }; }
  catch {
    const m = new Map();
    return { storage: { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }, persistent: false };
  }
}
