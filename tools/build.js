// Builds every Steadfast page from Paragon's real page source (tools/src, fetched by tools/fetch-src.sh).
// Structure, classes, CSS and animation code stay Paragon's; routes, text, media, logos, colors and fonts become Steadfast's.
// Run: node tools/build.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(__dirname, 'src');
const VENDOR = path.join(__dirname, 'vendor');
const write = (rel, s) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------- routes: Paragon path -> Steadfast path ----------
const SLUGS = {
  directors: { 'dylan-bradshaw': 'marcus-hale', 'jacob-frost': 'dre-collins', 'jack-linderman': 'sam-kessler', 'brian-myers': 'nia-brooks' },
  works: {
    'bake-it-till-you-make-it': 'barbell-club', 'closer-to-home': 'strength-foundations', 'doing-great-things-together': 'team-conditioning',
    'electric-ideas': 'engine-builder', 'i-am-ready-karts-to-cars': 'athlete-performance', 'playing-in-the-dark': '5am-club',
    'take-your-time': 'mobility-recovery', 'we-fight-cancer-here': 'lift-for-life',
  },
  post: {
    'behind-the-spot-visit-french-lick': 'behind-the-session-meet-day', 'into-2026': 'into-2026',
    'merch-drop-for-the-ones-in-pursuit': 'merch-drop-built-not-bought', 'paragon-steps-into-its-future': 'steadfast-opens-the-new-floor',
  },
  clients: {
    'formula-4': 'athletes', invst: 'busy-professionals', 'irongate-creative': 'first-responders', 'new-york-bakery': 'beginners',
    purdue: 'teams', 'the-basement': 'masters-40-plus', 'well-done-marketing': 'women-who-lift',
  },
};
const FOLDER = { directors: 'coaches', works: 'programs', post: 'results', clients: 'for' };
const TOP = { '/': '/', '/contact': '/join', '/news': '/results', '/work': '/programs', '/why-paragon': '/why-steadfast', '/directors': '/coaches' };
const route = p => {
  const clean = p.replace(/\/$/, '') || '/';
  if (TOP[clean]) return TOP[clean];
  const m = clean.match(/^\/(directors|works|post|clients)\/([^/?#]+)$/);
  if (m && SLUGS[m[1]][m[2]]) return `/${FOLDER[m[1]]}/${SLUGS[m[1]][m[2]]}`;
  return null;
};
const PAGES = [
  ...['index', 'contact', 'news', 'work', 'why-paragon', 'directors'].map(n => ({ src: n + '.html', path: route(n === 'index' ? '/' : '/' + n) })),
  ...Object.entries(SLUGS).flatMap(([dir, map]) => Object.keys(map).map(s => ({ src: `${dir}/${s}.html`, path: route(`/${dir}/${s}`) }))),
];
const outFile = p => (p === '/' ? 'index' : p.slice(1)) + '.html';

// ---------- css + js: copy Paragon's files locally ----------
const CSS_DIR = '/assets/css/', JS_DIR = '/assets/js/';
const COLORS = [
  // Paragon swatch -> Steadfast swatch (variables + any literal use)
  ['#ff5b4b', '#e3492b'], // red -> brand orange
  ['#44b6fd', '#e9a93a'], // blue -> mustard
  ['#88d4f5', '#f1cf86'], // light blue -> light mustard
  ['#508992', '#2f5a4b'], // teal -> deep green
  ['#f8f8f8', '#f4f1ea'], // white -> cream
];
const recolor = s => COLORS.reduce((a, [from, to]) => a.replace(new RegExp(escRe(from), 'gi'), to), s);
// ch = width of "0" in the element's font, which differs in our stand-ins; pin each ch rule to Paragon's width in em
const CH = JSON.parse(fs.readFileSync(path.join(__dirname, 'fonts/ch-map.json'), 'utf8')).map;
const fixCh = css => css.replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, decl) => {
  if (!/[\d.]ch\b/.test(decl)) return m;
  const k = sel.split(',').map(s => CH[s.trim()]).find(Boolean);
  return k ? `${sel}{${decl.replace(/(\d*\.?\d+)ch\b/g, (x, n) => +(n * k).toFixed(3) + 'em')}}` : m;
});
for (const f of fs.readdirSync(VENDOR)) {
  let s = fs.readFileSync(path.join(VENDOR, f), 'utf8');
  if (f.endsWith('.css')) {
    // Paragon's licensed faces go; assets/css/steadfast-fonts.css registers fitted stand-ins under the same names
    s = s.replace(/@font-face\{font-family:(Review Condensed|Proxima Nova|Simplon Norm|Roobert);[^}]*\}/g, '');
    write(CSS_DIR + f.replace(/^paragonproductions\./, 'steadfast.'), fixCh(recolor(s)));
  } else if (f.endsWith('.js') && !/^117787750/.test(f)) write(JS_DIR + f.replace(/\.dc5e7f18c8/, ''), s);
}
const cssName = u => CSS_DIR + u.split('/').pop().replace(/^paragonproductions\./, 'steadfast.');

