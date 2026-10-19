// HTML string builders for the side panels and modals. No DOM, so they can be smoke-tested in Node.
// Interactive elements carry data-act (and data-id / data-name / data-kind) and the app handles clicks by delegation.
import { FAMILY_IDS, TIER_IDS } from '../settings/definitions.js';
import { BADGES } from '../core/badges.js';
import { TASTE_AXES } from '../core/stats.js';
import { wheelSvg } from './wheel.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const hsl = (h, s, l) => `hsl(${h} ${s}% ${l}%)`;

// 8.3 -> "strong 8", 7.7 -> "light 8". Uses the same step as the rating bar.
export function ratingText(value, cfg) {
  if (!(value > 0)) return '';
  const n = Math.round(value), d = value - n, half = cfg.get('rating.subStep') / 2;
  return `${d < -half ? 'light' : d > half ? 'strong' : 'decent'} ${n}`;
}
const famHue = (w, cfg) => { let x = 0, y = 0; for (const [i, wt] of Object.entries(w.fam)) { const h = cfg.get(`genres.${FAMILY_IDS[i]}.hue`) * Math.PI / 180; x += Math.cos(h) * wt; y += Math.sin(h) * wt; } return Math.round(((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360); };
export const tierColor = (t, cfg) => cfg.get(`tiers.${TIER_IDS[t]}.color`);
export const initials = (w) => esc(w.title.replace(/^[^A-Za-z0-9]+/, '').slice(0, 2).toUpperCase());

export function shelfHTML(works, cfg, selectedId, pending = []) {
  const rows = works.filter((w) => w.heard).sort((a, b) => b.last - a.last).slice(0, cfg.get('ui.shelfMax'));
  const total = works.filter((w) => w.heard).length;
  const list = rows.map((w) => `<button class="shelfrow${w.id === selectedId ? ' sel' : ''}" data-act="select" data-id="${esc(w.id)}"><span class="mini" style="background:${hsl(famHue(w, cfg), 42, 31)};border-color:${tierColor(w.tier, cfg)};color:${hsl(famHue(w, cfg), 70, 90)}">${initials(w)}</span><span class="grow"><b>${esc(w.title)}</b><span class="muted">${esc(w.artist)} · ${w.year}</span></span><span class="rt"><b>${Math.round(w.rating)}</b><span class="muted">${ratingText(w.rating, cfg).split(' ')[0]}</span></span></button>`).join('');
  const pend = pending.length ? `<div class="mono lab pad">NEEDS A GENRE FAMILY (${pending.length})</div>${pending.slice(0, 20).map((w) => `<button class="shelfrow" data-act="pendingPick" data-id="${esc(w.id)}"><span class="grow"><b>${esc(w.title)}</b><span class="muted">${esc(w.artist)} · pick a family</span></span></button>`).join('')}` : '';
  return `<div class="shelfhead"><b>The Shelf</b><span class="muted mono">${total} heard · recent first</span></div><div class="shelflist">${list || '<div class="muted pad">Nothing yet. Add something you have heard, or sync an account.</div>'}${pend}</div><button class="dashed" data-act="addOpen">+ Add something I've heard</button>`;
}

// d: {work, tierName, famNames, subNames, badges, predicted, credits, growCounts, charges, cover, slots, placed, dowse, selectedCount}
export function panelHTML(d, cfg) {
  const w = d.work, rc = tierColor(w.tier, cfg);
  const chips = [...d.famNames.map((n) => `<span class="chip" style="border-color:${hsl(famHue(w, cfg), 60, 55)};color:${hsl(famHue(w, cfg), 70, 78)}">${esc(n)}</span>`), ...d.subNames.map((n) => `<span class="chip">${esc(n)}</span>`)].join('');
  const badges = (w.badges || []).filter((b) => cfg.get(`badges.${b}.enabled`)).map((b) => `<span class="chip" style="border-color:${rc};color:${rc}">${esc(BADGES[b].name)}</span>`).join('');
  const art = d.cover ? `<img src="${esc(d.cover)}" alt="" class="artimg">` : initials(w);
  const credit = (c) => {
    if (!c.lens) return `<div class="muted small">Producers, players and samples need the Credits Lens. <button class="link" data-act="openShop">Open the shop</button></div>`;
    const secs = c.sections.map((s) => {
      if (s.open) return `<div class="cgroup"><span class="mono lab">${esc(s.label.toUpperCase())}</span><div class="chips">${s.items.map((it) => s.key === 'samples' ? `<span class="chip amber">${esc(it)}</span>` : `<button class="chip dotted" data-act="creditGrow" data-id="${esc(w.id)}" data-name="${esc(it.split(' · ')[0])}">${esc(it)} +</button>`).join('')}</div></div>`;
      if (!s.items.length) return '';
      return `<div class="cgroup"><span class="mono lab">${esc(s.label.toUpperCase())}</span><div><button class="chip dashedchip" data-act="creditReveal" data-id="${esc(w.id)}" data-kind="${s.key}">Reveal ${s.free ? '(free)' : '(1 charge)'}</button></div></div>`;
    }).join('');
    const place = [c.label && `<span class="chip green">${esc(c.label)}</span>`, c.scene && `<span class="chip green">${esc(c.scene)}</span>`].filter(Boolean).join('');
    return `${secs}${place ? `<div class="cgroup"><span class="mono lab">LABEL, SCENE, MOMENT</span><div class="chips">${place}</div></div>` : ''}${secs || place ? '' : '<div class="muted small">No credits on file for this work yet.</div>'}`;
  };
  const gb = (kind, label, color) => `<button class="grow-btn" style="border-color:${color};color:${color}" data-act="grow" data-id="${esc(w.id)}" data-kind="${kind}" ${d.growCounts[kind] ? '' : 'disabled'}>${label}${d.growCounts[kind] ? ` (${d.growCounts[kind]})` : ''}</button>`;
  const col = (t) => cfg.get(`routing.${t}.color`);
  return `<h3>${w.heard ? 'HEARD' : 'NOT HEARD YET'}</h3>
<div class="phead"><div class="art" id="panelart" style="background:${hsl(famHue(w, cfg), 42, 31)};border-color:${rc};color:${hsl(famHue(w, cfg), 70, 90)}">${art}<button class="playov" data-act="play" aria-label="Play preview"><span>▶</span></button></div>
<div class="pmeta"><h2>${esc(w.title)}</h2><div class="muted">${esc(w.artist)} · ${w.year} · ${w.user ? 'Added' : 'Album'}</div><div class="chips">${chips}</div><div class="chips"><span class="chip" style="border-color:${rc};color:${rc}">${esc(d.tierName)}</span>${badges}</div></div></div>
${provHTML(d.prov, d.canArtist)}
<div class="yourrating"><span class="mono lab">YOUR RATING</span><b class="amber-t">${w.heard ? esc(ratingText(w.rating, cfg)) : 'not rated'}</b></div>
${d.predicted != null ? `<div class="muted small">The map expects about ${d.predicted.toFixed(1)} from you.${d.dowse ? ' A dowsing rod points here.' : ''}</div>` : ''}
${w.heard && d.slots?.enabled ? `<div class="muted small">Map slots ${d.slots.used}/${d.slots.capacity} <button class="link" data-act="${d.placed ? 'unplace' : 'place'}" data-id="${esc(w.id)}">${d.placed ? 'Remove from map' : 'Place on map'}</button></div>` : ''}
<div class="hr"></div><b>Credits and connections</b><div class="muted small">Tap any name to grow the tree by it</div>${credit(d.credits)}
<div class="hr"></div><span class="mono lab">OR GROW BY RELATION</span>
<div class="growrow">${gb('precedent', 'Precedent', col('precedent'))}${gb('inspired', 'Inspired', col('inspired'))}${gb('contemporary', 'Contemporary', col('contemporary'))}</div>
<div class="growrow">${gb('sample', 'Samples', col('sample'))}${gb('personnel', 'Personnel', col('personnel'))}<button class="grow-btn" data-act="startThread" data-id="${esc(w.id)}">Start thread</button></div>
<div class="lensrow"><span>Credits lens charges</span><b class="amber-t mono">×${d.charges.lens}</b></div>`;
}

// Where the facts about this work came from. Starter data was written from memory and is flagged until a source confirms it.
function provHTML(p, canArtist) {
  if (!p) return '';
  const when = p.at ? new Date(p.at).toISOString().slice(0, 10) : '';
  const status = p.verified ? `<span class="chip green">Verified from MusicBrainz${when ? ' · ' + when : ''}</span>` : p.unmatched ? '<span class="chip warn">Not found in MusicBrainz</span>' : p.source === 'seed' ? '<span class="chip warn">Unverified: starter data from memory</span>' : '<span class="chip warn">Not verified yet</span>';
  const imp = p.imports.length ? `<span class="chip">From your ${p.imports.map((x) => esc(x)).join(', ')}</span>` : '';
  return `<div class="chips">${status}${imp}</div><div class="growrow">${p.verified ? '' : '<button class="grow-btn" data-act="verifyOne" data-id="' + esc(p.id) + '">Verify this work</button>'}${canArtist ? '<button class="grow-btn" data-act="discography" data-id="' + esc(p.id) + '">More by this artist</button>' : ''}</div>`;
}

export function radarSVG(now, before, cfg) {
  const cx = 188, cy = 100, R = 70, pt = (i, v) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v]; };
  const poly = (vals) => vals.map((v, i) => pt(i, Math.max(0.04, v)).map((n) => n.toFixed(1)).join(',')).join(' ');
  const ring = (k) => TASTE_AXES.map((_, i) => pt(i, k).map((n) => n.toFixed(1)).join(',')).join(' ');
  const labels = TASTE_AXES.map((n, i) => { const [x, y] = pt(i, 1.28); const anchor = Math.abs(x - cx) < 4 ? 'middle' : x > cx ? 'start' : 'end'; return `<text x="${x.toFixed(0)}" y="${(y + 4).toFixed(0)}" text-anchor="${anchor}">${esc(n)}</text>`; }).join('');
  return `<svg viewBox="0 0 376 200" width="100%" role="img" aria-label="Taste signature radar"><g fill="none" stroke="#2B3644"><polygon points="${ring(1)}"/><polygon points="${ring(.66)}"/><polygon points="${ring(.33)}"/></g>${before ? `<polygon points="${poly(before)}" fill="none" stroke="#6B7785" stroke-width="1.5" stroke-dasharray="4 4"/>` : ''}${now ? `<polygon points="${poly(now)}" fill="${cfg.get('rating.fillColor')}" fill-opacity=".22" stroke="${cfg.get('rating.fillColor')}" stroke-width="2"/>` : ''}<g font-size="12" fill="${cfg.get('ui.text')}">${labels}</g></svg>`;
}

