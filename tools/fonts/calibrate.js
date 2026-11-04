// Real-text calibration: sets every text element on one line, sums its width per font face on Paragon's page and on ours,
// and prints the width ratio per face. Multiply that face's size-adjust in fit-fonts.js by the ratio.
// node tools/fonts/calibrate.js https://www.paragonproductions.co/ http://localhost:8820/
const { chromium } = require('playwright');
const [THEIRS, OURS] = process.argv.slice(2);
const collect = async (b, url) => {
  const p = await b.newPage({ viewport: { width: 1512, height: 696 } });
  await p.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  await p.waitForTimeout(4000);
  const r = await p.evaluate(() => {
    const st = document.createElement('style'); st.textContent = '*{white-space:nowrap!important}'; document.head.append(st);
    const sums = {};
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n, i = 0;
    while ((n = walker.nextNode())) {
      const t = n.textContent.trim(); if (t.length < 2) continue;
      const el = n.parentElement; if (!el || el.closest('script,style,svg,.loading_wrap')) continue;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const range = document.createRange(); range.selectNodeContents(n);
      const w = range.getBoundingClientRect().width; if (!w) continue;
      const key = `${cs.fontFamily.split(',')[0].replace(/"/g, '')} ${cs.fontWeight} ${cs.fontStyle}`;
      // weight by element index so both pages compare the same text elements
      (sums[key] = sums[key] || {})[i++ + ':' + t.slice(0, 20)] = w / parseFloat(cs.fontSize);
    }
    return sums;
  });
  await p.close();
  return r;
};
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const a = await collect(b, THEIRS), o = await collect(b, OURS);
  for (const k of Object.keys(a)) {
    if (!o[k]) { console.log(k, 'missing on ours'); continue; }
    // match by text content, not by index (ours may differ slightly in node order)
    const byText = m => { const r = {}; for (const [key, w] of Object.entries(m)) { const t = key.split(':').slice(1).join(':'); r[t] = (r[t] || 0) + w; } return r; };
    const A = byText(a[k]), O = byText(o[k]);
    let sa = 0, so = 0, n = 0;
    for (const t of Object.keys(A)) if (O[t]) { sa += A[t]; so += O[t]; n++; }
    console.log(k.padEnd(30), 'texts', String(n).padStart(4), 'ratio theirs/ours', (sa / so).toFixed(4));
  }
  await b.close();
})();