// ---------- media ----------
// photos: tools/media/plan.js (stills cropped to Paragon's ratios), polaroids: tools/media/polaroids.js
const PHOTOS = JSON.parse(fs.readFileSync(path.join(__dirname, 'media/map.json'), 'utf8'));
const POLAROIDS = JSON.parse(fs.readFileSync(path.join(__dirname, 'media/polaroids.json'), 'utf8'));
// graphics: Paragon sticker/logo id -> tools/brand/stickers.html render
const B = n => ({ src: `/assets/brand/${n}`, small: null });
const GRAPHIC = {
  '68c3328c5da6b5bef7d9b3af': B('sticker-kettlebell.webp'), '68c3328ca3d8c04b03ac2f33': B('sticker-s-stripes.webp'),
  '68c3328ca9b8690ce0675ec6': B('sticker-oval-barbell.webp'), '68c3328d3b870fc72d0e251b': B('sticker-oval-plate.webp'),
  '68c3349d01c75df68bb05c14': B('sticker-kb-badge.webp'), '68cf154d924f24b941a05537': B('webclip.png'), '68cf159c1cfd33396775dd06': B('og.png'),
  '68d44bedf755e44463dc9905': B('poster-no-days-off.webp'), '68d44bee28c0cf20a66ce217': B('poster-stdfst.webp'),
  '68d6097060824f7077fea08c': B('card-kettlebell-band.webp'), '68e5469686d9dd58f4a26ca5': B('icon-s.webp'), '68f1af34b98abaef98911341': B('icon-s.webp'),
  '68e91d499774ec46b981274a': B('sticker-s-tall.webp'), '68e91d57ba1aafbfffd97199': B('sticker-kb-tall.webp'), '68ed28d85e27801e273cc724': B('hero-banner.webp'),
  '68f1b0bee648251b59835699': B('merch-crewneck.webp'), '68f1adaeb46bd2b5590a880d': B('sticker-pile.webp'), '69179358d89d0aa75afc63a2': B('mark-script-s.webp'),
  '6918cec6c08fb4be3df1b7bf': B('badge-round-coach.webp'), '6918cf0b6b91791f135efd3a': B('badge-stdfst.webp'), '6918d13c95dd2d43bc182135': B('sticker-plate-crew.webp'),
  '68d45941ee3ea93a3c90363f': B('favicon.png'),
};
const MEDIA = { ...PHOTOS, ...POLAROIDS, ...GRAPHIC };
const CDN_IMG = /https:\/\/cdn\.prod\.website-files\.com\/[0-9a-f]{24}\/([0-9a-f]{24})_[^"'\s),]*/g;
const missingMedia = new Set();
function swapMedia(h) {
  // <img>: src -> ours, srcset rebuilt from our two sizes (Paragon's sizes attribute stays)
  h = h.replace(/<img [^>]*>/g, tag => {
    const id = (tag.match(/ src="https:\/\/cdn\.prod\.website-files\.com\/[0-9a-f]{24}\/([0-9a-f]{24})_/) || [])[1];
    if (!id) return tag;
    const m = MEDIA[id];
    if (!m) { missingMedia.add(id); return tag; }
    const set = m.small ? `${m.small} ${m.small.includes('-500') ? 500 : 800}w, ${m.src} ${m.w || 2048}w` : null;
    tag = tag.replace(/ src="[^"]*"/, ` src="${m.src}"`);
    return set ? tag.replace(/ srcset="[^"]*"/, ` srcset="${set}"`) : tag.replace(/ srcset="[^"]*"/, '').replace(/ sizes="[^"]*"/, '');
  });
  // anything else (inline styles, meta, data attributes, link icons)
  return h.replace(CDN_IMG, (u, id) => (MEDIA[id] ? MEDIA[id].src : (missingMedia.add(id), u)));
}
// inline brand SVGs: keep Paragon's <svg> tag, swap the drawing
const { SVGS } = require('./brand/svgs.js');
const swapSvgs = h => h.replace(/(<svg[^>]*viewBox="([^"]+)"[^>]*>)[\s\S]*?<\/svg>/g, (m, open, vb) => (SVGS[vb] ? open + SVGS[vb] + '</svg>' : m));

// ---------- text ----------
// tools/text/*.json: exact visible Paragon string -> Steadfast copy ("@..." keys are attribute values).
// Applied only to text nodes and alt/aria-label/placeholder/title attributes, never to markup, classes or scripts.
const norm = s => s.replace(/\s+/g, ' ').trim();
const TEXT = {}, ATTR = {};
for (const f of fs.readdirSync(path.join(__dirname, 'text')).filter(f => f.endsWith('.json'))) {
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname, 'text', f), 'utf8')))) {
    if (k[0] === '_') continue;
    if (k[0] === '@') ATTR[norm(k.slice(1))] = v; else TEXT[norm(k)] = v;
  }
}
// any brand words left in strings we didn't write by hand
const BRAND = [[/paragonproductions\.co/g, 'steadfastclub.com'], [/PARAGON/g, 'STEADFAST'], [/Paragon Productions/g, 'Steadfast'], [/Paragon/g, 'Steadfast'],
  [/PRGN/g, 'STDFST'], [/Indianapolis/g, 'Nashville'], [/Indiana/g, 'Tennessee'], [/Midwest/g, 'Southern']];