// d: {level, rested, points, xp, stats, longest, reveal, taste, ms, charters}
export function progressHTML(d, cfg) {
  const bars = FAMILY_IDS.map((f) => { const r = d.reveal[f], p = Math.round(r.frac * 100), h = cfg.get(`genres.${f}.hue`); return `<div class="barrow"><span>${esc(cfg.get(`genres.${f}.name`))}</span><div class="track"><div style="width:${p}%;background:${hsl(h, 62, 58)}"></div></div><span class="mono muted">${p}%</span></div>`; }).join('');
  return `<div class="cards">
<section class="card"><b class="mono amber-t">FOG OF WAR</b><h4>How much of each territory you have revealed</h4>${bars}<p class="muted small">Thin bars are blind spots. Growing from a work, charters and flares all lift the fog.</p></section>
<section class="card"><b class="mono amber-t">TASTE SIGNATURE</b><h4>The shape your ratings have drawn</h4>${radarSVG(d.taste.now, d.taste.before, cfg)}<p class="muted small">Solid is now. Dashed is ${cfg.get('taste.compareDays')} days ago. A 9 pulls recommendations toward what scored high, a 4 pushes them away.</p></section>
<section class="card"><b class="mono amber-t">MASTERY WHEEL</b><h4>Rarity rings unlocked in each family</h4><div class="wheel">${wheelSvg(d.ms, cfg, { charters: d.charters, size: 300 })}</div><p class="muted small">Mainstream is lit from the start. Outer rings need mastery and works from the tier below.</p></section>
<section class="card"><b class="mono amber-t">YOU</b><h4>${esc(d.level.title)} · Level ${d.level.level}</h4>
<div class="track big"><div style="width:${Math.round(d.level.frac * 100)}%;background:${cfg.get('rating.fillColor')}"></div></div><p class="muted small mono">${Math.round(d.level.into)} of ${d.level.need} XP to the next level</p>
<table class="stats"><tr><td>XP</td><td>${d.xp}</td></tr><tr><td>Points</td><td>${d.points}</td></tr><tr><td>Rested XP banked</td><td>${Math.round(d.rested)}</td></tr><tr><td>Works rated</td><td>${d.stats.ratings}</td></tr><tr><td>Surprises</td><td>${d.stats.surprises}</td></tr><tr><td>Longest thread</td><td>${d.longest}</td></tr></table>
<p class="muted small">XP comes from rating, reaching new territory, rarity, lineage and quests. Never from listening hours.</p></section></div>`;
}

