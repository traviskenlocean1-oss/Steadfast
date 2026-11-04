// Gives every Paragon photo a Steadfast still and renders it at Paragon's exact aspect ratio.
//   role: program page -> that program's shoot (series.json), coach page/portrait -> that coach, rest -> general pool
//   output: assets/img/<role>-<n>.webp (long side <= 2048) + -800.webp, and tools/media/map.json { paragonId: "/assets/img/..." }
// Graphics (stickers, logos, banner, favicon) are mapped by hand in build.js, polaroids by tools/media/polaroids.js.
// node tools/media/plan.js [--dry]
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '../..');
const STOCK = path.join(__dirname, '../stock');
const OUT = path.join(ROOT, 'assets/img');
const DRY = process.argv.includes('--dry');
fs.mkdirSync(OUT, { recursive: true });
const inv = JSON.parse(fs.readFileSync(path.join(__dirname, 'inventory.json'), 'utf8'));
const series = JSON.parse(fs.readFileSync(path.join(__dirname, 'series.json'), 'utf8'));
const GRAPHICS = new Set(['68c3328c5da6b5bef7d9b3af', '68c3328ca3d8c04b03ac2f33', '68c3328ca9b8690ce0675ec6', '68c3328d3b870fc72d0e251b', '68c3349d01c75df68bb05c14',
  '68cf154d924f24b941a05537', '68cf159c1cfd33396775dd06', '68d44bedf755e44463dc9905', '68d44bee28c0cf20a66ce217', '68d6097060824f7077fea08c', '68e5469686d9dd58f4a26ca5',
  '68e91d499774ec46b981274a', '68e91d57ba1aafbfffd97199', '68ed28d85e27801e273cc724', '68f1af34b98abaef98911341', '68f1b0bee648251b59835699', '68f1adaeb46bd2b5590a880d',
  '69179358d89d0aa75afc63a2', '6918cec6c08fb4be3df1b7bf', '6918cf0b6b91791f135efd3a', '6918d13c95dd2d43bc182135', '68d45941ee3ea93a3c90363f']);
const WORK = { 'bake-it-till-you-make-it': 'barbell-club', 'closer-to-home': 'strength-foundations', 'doing-great-things-together': 'team-conditioning', 'electric-ideas': 'engine-builder',
  'i-am-ready-karts-to-cars': 'athlete-performance', 'playing-in-the-dark': '5am-club', 'take-your-time': 'mobility-recovery', 'we-fight-cancer-here': 'lift-for-life' };
const DIRECTOR = { 'dylan-bradshaw': 'marcus-hale', 'jacob-frost': 'dre-collins', 'jack-linderman': 'sam-kessler', 'brian-myers': 'nia-brooks' };
const PORTRAIT_NAME = [[/Dylan/i, 'marcus-hale'], [/Brian/i, 'nia-brooks'], [/Jacob/i, 'dre-collins'], [/3E98915F|Jack/i, 'sam-kessler']];

// source stills with orientation
const srcFile = s => path.join(STOCK, s[0] === 'v' ? 'posters' : 'photos', s + '.jpg');
const dimsOf = {};
const dim = s => dimsOf[s] || (dimsOf[s] = execFileSync('magick', ['identify', '-format', '%w %h', srcFile(s)]).toString().split(' ').map(Number));
const all = [...fs.readdirSync(path.join(STOCK, 'posters')).map(f => f.replace('.jpg', '')).filter(s => !['v084', 'v029'].includes(s)), ...fs.readdirSync(path.join(STOCK, 'photos')).map(f => f.replace('.jpg', ''))];
const inSeries = new Set(Object.entries(series).filter(([k]) => k[0] !== '_').flatMap(([, v]) => v));
const pools = { general: all.filter(s => !inSeries.has(s)) };
for (const [k, v] of Object.entries(series)) if (k[0] !== '_') pools[k] = v.filter(s => fs.existsSync(srcFile(s)));

function roleOf(it) {
  const pages = it.uses.map(u => u.page);
  if (it.uses.some(u => u.sec === 'home-gallery_wrap')) return 'polaroid';
  const pn = PORTRAIT_NAME.find(([re]) => re.test(it.file));
  if (pn) return 'coach:' + pn[1];
  const w = pages.map(p => p.match(/^works\/(.+)$/)).find(Boolean);
  if (w && WORK[w[1]]) return WORK[w[1]];
  const d = pages.map(p => p.match(/^directors\/(.+)$/)).find(Boolean);
  if (d && DIRECTOR[d[1]]) return 'coach:' + DIRECTOR[d[1]];
  return 'general';
}

// pick a source matching orientation: unused still from the role's shoot, then an unused general still,
// then the role's least-used still again (a reuse gets another crop position + mirroring)
const used = {};
function pick(role, ratio) {
  const want = ratio < 0.9 ? 'P' : ratio > 1.15 ? 'L' : 'S';
  const fits = s => { const [w, h] = dim(s), r = w / h; return want === 'P' ? r < 1 : want === 'L' ? r > 1 : true; };
  const own = (pools[role] || []).filter(fits), gen = pools.general.filter(fits);
  const s = own.find(x => !used[x]) || gen.find(x => !used[x])
    || [...(own.length ? own : gen)].sort((a, b) => used[a] - used[b])[0];
  if (!s) throw new Error('no source for ' + role);
  const pass = used[s] || 0;
  used[s] = pass + 1;
  return { s, pass };
}
const GRAV = ['center', 'north', 'south', 'east', 'west'];

const map = {}, report = {};
let n = 0;
for (const it of inv) {
  if (GRAPHICS.has(it.id) || !it.dims) continue;
  const role = roleOf(it);
  if (role === 'polaroid') continue;
  const [tw, th] = it.dims;
  const { s, pass } = pick(role, tw / th);
  const scale = Math.min(1, 2048 / Math.max(tw, th));
  const W = Math.round(tw * scale), H = Math.round(th * scale);
  const name = `${role.replace('coach:', 'coach-')}-${String(++n).padStart(3, '0')}`;
  const out = path.join(OUT, name + '.webp');
  if (!DRY && !fs.existsSync(out)) {
    const args = [srcFile(s), '-resize', `${W}x${H}^`, '-gravity', GRAV[pass % GRAV.length], '-extent', `${W}x${H}`];
    if (pass % 2) args.push('-flop');
    execFileSync('magick', [...args, '-strip', '-quality', '78', out]);
    if (W > 800) execFileSync('magick', [out, '-resize', '800x', '-quality', '76', path.join(OUT, name + '-800.webp')]);
  }
  map[it.id] = { src: `/assets/img/${name}.webp`, small: W > 800 ? `/assets/img/${name}-800.webp` : null, w: W, h: H, from: s };
  (report[role] = report[role] || []).push(s + (pass ? '*' + pass : ''));
}
fs.writeFileSync(path.join(__dirname, 'map.json'), JSON.stringify(map, null, 1));
for (const [r, v] of Object.entries(report)) console.log(r.padEnd(26), String(v.length).padStart(3), 'images,', new Set(v.map(x => x.split('*')[0])).size, 'sources', v.filter(x => x.includes('*')).length, 'reused');
console.log('total', Object.keys(map).length);
