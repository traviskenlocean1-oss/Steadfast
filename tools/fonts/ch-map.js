// Paragon sizes many text boxes in ch (the width of "0" in the element's font). Our stand-ins have a different "0",
// so those boxes would change width and re-wrap. This finds, on Paragon's live pages, which font each ch rule's
// elements render in, measures Paragon's "0" in that font, and writes tools/fonts/ch-map.json:
//   { "<selector>": <em per ch> }  -> build.js rewrites "Nch" in that rule to N * value em (identical box width).
// node tools/fonts/ch-map.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const VENDOR = path.join(__dirname, '../vendor'), SRC = path.join(__dirname, '../src');
const C = 'https://cdn.prod.website-files.com/68be24b22b086720602bcd38/';
const ORIG = {
  'Review Condensed': [C + '68be25b0212febed814fe2dc_ReviewCondensed-Bold-Web.woff2', 700],
  'Simplon Norm': [C + '68be33b5a310dc05acaa16fa_SimplonNorm-Bold-WebXL.ttf', 700],
  Roobert: [C + '68be26ed752851d41ac7ca69_Roobert-Regular.otf', 400],
  'Proxima Nova': [C + '68be272689cac2bb93719a3f_Proxima%20Nova%20Regular.ttf', 400],
};
// every selector that has a ch value somewhere (css files + inline <style> in pages)
const sources = [...fs.readdirSync(VENDOR).filter(f => f.endsWith('.css')).map(f => fs.readFileSync(path.join(VENDOR, f), 'utf8'))];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else sources.push(...[...fs.readFileSync(p, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1])); } })(SRC);
const selectors = new Set();
for (const s of sources) for (const m of s.matchAll(/([^{}]+)\{([^{}]*)\}/g)) if (/[\d.]ch\b/.test(m[2])) m[1].split(',').forEach(x => selectors.add(x.trim()));
const pages = [];
(function walk(d, pre) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p, pre + f + '/'); else pages.push(pre + f.replace(/\.html$/, '').replace(/^index$/, '')); } })(SRC, '');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1512, height: 696 } });
  const fontOf = {};
  for (const pg of pages) {
    await p.goto('https://www.paragonproductions.co/' + pg, { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {});
    await p.waitForTimeout(1500);
    const found = await p.evaluate(sels => {
      const o = {};
      for (const s of sels) { let el; try { el = document.querySelector(s.replace(/::?[a-z-]+$/, '')); } catch (e) { continue; } if (el) o[s] = getComputedStyle(el).fontFamily.split(',')[0].replace(/"/g, '').trim(); }
      return o;
    }, [...selectors]);
    for (const [s, f] of Object.entries(found)) (fontOf[s] = fontOf[s] || new Set()).add(f);
  }
  const zero = await p.evaluate(async ORIG => {
    const o = {};
    for (const [fam, [url, w]] of Object.entries(ORIG)) {
      const f = new FontFace('Z' + fam, `url("${url}")`, { weight: String(w) }); document.fonts.add(await f.load());
      const c = document.createElement('canvas').getContext('2d'); c.font = `${w} 100px "Z${fam}"`;
      o[fam] = c.measureText('0').width / 100;
    }
    return o;
  }, ORIG);
  const map = {};
  for (const [s, fams] of Object.entries(fontOf)) {
    const f = [...fams][0];
    if (fams.size > 1) console.warn('mixed fonts for', s, [...fams]);
    if (zero[f]) map[s] = +zero[f].toFixed(4); else console.warn('unknown font', f, 'for', s);
  }
  const missing = [...selectors].filter(s => !(s in map));
  console.log('ch selectors', selectors.size, 'mapped', Object.keys(map).length, 'not on any page:', missing.join(' | '));
  console.log('zero em:', zero);
  fs.writeFileSync(path.join(__dirname, 'ch-map.json'), JSON.stringify({ zero, map }, null, 1));
  await b.close();
})();