const brand = s => BRAND.reduce((a, [re, to]) => a.replace(re, to), s);
const untranslated = new Map();
const swapText = t => {
  const k = norm(t);
  if (!k) return t;
  if (k in TEXT) return t.replace(k.length === t.length ? t : t.trim(), TEXT[k]).replace(/^(\s*)[\s\S]*?(\s*)$/, (m, a, b) => a + TEXT[k] + b);
  if (/[A-Za-z]{3}/.test(k)) untranslated.set(k, (untranslated.get(k) || 0) + 1);
  return brand(t);
};
function applyText(h) {
  // split off head/script/style/svg so only real body text is touched
  return h.replace(/(<head[\s\S]*?<\/head>|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>)|>([^<>]+)</g, (m, skip, txt) => (skip ? skip : '>' + swapText(txt) + '<'))
    .replace(/(<(?!script|style)[a-z][^>]*?\s)(alt|aria-label|placeholder|title)="([^"]*)"/g, (m, pre, a, v) => {
      const k = norm(v);
      return pre + `${a}="${k in ATTR ? ATTR[k] : brand(v)}"`;
    });
}
// photo alt text from what the stock shot shows (role = which shoot it came from)
const ROLE_ALT = {
  'barbell-club': 'Barbell Club lifters training in the wood-paneled strength room at Steadfast',
  'team-conditioning': 'Team Conditioning class working through a partner session at Steadfast',
  'athlete-performance': 'Athletes training speed and power in the Athlete Performance program',
  '5am-club': 'Members training before sunrise in the 5AM Club',
  'mobility-recovery': 'Mobility and recovery session in the bright window studio at Steadfast',
  'strength-foundations': 'Beginners learning the basic lifts in Strength Foundations',
  'engine-builder': 'Outdoor conditioning intervals in the Engine Builder program',
  'lift-for-life': 'Members lifting together at the Lift for Life charity day',
  'coach-marcus-hale': 'Coach Marcus Hale on the Steadfast floor', 'coach-dre-collins': 'Coach Dre Collins coaching a session',
  'coach-sam-kessler': 'Coach Sam Kessler in the Steadfast gym', 'coach-nia-brooks': 'Coach Nia Brooks leading a mobility session',
  general: 'Members training at Steadfast, a strength and conditioning club in Nashville',
};
const altFor = src => {
  const pol = Object.values(POLAROIDS).find(p => p.src === src);
  if (pol) return `${pol.caption} - a Steadfast member moment, Nashville strength and conditioning club`;
  const m = src.match(/\/assets\/img\/(.+)-\d{3}\.webp$/);
  return m && ROLE_ALT[m[1]];
};
const fixAlts = h => h.replace(/<img [^>]*>/g, tag => {
  const src = (tag.match(/ src="([^"]+)"/) || [])[1];
  const alt = src && altFor(src);
  return alt && / alt="[^"]+"/.test(tag) ? tag.replace(/ alt="[^"]*"/, ` alt="${alt}"`) : tag;
});

