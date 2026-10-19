// Quests: chronicles (one-time stories), repeatables (weekly, monthly, any time) and Foundations (once per genre). Pure.
// State lives in state.chronicles, state.quests and state.foundations. Functions here mutate the state they are given and return rewards.
import { FAMILY_IDS } from '../settings/definitions.js';
import { domFam } from './fog.js';
import { pointsFromXp } from './xp.js';

const DAY = 864e5;
const FOUNDATION_BADGES = ['canon', 'landmark', 'origin', 'gateway'];

// ---- period keys: weekly resets on quests.weeklyResetDay (0 = Sunday), monthly on quests.monthlyResetDay. Days are UTC.
export function periodKey(period, now, cfg) {
  const day = Math.floor(now / DAY);
  if (period === 'weekly') { const dow = (day + 4) % 7; return 'w' + (day - ((dow - cfg.get('quests.weeklyResetDay') + 7) % 7)); }
  if (period === 'monthly') { const d = new Date(now); let y = d.getUTCFullYear(), m = d.getUTCMonth(); if (d.getUTCDate() < cfg.get('quests.monthlyResetDay')) { m--; if (m < 0) { m = 11; y--; } } return `m${y}-${m}`; }
  return 'any';
}

export const REPEATABLES = [
  { id: 'weeklyGateway', title: 'Weekly gateway', period: 'weekly', blurb: "Enter a family you barely know through its easiest door.", xp: 'quests.weeklyGatewayXp', target: () => 1 },
  { id: 'creditHop', title: 'Credit hop', period: 'any', blurb: 'Follow one name (producer, player) and rate what it leads to.', xp: 'quests.creditHopXp', target: (c) => c.get('quests.creditHopLength') },
  { id: 'counterpoint', title: 'Counterpoint', period: 'any', blurb: 'Hear something that pushes against your latest top rating.', xp: 'quests.counterpointXp', target: () => 1 },
  { id: 'blindSpot', title: 'Blind-spot probe', period: 'any', blurb: 'Rate one work in the coolest part of your map.', xp: 'quests.blindSpotXp', target: () => 1 },
  { id: 'reListen', title: 'Re-listen', period: 'monthly', blurb: 'Return to an old album, re-rate it, and see what changed.', xp: 'quests.reListenXp', target: () => 1 }
];

// ---- Foundations: the cornerstone set of a family
export function foundationsFor(fam, works, cfg) {
  return works.filter((w) => domFam(w) === fam && (w.badges || []).some((b) => FOUNDATION_BADGES.includes(b)))
    .sort((a, b) => a.tier - b.tier || (b.badges || []).length - (a.badges || []).length || a.year - b.year)
    .slice(0, cfg.get('quests.foundationsSize'));
}
export function foundationProgress(fam, works, cfg) {
  const set = foundationsFor(fam, works, cfg);
  return { total: set.length, have: set.filter((w) => w.heard).length, ids: set.map((w) => w.id) };
}

// ---- chronicles
// Silently count works already heard (no XP) so old shelves do not pay out later.
export function syncChronicles(state, chronicles, works, now) {
  const heard = new Set(works.filter((w) => w.heard).map((w) => w.id));
  for (const c of chronicles) {
    const st = (state.chronicles[c.id] ||= { steps: [], begun: false, done: 0 });
    for (const id of c.works) if (heard.has(id) && !st.steps.includes(id)) st.steps.push(id);
    if (!st.done && st.steps.length >= c.works.length) { st.done = now; st.silent = true; }
  }
}
export function beginChronicle(state, chronicle, cfg) {
  const st = (state.chronicles[chronicle.id] ||= { steps: [], begun: false, done: 0 });
  if (st.done) return { ok: false, reason: 'Already finished.' };
  if (st.begun) return { ok: false, reason: 'Already begun.' };
  const active = Object.values(state.chronicles).filter((x) => x.begun && !x.done).length;
  if (active >= cfg.get('quests.maxActive')) return { ok: false, reason: 'Too many active quests.' };
  st.begun = true;
  for (const id of chronicle.works) if (!state.scouted.includes(id)) state.scouted.push(id);
  return { ok: true };
}
export const chroniclesDone = (state) => Object.values(state.chronicles).filter((x) => x.done).length;
export const foundationsDone = (state) => Object.keys(state.foundations || {}).length;

