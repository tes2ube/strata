// Bundles: several works treated as one (a part 1 and part 2, say). A bundle is a name plus member ids, stored in state.bundles.
// The members stay in the save untouched. On the map they collapse into one work whose facts are combined from the parts.
// Pure: no DOM, no network.
const DAY = 864e5;
const uniq = (xs) => [...new Set(xs)];

export function bundleId(name, taken) {
  const base = 'b:' + (String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'bundle');
  let id = base, n = 2; while (taken.has(id)) id = `${base}-${n++}`; return id;
}

// Bundles that still have at least two of their members on the map. Others are ignored, so the parts show on their own.
export function activeBundles(raw, bundles) {
  const ids = new Set(raw.map((w) => w.id));
  return (bundles || []).map((b) => ({ ...b, present: b.ids.filter((i) => ids.has(i)) })).filter((b) => b.present.length >= 2);
}

// One work built from its parts. own is the bundle's own save entry, present only once you have rated the bundle yourself.
export function bundleWork(b, ms, own, now) {
  const heardM = ms.filter((w) => w.heard), rated = heardM.filter((w) => w.rating > 0);
  const mean = rated.length ? rated.reduce((s, w) => s + w.rating, 0) / rated.length : 0;
  const ownHeard = !!(own && own.heard), heard = ownHeard || heardM.length > 0;
  const rating = ownHeard && own.rating > 0 ? own.rating : Math.round(mean * 100) / 100;
  const last = Math.max(own?.last || 0, ...ms.map((w) => w.last || 0));
  const firsts = ms.map((w) => w.first).filter((x) => x > 0);
  const fam = {}; for (const m of ms) for (const [i, wt] of Object.entries(m.fam)) fam[i] = (fam[i] || 0) + wt;
  const tot = Object.values(fam).reduce((a, c) => a + c, 0) || 1;
  for (const i of Object.keys(fam)) fam[i] = Math.round(fam[i] / tot * 100) / 100;
  const artists = uniq(ms.map((w) => w.artist)), years = ms.map((w) => w.year).filter(Number.isFinite);
  const hasCredits = ms.some((w) => w.credits);
  const cr = (k) => uniq(ms.flatMap((w) => w.credits?.[k] || []));
  return {
    id: b.id, title: b.name, artist: artists.length <= 2 ? artists.join(' / ') : `${artists[0]} and ${artists.length - 1} more`,
    year: years.length ? Math.min(...years) : null, heard, rating, last, first: firsts.length ? Math.min(...firsts) : last, ratedAt: Math.max(own?.ratedAt || 0, ...ms.map((w) => w.ratedAt || 0)),
    daysAgo: heard ? (now - last) / DAY : 9999, fam, tier: Math.round(ms.reduce((s, w) => s + w.tier, 0) / ms.length),
    badges: uniq(ms.flatMap((w) => w.badges || [])), subs: uniq(ms.flatMap((w) => w.subs || [])), genres: uniq(ms.flatMap((w) => w.genres || [])), tags: uniq(ms.flatMap((w) => w.tags || [])),
    credits: hasCredits ? { producers: cr('producers'), players: cr('players'), samples: cr('samples'), label: ms.find((w) => w.credits?.label)?.credits.label || null, scene: ms.find((w) => w.credits?.scene)?.credits.scene || null } : undefined,
    place: ms.find((w) => w.place)?.place, mbid: null, user: true, source: 'bundle', famPinned: true, verified: ms.every((w) => w.verified), pending: false,
    bundleOf: b.present, members: ms.map((w) => ({ id: w.id, title: w.title }))
  };
}

// raw works in, works out with each active bundle's members replaced by the one bundle work.
export function collapseBundles(raw, bundles, state, now) {
  const act = activeBundles(raw, bundles); if (!act.length) return raw;
  const byId = new Map(raw.map((w) => [w.id, w])), member = new Set(act.flatMap((b) => b.present));
  const out = raw.filter((w) => !member.has(w.id));
  for (const b of act) out.push(bundleWork(b, b.present.map((i) => byId.get(i)), state.works[b.id], now));
  return out;
}

// Connections of the parts now belong to the bundle. A line between two parts of one bundle disappears, duplicates merge.
export function remapEdges(edges, active) {
  const to = new Map(); for (const b of active) for (const i of b.present) to.set(i, b.id);
  if (!to.size) return edges;
  const seen = new Set(), out = [];
  for (const e of edges) {
    const a = to.get(e.a) || e.a, b = to.get(e.b) || e.b; if (a === b) continue;
    const k = a + '|' + b + '|' + e.type; if (seen.has(k)) continue; seen.add(k);
    out.push(a === e.a && b === e.b ? e : { ...e, a, b });
  }
  return out;
}