// ---------- head / SEO ----------
const SITE = 'https://steadfast.traviskenlocean1.workers.dev';
const ORG = {
  '@type': 'ExerciseGym', '@id': SITE + '/#gym', name: 'Steadfast Strength & Conditioning Club', url: SITE + '/',
  logo: SITE + '/assets/brand/webclip.png', image: SITE + '/assets/brand/og.png', telephone: '+1-615-555-0142', email: 'hello@steadfastclub.com', priceRange: '$$',
  address: { '@type': 'PostalAddress', streetAddress: '1214 Clinton St', addressLocality: 'Nashville', addressRegion: 'TN', postalCode: '37203', addressCountry: 'US' },
  geo: { '@type': 'GeoCoordinates', latitude: 36.1691, longitude: -86.7983 },
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '05:00', closes: '21:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday', 'Sunday'], opens: '07:00', closes: '14:00' }],
  sameAs: ['https://www.instagram.com/', 'https://www.tiktok.com/', 'https://www.youtube.com/'],
};
const DESC = {
  '/': 'Steadfast is a strength and conditioning club in Nashville, TN. Coached barbell, conditioning, athlete and mobility programs for beginners to competitors. Book a free class.',
  coaches: 'Meet the Steadfast coaches: strength, conditioning, athlete performance and mobility coaches in Nashville, TN.',
  programs: 'Coached strength and conditioning programs in Nashville: Barbell Club, 5AM Club, Strength Foundations, Athlete Performance, Engine Builder and more.',
  results: 'Member results, meet days and updates from Steadfast, a strength and conditioning club in Nashville, TN.',
  'why-steadfast': 'Why Steadfast: how we coach, what we believe, and the people behind Nashville’s strength and conditioning club.',
  join: 'Join Steadfast in Nashville, TN. Book a free class, ask about memberships, or set up team training with our coaches.',
  for: 'Steadfast programs built for you, with coaches who meet you where you are. Strength and conditioning in Nashville, TN.',
};
const AUDIENCE = { athletes: 'Athletes', 'busy-professionals': 'Busy Professionals', 'first-responders': 'First Responders', beginners: 'Beginners', teams: 'Teams', 'masters-40-plus': 'Masters 40+', 'women-who-lift': 'Women Who Lift' };
function headFor(urlPath, paragonTitle, h) {
  const first = norm(paragonTitle.replace(/&amp;/g, '&').split('|')[0]);
  const sec = urlPath.split('/')[1] || '/';
  const TOPT = { '/': 'Steadfast | Strength & Conditioning Club in Nashville, TN', join: 'Join Steadfast | Book a Free Class in Nashville', results: 'Results & Journal | Steadfast',
    programs: 'Programs | Strength & Conditioning in Nashville | Steadfast', 'why-steadfast': 'Why Steadfast | Who We Are', coaches: 'Coaches | Steadfast Strength Club' };
  let title = urlPath.split('/').length === 2 || urlPath === '/' ? TOPT[sec] : `${TEXT[norm(first)] ? TEXT[norm(first)].replace(/&amp;/g, '&') : brand(first)} | Steadfast`;
  if (sec === 'for') title = `For ${AUDIENCE[urlPath.split('/')[2]]} | Steadfast`;
  const url = SITE + (urlPath === '/' ? '/' : urlPath);
  const desc = DESC[urlPath === '/' ? '/' : sec] || DESC['/'];
  const ld = urlPath === '/' ? ORG : {
    '@type': sec === 'results' && urlPath !== '/results' ? 'Article' : 'WebPage', name: title, url, description: desc,
    isPartOf: { '@id': SITE + '/#gym' }, publisher: { '@id': SITE + '/#gym' },
    ...(sec === 'results' && urlPath !== '/results' ? { headline: title.replace(' | Steadfast', ''), author: { '@type': 'Organization', name: 'Steadfast' } } : {}),
  };
  const graph = urlPath === '/' ? { '@context': 'https://schema.org', ...ORG } : { '@context': 'https://schema.org', '@graph': [ld, ORG] };
  const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return { title, html: `<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"/><link rel="canonical" href="${url}"/>
<meta property="og:type" content="website"/><meta property="og:site_name" content="Steadfast"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(desc)}"/><meta property="og:url" content="${url}"/><meta property="og:image" content="${SITE}/assets/brand/og.png"/>
<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(title)}"/><meta name="twitter:description" content="${esc(desc)}"/><meta name="twitter:image" content="${SITE}/assets/brand/og.png"/>
<link rel="icon" href="/assets/brand/favicon.png" type="image/png"/><link rel="apple-touch-icon" href="/assets/brand/webclip.png"/>
<script type="application/ld+json">${JSON.stringify(graph)}</script>` };
}

