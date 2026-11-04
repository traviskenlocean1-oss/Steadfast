// Hero banner: cream panel with STEADFAST knocked out (video shows through), same size + letter box as Paragon's
// node tools/brand/make-banner.js  -> assets/brand/hero-banner.png (convert to webp after)
const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '../../assets/brand/hero-banner.png');
const W = 4320, H = 951, BOX = { x: 144, y: 141, w: 4032, h: 700 };
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage();
  await p.setContent(`<link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@800&display=block" rel="stylesheet"><canvas id=c width=${W} height=${H}></canvas>`);
  await p.evaluate(() => document.fonts.load('800 400px Oxanium'));
  const png = await p.evaluate(({ W, H, BOX }) => {
    const c = document.getElementById('c'), x = c.getContext('2d');
    x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, W, H);
    x.font = '800 1000px Oxanium';
    const m = x.measureText('STEADFAST');
    const tw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, th = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    x.globalCompositeOperation = 'destination-out';
    x.save(); x.translate(BOX.x, BOX.y); x.scale(BOX.w / tw, BOX.h / th);
    x.fillText('STEADFAST', m.actualBoundingBoxLeft, m.actualBoundingBoxAscent); x.restore();
    return c.toDataURL('image/png');
  }, { W, H, BOX });
  require('fs').writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64'));
  await b.close();
})();