const bar = (n, total) => `<div class="track"><div style="width:${total ? Math.min(100, n / total * 100) : 0}%"></div></div>`;
export function questsHTML(b, cfg) {
  const chron = b.chronicles.map((c) => `<div class="qrow"><div class="qtop"><b>${esc(c.title)}</b><span class="mono muted">${c.done ? 'finished' : `${c.have} of ${c.total}`}</span></div><div class="muted small">${esc(c.era)} · ${esc(c.blurb)}</div>${bar(c.have, c.total)}${c.done ? '' : c.begun ? '<div class="muted small">Begun. Its works are on your map.</div>' : `<button class="small-btn" data-act="beginChronicle" data-id="${esc(c.id)}">Begin and reveal its works</button>`}</div>`).join('');
  const rep = b.repeatables.map((r) => `<div class="qrow"><div class="qtop"><b>${esc(r.title)}</b><span class="mono muted">${r.done ? 'done, back ' + (r.period === 'weekly' ? 'next week' : 'next month') : `${r.n} of ${r.target} · ${r.xp} XP`}</span></div><div class="muted small">${esc(r.blurb)}${r.completed ? ` Completed ${r.completed}x.` : ''}</div>${bar(r.done ? r.target : r.n, r.target)}</div>`).join('');
  const found = b.foundations.map((f) => `<div class="qrow"><div class="qtop"><b>Foundations: ${esc(cfg.get(`genres.${f.fam}.name`))}</b><span class="mono muted">${f.done ? 'finished' : `${f.have} of ${f.total}`}</span></div>${bar(f.have, f.total)}</div>`).join('');
  return `<div class="cards"><section class="card"><b class="mono amber-t">CHRONICLES · ONE-TIME</b><h4>Stories music already tells, played in order</h4>${chron}</section><section class="card"><b class="mono amber-t">REPEATABLE QUESTS</b><h4>Always something to chase, in any order</h4>${rep}</section><section class="card"><b class="mono amber-t">FOUNDATIONS · PER GENRE</b><h4>Cornerstone works</h4>${found}<p class="muted small">Sets are drawn from works marked canon, landmark, origin or gateway. They grow as the catalogue does.</p></section></div>`;
}

