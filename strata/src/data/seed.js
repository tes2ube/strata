// Seed data: the 29 works from the design mockup plus a starter catalogue for chronicles, Foundations and the alternate views.
// fam = {familyIndex: weight}; tier 0..5; edges are a -> b in time.
// Years for Bulldawg, Dancing on the Wall (2026) and Still Life (2008) were verified by search; everything else, including every
// work added after 'kb', every credit and every place, is from memory and should be checked before you trust it.
const W = (id, title, artist, year, heard, rating, daysAgo, fam, tier, badges = []) => ({ id, title, artist, year, heard, rating, daysAgo, fam, tier, badges });
export const WORKS = [
  W('ill', 'Illmatic', 'Nas', 1994, true, 9, 0, { 0: .8, 6: .2 }, 1, ['landmark', 'canon']),
  W('let', 'The Low End Theory', 'A Tribe Called Quest', 1991, true, 9, 2, { 0: .6, 6: .4 }, 1, ['canon', 'landmark']),
  W('gk', 'good kid, m.A.A.d city', 'Kendrick Lamar', 2012, true, 8, 12, { 0: 1 }, 0),
  W('fs', 'The Forever Story', 'JID', 2022, true, 8, 6, { 0: 1 }, 2),
  W('bd', 'Bulldawg', 'Kenny Mason', 2026, true, 8, 1, { 0: .55, 3: .45 }, 3, ['crossover']),
  W('pif', 'Paid in Full', 'Eric B. & Rakim', 1987, false, 0, 9999, { 0: 1 }, 1, ['origin', 'canon']),
  W('bs', 'Black Star', 'Black Star', 1998, false, 0, 9999, { 0: .8, 6: .2 }, 2),
  W('rtd', 'Ready to Die', 'The Notorious B.I.G.', 1994, false, 0, 9999, { 0: 1 }, 0, ['canon']),
  W('rd', 'Reasonable Doubt', 'Jay-Z', 1996, false, 0, 9999, { 0: 1 }, 1, ['canon']),
  W('sm', 'Sex Machine', 'James Brown', 1970, true, 9, 90, { 1: 1 }, 1, ['origin', 'wellspring']),
  W('mb', 'Maggot Brain', 'Funkadelic', 1971, false, 0, 9999, { 1: .8, 3: .2 }, 2),
  W('rg', "There's a Riot Goin' On", 'Sly & the Family Stone', 1971, false, 0, 9999, { 1: 1 }, 1, ['landmark']),
  W('pc', 'Parcels', 'Parcels', 2018, true, 7, 30, { 1: .5, 2: .5 }, 2),
  W('ram', 'Random Access Memories', 'Daft Punk', 2013, false, 0, 9999, { 1: .4, 2: .3, 4: .3 }, 0),
  W('mu', 'Dancing on the Wall', 'MUNA', 2026, true, 7, 20, { 2: .7, 4: .3 }, 2),
  W('tk', 'Take Off Your Pants and Jacket', 'blink-182', 2001, false, 0, 9999, { 2: .5, 3: .5 }, 0),
  W('rk', 'Forget and Not Slow Down', 'Relient K', 2009, true, 8, 200, { 2: .5, 3: .5 }, 3),
  W('ok', 'Oh No', 'OK Go', 2005, true, 7, 150, { 2: .4, 3: .6 }, 2),
  W('ty', 'Typhoons', 'Royal Blood', 2021, true, 7, 8, { 3: 1 }, 0),
  W('bh', 'The Making Of', 'Bohicas', 2014, true, 6, 60, { 3: 1 }, 4, ['underground']),
  W('el', 'Elephant', 'The White Stripes', 2003, false, 0, 9999, { 3: 1 }, 1, ['canon']),
  W('ki', 'Kids', 'The Midnight', 2022, true, 8, 4, { 3: .4, 4: .6 }, 3),
  W('br', 'Bricolage', 'Amon Tobin', 1997, true, 9, 30, { 4: .8, 6: .2 }, 2, ['crossover']),
  W('en', 'Endtroducing.....', 'DJ Shadow', 1996, false, 0, 9999, { 0: .4, 4: .6 }, 2, ['origin']),
  W('sl', 'Still Life', 'Kodomo', 2008, true, 7, 300, { 4: .5, 5: .5 }, 4),
  W('ko', 'Koyaanisqatsi', 'Philip Glass', 1983, true, 9, 120, { 5: 1 }, 1, ['landmark']),
  W('gl', 'Glassworks', 'Philip Glass', 1982, false, 0, 9999, { 5: 1 }, 2),
  W('bb', 'Bitches Brew', 'Miles Davis', 1970, false, 0, 9999, { 6: 1 }, 1, ['landmark', 'deepend']),
  W('kb', 'Kind of Blue', 'Miles Davis', 1959, false, 0, 9999, { 6: 1 }, 0, ['canon', 'gateway']),
  // --- hip hop: Native Tongues, sampling, Amen
  W('sc', 'Straight Outta Compton', 'N.W.A', 1988, false, 0, 9999, { 0: 1 }, 1, ['landmark']),
  W('tf', '3 Feet High and Rising', 'De La Soul', 1989, false, 0, 9999, { 0: .8, 1: .2 }, 1, ['landmark']),
  W('pit', "People's Instinctive Travels and the Paths of Rhythm", 'A Tribe Called Quest', 1990, false, 0, 9999, { 0: .7, 6: .3 }, 1, ['canon']),
  W('sj', 'Straight Out the Jungle', 'Jungle Brothers', 1988, false, 0, 9999, { 0: 1 }, 2, ['origin']),
  W('ws', "A Wolf in Sheep's Clothing", 'Black Sheep', 1991, false, 0, 9999, { 0: 1 }, 3),
  W('ih', 'I Need a Haircut', 'Biz Markie', 1991, false, 0, 9999, { 0: 1 }, 2, ['landmark']),
  W('itn', 'It Takes a Nation of Millions to Hold Us Back', 'Public Enemy', 1988, false, 0, 9999, { 0: 1 }, 1, ['canon', 'landmark']),
  W('pb', "Paul's Boutique", 'Beastie Boys', 1989, false, 0, 9999, { 0: .7, 3: .3 }, 1, ['landmark']),
  // --- breaks, jungle, trip hop, dub
  W('tl', 'Timeless', 'Goldie', 1995, false, 0, 9999, { 4: 1 }, 2, ['landmark']),
  W('nf', 'New Forms', 'Roni Size / Reprazent', 1997, false, 0, 9999, { 4: .8, 6: .2 }, 3, ['landmark']),
  W('bl', 'Blue Lines', 'Massive Attack', 1991, false, 0, 9999, { 0: .4, 4: .6 }, 1, ['landmark']),
  W('mjg', 'Music for the Jilted Generation', 'The Prodigy', 1994, false, 0, 9999, { 4: 1 }, 1, ['gateway']),
  W('lf', 'Leftism', 'Leftfield', 1995, false, 0, 9999, { 4: 1 }, 2),
  W('sa', 'Super Ape', 'The Upsetters', 1976, false, 0, 9999, { 4: .4, 1: .6 }, 3, ['wellspring']),
  // --- Berlin 1977
  W('low', 'Low', 'David Bowie', 1977, false, 0, 9999, { 3: .5, 4: .25, 5: .25 }, 1, ['landmark']),
  W('hr', '"Heroes"', 'David Bowie', 1977, false, 0, 9999, { 3: .6, 5: .2, 4: .2 }, 1, ['canon']),
  W('idi', 'The Idiot', 'Iggy Pop', 1977, false, 0, 9999, { 3: .7, 4: .3 }, 2),
  W('cle', 'Cluster & Eno', 'Cluster & Eno', 1977, false, 0, 9999, { 5: .6, 4: .4 }, 4),
  W('tee', 'Trans-Europe Express', 'Kraftwerk', 1977, false, 0, 9999, { 4: 1 }, 1, ['origin', 'wellspring']),
  // --- two capitals of punk
  W('ra', 'Ramones', 'Ramones', 1976, false, 0, 9999, { 3: 1 }, 1, ['origin', 'canon']),
  W('ho', 'Horses', 'Patti Smith', 1975, false, 0, 9999, { 3: 1 }, 1, ['canon']),
  W('mm', 'Marquee Moon', 'Television', 1977, false, 0, 9999, { 3: 1 }, 2, ['canon']),
  W('t77', 'Talking Heads: 77', 'Talking Heads', 1977, false, 0, 9999, { 3: .7, 2: .3 }, 2),
  W('nm', "Never Mind the Bollocks, Here's the Sex Pistols", 'Sex Pistols', 1977, false, 0, 9999, { 3: 1 }, 0, ['landmark']),
  W('cl', 'The Clash', 'The Clash', 1977, false, 0, 9999, { 3: 1 }, 1, ['canon']),
  W('dd', 'Damned Damned Damned', 'The Damned', 1977, false, 0, 9999, { 3: 1 }, 3),
  W('pf', 'Pink Flag', 'Wire', 1977, false, 0, 9999, { 3: 1 }, 3, ['rediscovered']),
  // --- cornerstones for the other families
  W('al', 'A Love Supreme', 'John Coltrane', 1965, false, 0, 9999, { 6: 1 }, 1, ['canon']),
  W('to', 'Time Out', 'The Dave Brubeck Quartet', 1959, false, 0, 9999, { 6: 1 }, 0, ['gateway']),
  W('mi', 'Mingus Ah Um', 'Charles Mingus', 1959, false, 0, 9999, { 6: 1 }, 1, ['canon']),
  W('wg', "What's Going On", 'Marvin Gaye', 1971, false, 0, 9999, { 1: 1 }, 1, ['canon']),
  W('inn', 'Innervisions', 'Stevie Wonder', 1973, false, 0, 9999, { 1: 1 }, 1, ['canon']),
  W('sol', 'Songs in the Key of Life', 'Stevie Wonder', 1976, false, 0, 9999, { 1: .8, 2: .2 }, 1, ['canon']),
  W('mfa', 'Music for Airports', 'Brian Eno', 1978, false, 0, 9999, { 5: 1 }, 1, ['origin', 'canon']),
  W('saw', 'Selected Ambient Works 85-92', 'Aphex Twin', 1992, false, 0, 9999, { 4: .5, 5: .5 }, 2, ['canon']),
  W('th', 'Thriller', 'Michael Jackson', 1982, false, 0, 9999, { 2: .7, 1: .3 }, 0, ['canon']),
  W('ru', 'Rumours', 'Fleetwood Mac', 1977, false, 0, 9999, { 2: .6, 3: .4 }, 0, ['canon']),
  W('pr', 'Purple Rain', 'Prince and the Revolution', 1984, false, 0, 9999, { 2: .5, 1: .3, 3: .2 }, 0, ['canon']),
  W('ne', 'Nevermind', 'Nirvana', 1991, false, 0, 9999, { 3: 1 }, 0, ['landmark']),
  W('oc', 'OK Computer', 'Radiohead', 1997, false, 0, 9999, { 3: .8, 4: .2 }, 1, ['canon']),
  W('up', 'Unknown Pleasures', 'Joy Division', 1979, false, 0, 9999, { 3: 1 }, 2, ['canon'])
];

