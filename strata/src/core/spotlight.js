// Spotlight: which works and edges stay lit. Hover is a quick look; selection persists and follows enabled relation types.
// Edge types: 'influence' (a came before b), 'contemporary', 'personnel', 'sample', 'other'.
// Following an influence edge forward is an "inspired" step; backward is a "precedent" step. Both are toggled separately.
export function neighbors(id, edges, types, directed) {
  const out = [];
  for (const e of edges) {
    if (e.type === 'influence') {
      if (e.a === id && types.has('inspired')) out.push({ id: e.b, edge: e });
      else if (e.b === id && types.has('precedent') && !directed) out.push({ id: e.a, edge: e });
    } else if (types.has(e.type)) {
      if (e.a === id) out.push({ id: e.b, edge: e });
      else if (e.b === id && !directed) out.push({ id: e.a, edge: e });
    }
  }
  return out;
}
export function chain(startIds, edges, depth, types, directed = false) {
  const works = new Set(startIds), litEdges = new Set();
  let frontier = [...startIds];
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (const id of frontier) for (const n of neighbors(id, edges, types, directed)) {
      litEdges.add(n.edge);
      if (!works.has(n.id)) { works.add(n.id); next.push(n.id); }
    }
    frontier = next;
  }
  return { works, edges: litEdges };
}
export function spotlight({ hoverWork, hoverEdge, selected, edges, cfg, allTypes }) {
  const sel = [...(selected || [])];
  const follow = new Set(allTypes.filter((t) => cfg.get('spotlight.follow.' + t)));
  const selLit = sel.length ? chain(sel, edges, cfg.get('spotlight.chainDepth'), follow, cfg.get('spotlight.followDirected')) : { works: new Set(), edges: new Set() };
  let hovLit = null;
  if (hoverWork) hovLit = chain([hoverWork], edges, cfg.get('spotlight.hoverDepth'), new Set(allTypes), false);
  else if (hoverEdge) hovLit = { works: new Set([hoverEdge.a, hoverEdge.b]), edges: new Set([hoverEdge]) };
  if (!hovLit) return { active: sel.length > 0, works: selLit.works, edges: selLit.edges };
  if (cfg.get('spotlight.hoverIncludesSelection')) {
    return { active: true, works: new Set([...hovLit.works, ...selLit.works]), edges: new Set([...hovLit.edges, ...selLit.edges]) };
  }
  return { active: true, works: hovLit.works, edges: hovLit.edges };
}
