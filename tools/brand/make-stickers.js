// Renders every [data-out] element of tools/brand/stickers.html to assets/brand/<name>.png (transparent) + .webp
// node tools/brand/make-stickers.js [name ...]
const { chromium } = require('playwright');
const path = require('path');
const { execFileSync } = require('child_process');
const OUT = path.join(__dirname, '../../assets/brand');
const only = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 2000, height: 2000 } });
  await p.goto('file:///' + path.join(__dirname, 'stickers.html').split(path.sep).join('/'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  for (const name of await p.$$eval('[data-out]', els => els.map(e => e.dataset.out))) {
    if (only.length && !only.includes(name)) continue;
    const png = path.join(OUT, name + '.png');
    await (await p.$(`[data-out="${name}"]`)).screenshot({ path: png, omitBackground: true });
    if (!['favicon', 'webclip', 'og'].includes(name)) execFileSync('magick', [png, '-quality', '88', path.join(OUT, name + '.webp')]);
    console.log(name);
  }
  await b.close();
})();