const BRANCH = { credits: 'Credits', time: 'Time and era', place: 'Place', charters: 'Charters', consumables: 'Consumables, repeatable' };
export function shopHTML(items, points) {
  const cards = (list) => list.map((it) => {
    const st = it.status, price = it.kind === 'auto' ? '' : `<span class="mono amber-t">${it.price} pts</span>`;
    const body = it.kind === 'auto' ? `<div class="muted small">${it.progress} of ${it.target} lookups${it.owned ? ' · unlocked' : ''}</div>${bar(it.progress, it.target)}` : st === 'owned' ? '<div class="muted small">Owned</div>' : st === 'locked' ? `<div class="muted small">${esc(it.reasons.join('. '))}</div>` : '';
    const btn = it.kind === 'auto' || st === 'owned' ? '' : `<button class="small-btn" data-act="buy" data-id="${esc(it.id)}" ${st === 'available' ? '' : 'disabled'}>Buy</button>`;
    const have = it.kind === 'pack' ? `<span class="mono muted">have ${it.charges}</span>` : '';
    return `<div class="shopcard ${st}"><div class="qtop"><b>${esc(it.name)}</b>${price}</div><div class="muted small">${esc(it.desc)}</div>${body}<div class="qtop">${have}${btn}</div></div>`;
  }).join('');
  const groups = Object.keys(BRANCH).map((k) => { const list = items.filter((i) => i.branch === k); return list.length ? `<section class="card wide"><b class="mono amber-t">${esc(BRANCH[k].toUpperCase())}</b><div class="shopgrid">${cards(list)}</div></section>` : ''; }).join('');
  return `<div class="muted pad">You have <b class="amber-t">${points}</b> points. Respec is always free. Export is never an unlock.</div><div class="cards">${groups}</div>`;
}