// ---------- per page ----------
function buildPage({ src, path: urlPath }) {
  let h = fs.readFileSync(path.join(SRC, src), 'utf8');

  // third-party: A/B testing, analytics, tag manager
  h = h.replace(/<link[^>]*intellimize[^>]*>/g, '')
    .replace(/<script[^>]*intellimize[^>]*><\/script>/g, '')
    .replace(/<script[^>]*>[^<]*(intellimize|googletagmanager|gtag\(|google_tags_first_party)[\s\S]*?<\/script>/g, '')
    .replace(/<noscript>(?:(?!<\/noscript>)[\s\S])*?googletagmanager[\s\S]*?<\/noscript>/g, '')
    .replace(/<script async="" src="\/[0-9a-zA-Z]+\/[^"]*"><\/script>/g, '')
    .replace(/ data-wf-intellimize-customer-id="[^"]*"/g, '');

  // stylesheets + scripts -> local copies
  h = h.replace(/href="https:\/\/cdn\.prod\.website-files\.com\/[^"]+\/css\/([^"]+\.css)"/g, (m, f) => `href="${cssName(f)}"`)
    .replace('https://unpkg.com/lenis@1.2.3/dist/lenis.css', CSS_DIR + 'lenis.css')
    .replace(/src="https:\/\/cdn\.prod\.website-files\.com\/gsap\/3\.15\.0\/([^"]+)"/g, `src="${JS_DIR}$1"`)
    .replace(/src="https:\/\/cdn\.prod\.website-files\.com\/[^"]+\/js\/(webflow\.[^"]+\.js)"/g, `src="${JS_DIR}$1"`)
    .replace(/src="https:\/\/d3e54v103j8qbb\.cloudfront\.net\/js\/jquery-3\.5\.1\.min\.dc5e7f18c8\.js[^"]*"/, `src="${JS_DIR}jquery-3.5.1.min.js"`)
    .replace(/src="https:\/\/cdn\.jsdelivr\.net\/npm\/lenis@1\.2\.3\/dist\/lenis\.min\.js"/, `src="${JS_DIR}lenis.min.js"`)
    .replace(/src="https:\/\/cdn\.jsdelivr\.net\/npm\/@finsweet\/attributes@2\/attributes\.js"/, `src="${JS_DIR}attributes.js"`)
    .replace(/src="https:\/\/player\.vimeo\.com\/api\/player\.js"/g, `src="${JS_DIR}player.js"`)
    .replace(/ integrity="[^"]*"/g, '').replace(/ crossorigin="anonymous"/g, '');

  // Paragon socials + Webflow domain/comment -> Steadfast
  h = h.replace(/https:\/\/vimeo\.com\/paragonproductionsin/g, 'https://www.youtube.com/@steadfastclub')
    .replace(/https:\/\/www\.instagram\.com\/paragon\.productions\//g, 'https://www.instagram.com/steadfastclub/')
    .replace(/https:\/\/www\.linkedin\.com\/(company\/paragonproductions|authwall[^"]*)/g, 'https://www.tiktok.com/@steadfastclub')
    .replace(/ data-wf-domain="[^"]*"/, '').replace(/<!-- Last Published[^>]*-->/, '')
    .replace(/https:\/\/merch\.paragonproductions\.co\/?/g, '/join').replace(/ data-wf-item-slug="[^"]*"/, '')
    .replace(/mailto:(hello|jack|jacob|pr)@paragonproductions\.co/g, (m, u) => `mailto:${{ hello: 'hello', jack: 'sam', jacob: 'jordan', pr: 'teams' }[u]}@steadfastclub.com`);

  // forms: Paragon's forms post to their Mailchimp list and (via data-wf-site) their Webflow inbox.
  // Demo site: no action, no site id; assets/js/steadfast.js shows the success state without sending anything.
  h = h.replace(/(<form[^>]*?) action="[^"]*"/g, '$1').replace(/ data-wf-site="[^"]*"/, '')
    .replace('</body>', `<script src="${JS_DIR}steadfast.js"></script></body>`);

  // internal links -> Steadfast routes
  h = h.replace(/href="(?:https:\/\/www\.paragonproductions\.co)?(\/[^"#?]*)([^"]*)"/g, (m, p, rest) => {
    const r = route(p);
    return r ? `href="${r}${rest}"` : m;
  });

  h = swapMedia(h);
  h = swapSvgs(h);

  // colors used inline (style attributes, embeds)
  h = recolor(h);
  h = h.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (m, a, css, c) => a + fixCh(css) + c);

  // text + alt text
  h = applyText(h);
  h = fixAlts(h);

  // head: drop Paragon's SEO/meta/icons + structured data, add Steadfast fonts/overrides and our SEO layer
  const paragonTitle = (h.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1];
  h = h.replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta [^>]*(name|property)="(description|og:[a-z:]+|twitter:[a-z:]+)"[^>]*\/?>/g, '')
    .replace(/<link [^>]*rel="(canonical|shortcut icon|apple-touch-icon|preconnect)"[^>]*\/?>/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  h = h.replace(/(<link[^>]*href="\/assets\/css\/lenis\.css"[^>]*>)/, `$1<link href="${CSS_DIR}steadfast-fonts.css" rel="stylesheet" type="text/css"/><link href="${CSS_DIR}steadfast.css" rel="stylesheet" type="text/css"/>`);
  const head = headFor(urlPath, paragonTitle, h);
  h = h.replace('<meta charset="utf-8"/>', '<meta charset="utf-8"/>' + head.html);
  h = h.replace('<html ', '<html lang="en" ').replace(/<html lang="en" ([^>]*)lang="[^"]*"/, '<html lang="en" $1');

  const left = (h.match(/intellimize|googletagmanager|gtag\(/gi) || []).length;
  if (left) console.warn(`  ${src}: ${left} tracker refs left`);
  write(outFile(urlPath), h);
  return urlPath;
}

const built = PAGES.map(buildPage);
console.log('built', built.length, 'pages');
if (missingMedia.size) console.warn('unmapped Paragon images:', [...missingMedia].join(' '));
fs.writeFileSync(path.join(__dirname, 'untranslated.txt'), [...untranslated].sort((a, b) => b[1] - a[1]).map(([t, n]) => n + '\t' + t).join('\n'));
console.log('untranslated text nodes:', untranslated.size, '(tools/untranslated.txt)');
