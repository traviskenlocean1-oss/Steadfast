// Downloads the Steadfast clips from Pexels (free license), encodes them for the web and pulls extra stills.
//   clips: 3 per program (from that program's shoot), 1 per coach, plus general -> assets/video/<name>.mp4
//   encode: H.264 High@4.0 (iOS Safari limit), yuv420p, no audio, faststart, 10s, 1280w (hero 1920w)
//   stills: 3 frames per clip -> tools/stock/frames/<vNNN>-<k>.jpg (plan.js adds them to the clip's shoot)
// node tools/media/clips.js
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '../..');
const RAW = path.join(__dirname, '../stock/clips'), FRAMES = path.join(__dirname, '../stock/frames'), OUT = path.join(ROOT, 'assets/video');
for (const d of [RAW, FRAMES, OUT]) fs.mkdirSync(d, { recursive: true });
const ids = Object.fromEntries(fs.readFileSync(path.join(__dirname, 'pexels-video-ids.txt'), 'utf8').trim().split('\n').map(l => l.split(' ')).map(([n, id]) => ['v' + n, id]));
const series = JSON.parse(fs.readFileSync(path.join(__dirname, 'series.json'), 'utf8'));
const landscape = s => { const [w, h] = execFileSync('magick', ['identify', '-format', '%w %h', path.join(__dirname, '../stock/posters', s + '.jpg')]).toString().split(' ').map(Number); return w > h; };

const CLIPS = [];
for (const [k, v] of Object.entries(series)) {
  if (k[0] === '_') continue;
  const coach = k.startsWith('coach:');
  const picks = v.filter(s => s[0] === 'v' && ids[s]).filter(landscape).slice(0, coach ? 1 : 3);
  picks.forEach((s, i) => CLIPS.push({ name: `${k.replace('coach:', 'coach-')}-${i + 1}`, s, series: k }));
}
// general clips for the reels on coach pages and the home hero
['v002', 'v026', 'v039', 'v050', 'v053', 'v087', 'v133'].forEach((s, i) => CLIPS.push({ name: `general-${i + 1}`, s, series: 'general' }));
CLIPS.push({ name: 'hero', s: 'v045', series: 'team-conditioning', w: 1920 });

const sh = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const manifest = [];
for (const c of CLIPS) {
  const id = ids[c.s];
  const raw = path.join(RAW, c.s + '.mp4');
  if (!fs.existsSync(raw)) sh('curl', ['-sfL', '-A', 'Mozilla/5.0', `https://www.pexels.com/download/video/${id}/`, '-o', raw]);
  const dur = parseFloat(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', raw]));
  const start = Math.max(0, Math.min(2, dur - 10.5));
  const out = path.join(OUT, c.name + '.mp4');
  const W = c.w || 1280;
  if (!fs.existsSync(out)) sh('ffmpeg', ['-y', '-v', 'error', '-ss', String(start), '-t', '10', '-i', raw, '-an',
    '-vf', `scale=${W}:-2:flags=lanczos,fps=25`, '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p',
    '-crf', W > 1280 ? '24' : '26', '-preset', 'slow', '-movflags', '+faststart', out]);
  // extra stills from the full-res source, spread over the clip
  for (const k of [1, 2, 3]) {
    const f = path.join(FRAMES, `${c.s}-${k}.jpg`);
    if (!fs.existsSync(f)) sh('ffmpeg', ['-y', '-v', 'error', '-ss', String((dur * k) / 4), '-i', raw, '-frames:v', '1', '-vf', 'scale=2048:-2', '-q:v', '3', f]);
  }
  const kb = Math.round(fs.statSync(out).size / 1024);
  manifest.push({ ...c, id, file: `/assets/video/${c.name}.mp4`, kb });
  console.log(c.name.padEnd(28), c.s, id, kb + 'KB');
}
fs.writeFileSync(path.join(__dirname, 'clips.json'), JSON.stringify(manifest, null, 1));
