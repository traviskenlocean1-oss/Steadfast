// Steadfast videos: every Paragon Vimeo file -> a free Mixkit clip (Mixkit License: free for commercial use, no attribution).
//   role: program page -> that program's clips, coach page / roster -> that coach, home hero -> hero, rest -> general
//   encode: H.264 High@4.0 (iOS Safari), yuv420p, no audio, faststart, 10s loop, 1280w (hero 1920w)
//   -> assets/video/<name>.mp4 and tools/media/video-map.json { vimeoId: "/assets/video/..." }
// node tools/media/videos.js
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '../..');
const RAW = path.join(__dirname, '../stock/mixkit/raw'), OUT = path.join(ROOT, 'assets/video');
for (const d of [RAW, OUT]) fs.mkdirSync(d, { recursive: true });
const POOLS = {
  hero: [52089],
  'athlete-performance': [40234, 40245, 40250, 40238, 44448, 40249],
  '5am-club': [52102, 52104, 52106, 52108, 52110, 52091],
  'engine-builder': [32799, 32805, 606, 609, 719, 722],
  'team-conditioning': [725, 727, 731, 52316, 52317, 726],
  'barbell-club': [40248, 52094, 52097, 40241, 52099, 23450],
  'strength-foundations': [52111, 52112, 52118, 42898, 5048, 40780],
  'mobility-recovery': [46656, 4831, 597, 23582, 780, 583],
  'lift-for-life': [23929, 40766, 40881, 44410, 46653, 2002],
  'coach-marcus-hale': [52084, 52097, 40248],
  'coach-dre-collins': [40948, 40957, 40962, 40969],
  'coach-sam-kessler': [40951, 40967, 40958, 40961],
  'coach-nia-brooks': [46656, 42898, 4851, 780],
  general: [40954, 40964, 40968, 45881, 4596, 40985, 23056, 32813],
};
const WORK = { 'bake-it-till-you-make-it': 'barbell-club', 'closer-to-home': 'strength-foundations', 'doing-great-things-together': 'team-conditioning', 'electric-ideas': 'engine-builder',
  'i-am-ready-karts-to-cars': 'athlete-performance', 'playing-in-the-dark': '5am-club', 'take-your-time': 'mobility-recovery', 'we-fight-cancer-here': 'lift-for-life' };
const DIRECTOR = { 'dylan-bradshaw': 'marcus-hale', 'jacob-frost': 'dre-collins', 'jack-linderman': 'sam-kessler', 'brian-myers': 'nia-brooks' };
const vids = JSON.parse(fs.readFileSync(path.join(__dirname, 'videos.json'), 'utf8'));
// home roster + coaches hero list the directors in this order
const ROSTER = ['marcus-hale', 'dre-collins', 'sam-kessler', 'nia-brooks'];
let rosterI = 0;
const roleOf = v => {
  const pages = v.uses.map(u => u.split('@')[0]), secs = v.uses.map(u => u.split('@')[1]);
  if (secs.includes('home-hero_wrap')) return 'hero';
  // a program's own page (not its preview in another page's "next project" / list) decides whose clip it is
  const own = v.uses.find(u => /^works\//.test(u) && !/@(next-project|work-list)_wrap$/.test(u));
  if (own && WORK[own.split('@')[0].slice(6)]) return WORK[own.split('@')[0].slice(6)];
  const w = pages.map(p => p.match(/^works\/(.+)$/)).find(Boolean);
  if (w && WORK[w[1]] && v.uses.every(u => u.startsWith(w[0]) || !/^works\//.test(u))) return WORK[w[1]];
  const d = pages.map(p => p.match(/^directors\/(.+)$/)).find(Boolean);
  if (d && DIRECTOR[d[1]] && pages.every(p => p === d[0] || !/^directors\//.test(p))) return 'coach-' + DIRECTOR[d[1]];
  if (secs.some(s => s === 'home-directors_wrap' || s === 'directors-hero_wrap')) return 'coach-' + ROSTER[rosterI++ % 4];
  if (w && WORK[w[1]]) return WORK[w[1]];
  return 'general';
};
const sh = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const cursor = {}, made = {}, map = {};
for (const v of vids) {
  const role = roleOf(v);
  const pool = POOLS[role];
  const i = cursor[role] = (cursor[role] ?? -1) + 1;
  const clip = pool[i % pool.length];
  const W = role === 'hero' ? 1920 : 1280;
  const name = `${role}-${clip}`;
  if (!made[name]) {
    const raw = path.join(RAW, `${clip}-${W === 1920 ? 1080 : 720}.mp4`);
    if (!fs.existsSync(raw)) sh('curl', ['-sfL', '-o', raw, `https://assets.mixkit.co/videos/${clip}/${clip}-${W === 1920 ? 1080 : 720}.mp4`]);
    const out = path.join(OUT, name + '.mp4');
    if (!fs.existsSync(out)) {
      const dur = parseFloat(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', raw]));
      sh('ffmpeg', ['-y', '-v', 'error', '-ss', String(Math.max(0, Math.min(1, dur - 10))), '-t', String(Math.min(10, dur)), '-i', raw, '-an',
        '-vf', `scale=${W}:-2:flags=lanczos,fps=25`, '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p',
        '-crf', W > 1280 ? '24' : '27', '-preset', 'slow', '-movflags', '+faststart', out]);
    }
    made[name] = Math.round(fs.statSync(out).size / 1024);
    console.log(name.padEnd(34), made[name] + 'KB');
  }
  map[v.id] = `/assets/video/${name}.mp4`;
}
fs.writeFileSync(path.join(__dirname, 'video-map.json'), JSON.stringify(map, null, 1));
console.log('videos', Object.keys(map).length, 'clips', Object.keys(made).length, 'total', Math.round(Object.values(made).reduce((a, b) => a + b, 0) / 1024) + 'MB');