// Subgenres: used by charters and first-in-subgenre bonuses. parents = families whose Foundations a charter needs.
export const SUBGENRES = [
  { id: 'boombap', name: 'Boom bap', parents: ['hiphop'] },
  { id: 'jazzrap', name: 'Jazz rap', parents: ['hiphop', 'jazz'] },
  { id: 'triphop', name: 'Trip hop', parents: ['hiphop', 'electronic'] },
  { id: 'poppunk', name: 'Pop punk', parents: ['pop', 'rock'] },
  { id: 'punk', name: 'Punk', parents: ['rock'] },
  { id: 'jungle', name: 'Jungle and breaks', parents: ['electronic'] },
  { id: 'krautrock', name: 'Krautrock and Berlin', parents: ['rock', 'electronic'] }
];

// Extra facts per work: subgenres, credits (producers, players, samples, label, scene) and a place (city, lat, lon).
// Place means the scene the work belongs to, not necessarily where it was recorded.
const NYC = { city: 'New York', lat: 40.71, lon: -74.01 }, LON = { city: 'London', lat: 51.51, lon: -0.13 }, BER = { city: 'Berlin', lat: 52.52, lon: 13.4 };
const DET = { city: 'Detroit', lat: 42.33, lon: -83.05 }, ATL = { city: 'Atlanta', lat: 33.75, lon: -84.39 }, LA = { city: 'Los Angeles', lat: 34.05, lon: -118.24 };
const BRI = { city: 'Bristol', lat: 51.45, lon: -2.59 }, SF = { city: 'San Francisco', lat: 37.77, lon: -122.42 }, SEA = { city: 'Seattle', lat: 47.61, lon: -122.33 };
export const META = {
  ill: { subs: ['boombap', 'jazzrap'], place: { ...NYC, city: 'Queensbridge, New York' }, credits: { producers: ['Large Professor', 'Pete Rock', 'Q-Tip', 'L.E.S.', 'DJ Premier'], players: ['AZ', 'Olu Dara · trumpet'], samples: ['Michael Jackson · Human Nature', 'Ahmad Jamal · I Love Music'], label: 'Columbia', scene: 'Queensbridge, golden-age boom bap' } },
  let: { subs: ['jazzrap', 'boombap'], place: NYC, credits: { producers: ['A Tribe Called Quest'], players: ['Ron Carter · bass'], label: 'Jive', scene: 'Native Tongues' } },
  gk: { place: LA, credits: { producers: ['Sounwave', 'Pharrell Williams', 'Just Blaze', 'Hit-Boy', 'Dr. Dre'], label: 'Top Dawg / Aftermath', scene: 'Compton' } },
  fs: { place: ATL }, bd: { place: ATL }, pif: { subs: ['boombap'], place: NYC }, bs: { place: NYC }, rtd: { subs: ['boombap'], place: NYC }, rd: { subs: ['boombap'], place: NYC },
  sm: { place: { city: 'Augusta', lat: 33.47, lon: -81.97 } }, mb: { place: DET }, rg: { place: SF }, pc: { place: BER }, ram: { place: { city: 'Paris', lat: 48.86, lon: 2.35 } },
  mu: { place: LA }, tk: { subs: ['poppunk'], place: { city: 'San Diego', lat: 32.72, lon: -117.16 } }, rk: { subs: ['poppunk'], place: { city: 'Canton', lat: 40.8, lon: -81.38 } },
  ok: { subs: ['poppunk'], place: { city: 'Chicago', lat: 41.88, lon: -87.63 } }, ty: { place: { city: 'Brighton', lat: 50.82, lon: -0.14 } }, bh: { place: LON }, el: { place: DET },
  ki: { place: LA }, br: { subs: ['jungle'], place: LON }, en: { subs: ['triphop'], place: SF }, sl: {}, ko: { place: NYC }, gl: { place: NYC }, bb: { place: NYC }, kb: { place: NYC },
  sc: { place: { city: 'Compton', lat: 33.9, lon: -118.22 }, credits: { producers: ['Dr. Dre', 'DJ Yella'] } },
  tf: { subs: ['boombap'], place: NYC, credits: { producers: ['Prince Paul'] } }, pit: { subs: ['jazzrap'], place: NYC, credits: { producers: ['A Tribe Called Quest'] } },
  sj: { subs: ['boombap'], place: NYC }, ws: { place: NYC }, ih: { place: NYC }, itn: { place: NYC }, pb: { place: NYC },
  tl: { subs: ['jungle'], place: LON }, nf: { subs: ['jungle'], place: BRI }, bl: { subs: ['triphop'], place: BRI, credits: { producers: ['Massive Attack', 'Nellee Hooper'] } },
  mjg: { place: { city: 'Braintree', lat: 51.88, lon: 0.55 } }, lf: { place: LON }, sa: { place: { city: 'Kingston', lat: 18.0, lon: -76.79 } },
  low: { subs: ['krautrock'], place: BER, credits: { producers: ['David Bowie', 'Tony Visconti', 'Brian Eno'], scene: 'Berlin, 1977' } },
  hr: { subs: ['krautrock'], place: BER, credits: { producers: ['David Bowie', 'Tony Visconti', 'Brian Eno'], scene: 'Berlin, 1977' } },
  idi: { subs: ['krautrock'], place: BER, credits: { producers: ['David Bowie'], scene: 'Berlin, 1977' } },
  cle: { subs: ['krautrock'], place: { city: 'Cologne', lat: 50.94, lon: 6.96 }, credits: { producers: ['Conny Plank', 'Brian Eno'], scene: 'Berlin, 1977' } },
  tee: { subs: ['krautrock'], place: { city: 'Dusseldorf', lat: 51.23, lon: 6.78 }, credits: { producers: ['Ralf Hutter', 'Florian Schneider'] } },
  ra: { subs: ['punk'], place: NYC }, ho: { subs: ['punk'], place: NYC }, mm: { subs: ['punk'], place: NYC }, t77: { subs: ['punk'], place: NYC },
  nm: { subs: ['punk'], place: LON }, cl: { subs: ['punk'], place: LON }, dd: { subs: ['punk'], place: LON }, pf: { subs: ['punk'], place: LON },
  al: { place: NYC }, to: { place: SF }, mi: { place: NYC }, wg: { place: DET, credits: { producers: ['Marvin Gaye'] } }, inn: { place: DET }, sol: { place: DET },
  mfa: { place: LON, credits: { producers: ['Brian Eno'] } }, saw: { place: LON }, th: { place: LA }, ru: { place: LA }, pr: { place: { city: 'Minneapolis', lat: 44.98, lon: -93.27 } },
  ne: { place: SEA }, oc: { place: { city: 'Oxford', lat: 51.75, lon: -1.26 } }, up: { place: { city: 'Manchester', lat: 53.48, lon: -2.24 } }
};
for (const w of WORKS) Object.assign(w, META[w.id] || {});
export const EDGES = [
  { a: 'pif', b: 'ill', type: 'influence', sim: .8 }, { a: 'let', b: 'ill', type: 'influence', sim: .85 },
  { a: 'ill', b: 'rd', type: 'influence', sim: .75 }, { a: 'rtd', b: 'rd', type: 'influence', sim: .7 },
  { a: 'rtd', b: 'ill', type: 'contemporary', sim: .6 }, { a: 'ill', b: 'gk', type: 'influence', sim: .55 },
  { a: 'gk', b: 'fs', type: 'influence', sim: .6 }, { a: 'sm', b: 'pc', type: 'influence', sim: .5 },
  { a: 'pc', b: 'ram', type: 'contemporary', sim: .6 }, { a: 'br', b: 'en', type: 'contemporary', sim: .5 },
  { a: 'ko', b: 'gl', type: 'personnel', sim: .9 }, { a: 'el', b: 'ty', type: 'influence', sim: .6 },
  { a: 'el', b: 'bh', type: 'influence', sim: .55 }, { a: 'tk', b: 'rk', type: 'influence', sim: .6 },
  { a: 'bd', b: 'ty', type: 'contemporary', sim: .35 }, { a: 'mu', b: 'ki', type: 'contemporary', sim: .4 },
  { a: 'kb', b: 'bb', type: 'personnel', sim: .35 }, { a: 'ill', b: 'bd', type: 'influence', sim: .3 },
  { a: 'pif', b: 'sc', type: 'influence', sim: .5 }, { a: 'sc', b: 'gk', type: 'influence', sim: .6 }, { a: 'pif', b: 'itn', type: 'influence', sim: .45 },
  { a: 'itn', b: 'pb', type: 'contemporary', sim: .5 }, { a: 'sj', b: 'tf', type: 'influence', sim: .6 }, { a: 'tf', b: 'pit', type: 'contemporary', sim: .8 },
  { a: 'pit', b: 'let', type: 'influence', sim: .85 }, { a: 'tf', b: 'let', type: 'influence', sim: .7 }, { a: 'ws', b: 'let', type: 'contemporary', sim: .7 },
  { a: 'tf', b: 'ih', type: 'contemporary', sim: .4 }, { a: 'itn', b: 'en', type: 'influence', sim: .35 }, { a: 'pb', b: 'en', type: 'influence', sim: .45 },
  { a: 'tl', b: 'nf', type: 'contemporary', sim: .8 }, { a: 'en', b: 'tl', type: 'contemporary', sim: .4 }, { a: 'br', b: 'tl', type: 'contemporary', sim: .55 },
  { a: 'sa', b: 'bl', type: 'influence', sim: .5 }, { a: 'bl', b: 'mjg', type: 'contemporary', sim: .4 }, { a: 'lf', b: 'mjg', type: 'contemporary', sim: .6 }, { a: 'en', b: 'bl', type: 'contemporary', sim: .5 },
  { a: 'low', b: 'hr', type: 'contemporary', sim: .85 }, { a: 'low', b: 'idi', type: 'contemporary', sim: .65 }, { a: 'cle', b: 'low', type: 'contemporary', sim: .5 },
  { a: 'tee', b: 'low', type: 'contemporary', sim: .4 }, { a: 'tee', b: 'ram', type: 'influence', sim: .45 }, { a: 'low', b: 'mfa', type: 'personnel', sim: .5 }, { a: 'mfa', b: 'cle', type: 'personnel', sim: .6 },
  { a: 'ra', b: 'nm', type: 'influence', sim: .6 }, { a: 'ho', b: 'mm', type: 'contemporary', sim: .6 }, { a: 'ra', b: 'cl', type: 'influence', sim: .55 }, { a: 'nm', b: 'cl', type: 'contemporary', sim: .75 },
  { a: 'dd', b: 'cl', type: 'contemporary', sim: .6 }, { a: 'dd', b: 'pf', type: 'contemporary', sim: .5 }, { a: 't77', b: 'mm', type: 'contemporary', sim: .6 }, { a: 'ho', b: 'ra', type: 'influence', sim: .45 },
  { a: 'ra', b: 'tk', type: 'influence', sim: .55 }, { a: 'mm', b: 'bh', type: 'influence', sim: .35 }, { a: 'up', b: 'bh', type: 'influence', sim: .4 }, { a: 'ra', b: 'ne', type: 'influence', sim: .45 }, { a: 'ne', b: 'oc', type: 'contemporary', sim: .35 },
  { a: 'rg', b: 'wg', type: 'contemporary', sim: .6 }, { a: 'wg', b: 'inn', type: 'influence', sim: .6 }, { a: 'inn', b: 'sol', type: 'influence', sim: .6 }, { a: 'sm', b: 'mb', type: 'contemporary', sim: .5 },
  { a: 'kb', b: 'al', type: 'influence', sim: .5 }, { a: 'kb', b: 'to', type: 'contemporary', sim: .5 }, { a: 'kb', b: 'mi', type: 'contemporary', sim: .55 },
  { a: 'gl', b: 'mfa', type: 'contemporary', sim: .4 }, { a: 'mfa', b: 'saw', type: 'influence', sim: .5 }, { a: 'saw', b: 'br', type: 'influence', sim: .35 },
  { a: 'sm', b: 'th', type: 'influence', sim: .4 }, { a: 'th', b: 'pr', type: 'contemporary', sim: .5 }, { a: 'ru', b: 'pc', type: 'influence', sim: .3 }
];
