// Lists every Paragon video (Vimeo progressive file) with the pages/sections that use it -> tools/media/videos.json
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '../src');
const v = {};
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { walk(p); continue; }
    const page = path.relative(SRC, p).split(path.sep).join('/').replace(/\.html$/, '');
    const h = fs.readFileSync(p, 'utf8');
    const secs = [...h.matchAll(/<(section|footer)[^>]*class="([^"]+)"/g)].map(m => [m.index, m[2].split(' ')[0]]);
    for (const m of h.matchAll(/player\.vimeo\.com\/progressive_redirect\/playback\/(\d+)\/rendition\/(\d+p)/g)) {
      let s = ''; for (const [k, c] of secs) if (k < m.index) s = c;
      const o = v[m[1]] = v[m[1]] || { res: m[2], uses: new Set() };
      o.uses.add(page + '@' + s);
    }
  }
})(SRC);
const out = Object.entries(v).map(([id, o]) => ({ id, res: o.res, n: o.uses.size, uses: [...o.uses] }));
fs.writeFileSync(path.join(__dirname, 'videos.json'), JSON.stringify(out, null, 1));
const bySec = {};
for (const o of out) for (const u of o.uses) { const k = u.split('@')[1]; bySec[k] = (bySec[k] || new Set()).add(o.id); }
console.log(out.length, 'videos');
for (const [k, s] of Object.entries(bySec)) console.log(String(s.size).padStart(3), k);
