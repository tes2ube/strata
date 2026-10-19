// Threads, not streaks: each followed line keeps its own chain. Jumping elsewhere pauses a thread, it never resets it.
// A thread is {id, kind, label, ids:[workIds], lastTs, back}. kind is an edge type. back counts consecutive steps toward precedents.
export function startThread(state, work, cfg, now, kind = 'influence') {
  const existing = state.threads.find((t) => t.ids.length === 1 && t.ids[0] === work.id);
  if (existing) { state.activeThread = existing.id; return existing; }
  const t = { id: 't' + (state.threadSeq = (state.threadSeq || 0) + 1), kind, label: `${work.title} ${cfg.get('threads.label.' + kind)}`, ids: [work.id], lastTs: now, back: 0 };
  state.threads.push(t); state.activeThread = t.id; prune(state, cfg); return t;
}

// Call when a work is rated for the first time. heardBefore: Set of ids heard before this rating. byId: id -> work.
export function extendThreads(state, work, heardBefore, edges, byId, cfg, now, rating) {
  if (rating < cfg.get('xp.chainMinRating')) return null;
  const nb = [];
  for (const e of edges) {
    if (!cfg.get('threads.extend.' + e.type)) continue;
    if (e.a === work.id && heardBefore.has(e.b)) nb.push({ id: e.b, e, dir: e.type === 'influence' ? 'back' : 'side' });
    else if (e.b === work.id && heardBefore.has(e.a)) nb.push({ id: e.a, e, dir: e.type === 'influence' ? 'fwd' : 'side' });
  }
  if (!nb.length) return null;
  let best = null;
  for (const t of state.threads) {
    if (t.ids.includes(work.id)) continue;
    const n = nb.find((x) => x.id === t.ids[t.ids.length - 1] && x.e.type === t.kind);
    if (n && (!best || t.ids.length > best.t.ids.length || (t.ids.length === best.t.ids.length && t.lastTs > best.t.lastTs))) best = { t, n };
  }
  let t, step;
  if (best) { t = best.t; step = best.n; t.ids.push(work.id); }
  else {
    step = nb.slice().sort((a, b) => (b.e.sim ?? 0) - (a.e.sim ?? 0))[0];
    t = { id: 't' + (state.threadSeq = (state.threadSeq || 0) + 1), kind: step.e.type, label: `${byId[step.id].title} ${cfg.get('threads.label.' + step.e.type)}`, ids: [step.id, work.id], lastTs: now, back: 0 };
    state.threads.push(t);
  }
  t.back = step.dir === 'back' ? (t.back || 0) + 1 : 0; t.lastTs = now; state.activeThread = t.id;
  state.longestChain = Math.max(state.longestChain || 0, t.ids.length - 1);
  prune(state, cfg);
  return { thread: t, links: t.ids.length - 1, lineageDepth: t.kind === 'influence' ? t.back : 0 };
}

function prune(state, cfg) {
  const max = cfg.get('threads.maxKept');
  while (state.threads.length > max) {
    const order = state.threads.filter((t) => t.id !== state.activeThread).sort((a, b) => a.lastTs - b.lastTs);
    const drop = order[0]; if (!drop) break;
    state.threads.splice(state.threads.indexOf(drop), 1);
  }
}

export function threadList(state, cfg) {
  const min = cfg.get('threads.minLinks');
  return state.threads.filter((t) => t.ids.length - 1 >= min).slice().sort((a, b) => (b.id === state.activeThread) - (a.id === state.activeThread) || b.lastTs - a.lastTs)
    .map((t) => ({ id: t.id, label: t.label, kind: t.kind, links: t.ids.length - 1, active: t.id === state.activeThread, ids: t.ids }));
}