// results: [{mbid,title,artist,year,tags,type}]
export function addResultsHTML(results, cfg) {
  if (!results.length) return '<div class="muted pad">No albums or EPs found.</div>';
  return results.map((r, i) => `<button class="shelfrow" data-act="addPick" data-i="${i}"><span class="grow"><b>${esc(r.title)}</b><span class="muted">${esc(r.artist)} · ${r.year || '?'} · ${esc(r.type)}${r.tags.length ? ' · ' + esc(r.tags.slice(0, 3).join(', ')) : ''}</span></span></button>`).join('');
}
export function familyPickHTML(cfg) {
  return FAMILY_IDS.map((f, i) => `<label class="chip pick"><input type="checkbox" data-fam="${i}"> ${esc(cfg.get(`genres.${f}.name`))}</label>`).join('');
}

// d: {summary, providers: PROVIDERS, accounts, ui: {busy, progress, messages}, estimate, queue, policy, scope}
export function syncHTML(d, cfg) {
  const sm = d.summary, pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
  const trust = `<section class="card"><b class="mono amber-t">HOW MUCH IS CHECKED</b><h4>${sm.verified} of ${sm.total} works are verified</h4>
<div class="track big"><div style="width:${pct(sm.verified, sm.total)}%"></div></div>
<table class="stats"><tr><td>Unverified starter works</td><td>${sm.unverifiedSeed}</td></tr><tr><td>Not found in MusicBrainz</td><td>${sm.unmatched}</td></tr><tr><td>Waiting for a genre family</td><td>${sm.pending}</td></tr><tr><td>With credits</td><td>${sm.withCredits}</td></tr><tr><td>With a place</td><td>${sm.withPlace}</td></tr><tr><td>Artists / places / connections from sources</td><td>${sm.artists} / ${sm.places} / ${sm.edges}</td></tr></table>
<p class="muted small">The starter catalogue (works, connections, chronicles, badges) was written from memory and nothing confirms it. ${d.policy === 'hide' ? 'It is hidden unless verified.' : 'It is shown, flagged as unverified.'}</p>
<button class="small-btn" data-act="togglePolicy">${d.policy === 'hide' ? 'Show unverified starter data' : 'Hide unverified starter data'}</button></section>`;
  const cards = Object.entries(d.providers).map(([id, p]) => {
    const a = d.accounts[id] || {}, msg = d.ui.messages[id], busy = d.ui.busy === id;
    const fields = p.fields.map((f) => `<label class="fld"><span class="muted small">${esc(f.label)}</span><input type="${f.secret ? 'password' : 'text'}" autocomplete="off" data-provider="${id}" data-field="${f.key}" value="${esc(a[f.key] || '')}"></label>`).join('');
    return `<section class="card"><b class="mono amber-t">${esc(p.label.toUpperCase())}</b><p class="muted small">${esc(p.help)}</p>${fields}
<div class="growrow"><button class="grow-btn" data-act="syncTest" data-id="${id}" ${d.ui.busy ? 'disabled' : ''}>Test</button><button class="grow-btn" data-act="syncImport" data-id="${id}" ${d.ui.busy ? 'disabled' : ''}>${busy ? 'Importing…' : 'Import my library'}</button>${id === 'musicbrainz' ? `<button class="grow-btn" data-act="syncCollections" ${d.ui.busy ? 'disabled' : ''}>List collections</button>` : ''}</div>
${msg ? `<div class="small ${msg.ok ? 'amber-t' : 'bad'}">${esc(msg.message)}</div>` : ''}<div class="muted small">${sm.bySource[id] ? sm.bySource[id] + ' works came from here.' : 'Nothing imported yet.'}</div></section>`;
  }).join('');
  const prog = d.ui.progress, running = d.ui.busy === 'verify';
  const fails = sm.failures.map((f) => `<div class="small muted">${esc(f.key)} · ${esc(f.step || '')}: ${esc(f.message)}</div>`).join('');
  const runs = sm.runs.slice().reverse().map((r) => `<div class="small muted">${new Date(r.at).toISOString().slice(0, 16).replace('T', ' ')} · ${esc(r.provider)} · ${r.fetched} fetched, ${r.added} added, ${r.matched} matched</div>`).join('');
  const verify = `<section class="card"><b class="mono amber-t">VERIFY AGAINST SOURCES</b><h4>${d.queue.length} work${d.queue.length === 1 ? '' : 's'} still to check</h4>
<p class="muted small">Looks each work up in MusicBrainz (year, genres, tags, artist, credits and samples from the earliest official release), then gets origin places from Wikidata, listener counts from ListenBrainz and similar artists from Last.fm. About ${Math.round(d.estimate / 60)} minute${Math.round(d.estimate / 60) === 1 ? '' : 's'} at MusicBrainz's one-request-a-second limit. You can stop any time and carry on later: what is done is saved.</p>
<label class="small"><input type="radio" name="scope" data-act="scopeSet" data-id="library" ${d.scope === 'library' ? 'checked' : ''}> Heard and scouted works</label> <label class="small"><input type="radio" name="scope" data-act="scopeSet" data-id="all" ${d.scope === 'all' ? 'checked' : ''}> Every work in the catalogue</label>
<div class="growrow"><button class="grow-btn" data-act="syncVerify" ${d.ui.busy ? 'disabled' : ''}>${running ? 'Verifying…' : 'Start verifying'}</button><button class="grow-btn" data-act="syncStop" ${running ? '' : 'disabled'}>Stop</button></div>
${prog ? `<div class="track big"><div style="width:${pct(prog.done, prog.total)}%"></div></div><div class="small muted mono">${esc(prog.phase)} ${prog.done}/${prog.total}</div>` : ''}
${d.ui.messages.verify ? `<div class="small ${d.ui.messages.verify.ok ? 'amber-t' : 'bad'}">${esc(d.ui.messages.verify.message)}</div>` : ''}${fails ? '<div class="mono lab" style="margin-top:8px">RECENT PROBLEMS</div>' + fails : ''}${runs ? '<div class="mono lab" style="margin-top:8px">RECENT RUNS</div>' + runs : ''}</section>`;
  const note = `<section class="card"><b class="mono amber-t">HOW IT WORKS</b><p class="muted small">Strata uses each service's own API with your account or key. It does not scrape web pages. RateYourMusic forbids scraping and has no public API, and Bandcamp has no public API, so neither is a source. Imports add works as heard but unrated, and give no XP: only your own ratings do. Keys and tokens stay in this browser, in their own storage, apart from your settings and save. If a service refuses the request with no clear reason, the browser may be blocking it (CORS): set a request proxy under Settings, Sync and accounts.</p></section>`;
  return `<div class="cards">${trust}${verify}${cards}${note}</div>`;
}