// Called once per first rating (and re-rating). ctx: {work, works(after rating), first, isReRate, viaCredit, ref, coolFam, famCountBefore, sim}
// Returns {xp, points, lens, events}. The caller adds these to the state.
export function onRated(state, chronicles, ctx, cfg, now) {
  const out = { xp: 0, points: 0, lens: 0, events: [] };
  const qm = cfg.get('xp.questPointsMult');
  if (ctx.first) {
    for (const c of chronicles) {
      if (!c.works.includes(ctx.work.id)) continue;
      const st = (state.chronicles[c.id] ||= { steps: [], begun: false, done: 0 });
      if (st.steps.includes(ctx.work.id) || st.done) continue;
      st.steps.push(ctx.work.id);
      out.xp += cfg.get('quests.chronicleStepXp');
      out.events.push({ type: 'chronicleStep', id: c.id, title: c.title, have: st.steps.length, total: c.works.length });
      if (st.steps.length >= c.works.length) {
        st.done = now;
        const xp = cfg.get('quests.chronicleCompleteXp'), pts = Math.round(cfg.get('quests.chroniclePoints') * qm), lens = cfg.get('quests.chronicleLensCharges');
        out.xp += xp; out.points += pts; out.lens += lens;
        out.events.push({ type: 'chronicleDone', id: c.id, title: c.title, xp, points: pts, lens });
      }
    }
  }
  const hit = {
    weeklyGateway: () => ctx.first && ctx.work.tier <= 1 && ctx.famCountBefore < cfg.get('quests.gatewayMaxFamilyWorks'),
    creditHop: () => ctx.first && ctx.viaCredit,
    counterpoint: () => ctx.first && ctx.ref && ctx.sim(ctx.work, ctx.ref) <= cfg.get('quests.counterpointMaxSim'),
    blindSpot: () => ctx.first && ctx.coolFam != null && domFam(ctx.work) === ctx.coolFam,
    reListen: () => ctx.isReRate
  };
  for (const r of REPEATABLES) {
    const key = periodKey(r.period, now, cfg);
    const q = (state.quests[r.id] ||= { key, n: 0, done: false });
    if (q.key !== key) { q.key = key; q.n = 0; q.done = false; }
    if (q.done || !hit[r.id]()) continue;
    q.n++;
    if (q.n >= r.target(cfg)) {
      const xp = cfg.get(r.xp), pts = Math.round(pointsFromXp(xp, cfg) * qm);
      q.n = 0; q.done = r.period !== 'any'; q.completed = (q.completed || 0) + 1;
      out.xp += xp; out.points += pts;
      out.events.push({ type: 'questDone', id: r.id, title: r.title, xp, points: pts });
    }
  }
  for (const fam of FAMILY_IDS) {
    if (state.foundations[fam]) continue;
    const p = foundationProgress(fam, ctx.works, cfg);
    if (p.total > 0 && p.have >= p.total) {
      state.foundations[fam] = now;
      const xp = cfg.get('quests.foundationsXp'), pts = Math.round(pointsFromXp(xp, cfg) * qm);
      out.xp += xp; out.points += pts;
      out.events.push({ type: 'foundationsDone', id: fam, xp, points: pts });
    }
  }
  return out;
}

// What the quests panel shows.
export function questBoard(state, chronicles, works, cfg, now) {
  const heard = new Set(works.filter((w) => w.heard).map((w) => w.id));
  return {
    chronicles: chronicles.map((c) => { const st = state.chronicles[c.id] || { steps: [], begun: false, done: 0 }; return { id: c.id, title: c.title, blurb: c.blurb, era: c.era, total: c.works.length, have: c.works.filter((id) => heard.has(id) || st.steps.includes(id)).length, begun: st.begun, done: !!st.done }; }),
    repeatables: REPEATABLES.map((r) => { const key = periodKey(r.period, now, cfg), q = state.quests[r.id]; const fresh = !q || q.key !== key; return { id: r.id, title: r.title, blurb: r.blurb, period: r.period, n: fresh ? 0 : q.n, target: r.target(cfg), done: fresh ? false : q.done, xp: cfg.get(r.xp), completed: q?.completed || 0 }; }),
    foundations: FAMILY_IDS.map((f) => ({ fam: f, ...foundationProgress(f, works, cfg), done: !!state.foundations[f] })).filter((x) => x.total > 0)
  };
}
