// Lists every unique visible text node across tools/src pages (for writing steadfast-text.json)
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, 'src');
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : f.endsWith('.html') && files.push(p); } })(SRC);
const rel = f => path.relative(SRC, f).split(path.sep).join('/');
const count = {};
const add = (t, f) => (count[t] = count[t] || new Set()).add(rel(f));
for (const f of files) {
  let h = fs.readFileSync(f, 'utf8');
  h = h.replace(/<head[\s\S]*?<\/head>/, '').replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, '');
  for (const m of h.matchAll(/>([^<>]+)</g)) {
    const t = m[1].replace(/\s+/g, ' ').trim();
    if (!t || /^(&nbsp;|[\s\-–—/|·•+]+)$/.test(t)) continue;
    add(t, f);
  }
  for (const m of h.matchAll(/(?:alt|placeholder|aria-label|value)="([^"]+)"/g)) {
    const t = m[1].trim(); if (t) add('@' + t, f);
  }
}
const out = Object.entries(count).map(([t, s]) => ({ t, n: s.size, p: [...s].slice(0, 3) }));
fs.writeFileSync(path.join(__dirname, 'text-inventory.json'), JSON.stringify(out, null, 1));
console.log('unique strings', out.length, 'chars', out.reduce((a, x) => a + x.t.length, 0));
