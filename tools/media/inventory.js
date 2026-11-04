// Lists every Paragon image by file id with where it's used (page, section, class) and its size -> tools/media/inventory.json
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '../src');
const dims = {};
for (const l of fs.readFileSync(path.join(__dirname, '../ref-dims.txt'), 'utf8').split('\n')) {
  const m = l.match(/^(\d+) (\d+) ([0-9a-f]{24})_/); if (m) dims[m[3]] = [+m[1], +m[2]];
}
const items = {};
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { walk(p); continue; }
    const page = path.relative(SRC, p).split(path.sep).join('/').replace(/\.html$/, '');
    const h = fs.readFileSync(p, 'utf8').replace(/<head[\s\S]*?<\/head>/, '');
    // section of each position: last section/footer class opened before it
    const secs = [...h.matchAll(/<(section|footer)[^>]*class="([^"]+)"/g)].map(m => [m.index, m[2].split(' ')[0]]);
    const secAt = i => { let s = ''; for (const [k, c] of secs) if (k < i) s = c; return s; };
    for (const m of h.matchAll(/<img [^>]*>/g)) {
      const tag = m[0];
      const src = (tag.match(/ src="([^"]+)"/) || [])[1] || '';
      const id = (src.match(/\/([0-9a-f]{24})_/) || [])[1];
      if (!id) continue;
      const cls = (tag.match(/ class="([^"]+)"/) || [])[1] || '';
      const alt = (tag.match(/ alt="([^"]*)"/) || [])[1] || '';
      const it = items[id] = items[id] || { id, file: decodeURIComponent(src.split('/').pop()), dims: dims[id], uses: [] };
      it.uses.push({ page, sec: secAt(m.index), cls: cls.split(' ')[0], alt: alt.slice(0, 50), pos: m.index });
    }
  }
})(SRC);
const list = Object.values(items);
fs.writeFileSync(path.join(__dirname, 'inventory.json'), JSON.stringify(list, null, 1));
console.log('images', list.length);
const bySec = {};
for (const it of list) { const k = it.uses[0].sec + ' / ' + it.uses[0].cls; bySec[k] = (bySec[k] || 0) + 1; }
console.log(Object.entries(bySec).sort((a, b) => b[1] - a[1]).map(([k, n]) => n + '  ' + k).join('\n'));
