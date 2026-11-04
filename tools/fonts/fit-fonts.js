// Fits each free stand-in font to the Paragon font it replaces, measured in Chrome:
// The sample strings give a first fit; k corrects it from the real page text (tools/fonts/calibrate.js).
//   size-adjust      = their text width / our text width   (same line lengths, same wraps)
//   ascent/descent   = their line metrics                   (same baseline inside every line box)
// Paragon's font files are loaded from their CDN for measuring only; they are never shipped.
// Run: node tools/fonts/fit-fonts.js   -> prints the @font-face block for assets/css/steadfast-fonts.css
const { chromium } = require('playwright');
const path = require('path');
const C = 'https://cdn.prod.website-files.com/68be24b22b086720602bcd38/';
const LOCAL = 'file:///' + path.join(__dirname, '../../assets/fonts/').split(path.sep).join('/');
const UPPER = 'FEATURED WORK GOT SOMETHING WORTH CHASING ALWAYS IN PURSUIT DIRECTORS TESTIMONIALS STUDIO UPDATES';
const MIXED = 'Great work starts with great crews. We build environments where trust, respect, and collaboration power the process from first call to final cut.';
const PAIRS = [
  { family: 'Review Condensed', weight: 700, style: 'normal', orig: C + '68be25b0212febed814fe2dc_ReviewCondensed-Bold-Web.woff2', ours: 'barlow-condensed-800.woff2', ourWeight: 800, text: UPPER, k: 0.9887 },
  { family: 'Simplon Norm', weight: 700, style: 'normal', orig: C + '68be33b5a310dc05acaa16fa_SimplonNorm-Bold-WebXL.ttf', ours: 'archivo-narrow-700.woff2', ourWeight: 700, text: UPPER + ' ' + MIXED, k: 0.952 },
  { family: 'Roobert', weight: 400, style: 'normal', orig: C + '68be26ed752851d41ac7ca69_Roobert-Regular.otf', ours: 'hanken-grotesk.woff2', ourWeight: 400, text: MIXED, k: 1.006 },
  { family: 'Roobert', weight: 600, style: 'normal', orig: C + '68be26ed3d85b2271381d98f_Roobert-SemiBold.otf', ours: 'hanken-grotesk.woff2', ourWeight: 600, text: MIXED },
  { family: 'Roobert', weight: 400, style: 'italic', orig: C + '68be26ed477f85128e1ae27f_Roobert-RegularItalic.otf', ours: 'hanken-grotesk-italic.woff2', ourWeight: 400, text: MIXED },
  { family: 'Roobert', weight: 600, style: 'italic', orig: C + '68be26ed0aa894f0cc780df4_Roobert-SemiBoldItalic.otf', ours: 'hanken-grotesk-italic.woff2', ourWeight: 600, text: MIXED },
  ...[[100, 'Thin'], [300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'Semibold']].map(([w, n]) => (
    { family: 'Proxima Nova', weight: w, style: 'normal', orig: C + '68be2726' + { 100: '9ad2629c531299ee', 300: '059e5d6ef4b60bf3', 400: '89cac2bb93719a3f', 500: 'e61be6148088469d', 600: '1d6caefad4b2fc0a' }[w] + '_Proxima%20Nova%20' + n + '.ttf', ours: 'montserrat.woff2', ourWeight: w, text: MIXED })),
];
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage();
  await p.goto(LOCAL);
  const res = await p.evaluate(async ({ PAIRS, LOCAL }) => {
    // line metrics as Chrome uses them: height of a line-height:normal box and the baseline inside it, per 100px
    const metrics = async (url, weight, style, fam, extra = {}) => {
      const f = new FontFace(fam, `url("${url}")`, { weight: String(weight), style, ...extra });
      document.fonts.add(await f.load());
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;white-space:nowrap;font:${style} ${weight} 100px/normal "${fam}"`;
      const s = document.createElement('span'); const mark = document.createElement('i');
      mark.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      d.append(s, mark); document.body.append(d);
      return t => { s.textContent = t; const r = d.getBoundingClientRect(); return { w: s.getBoundingClientRect().width, h: r.height, base: mark.getBoundingClientRect().top - r.top }; };
    };
    const out = [];
    for (const [i, x] of PAIRS.entries()) {
      const theirs = (await metrics(x.orig, x.weight, x.style, 'T' + i))(x.text);
      const plain = (await metrics(LOCAL + x.ours, x.ourWeight, x.style, 'O' + i))(x.text);
      const sa = theirs.w / plain.w * (x.k || 1); // k: real-text correction from tools/fonts/calibrate.js
      const asc = theirs.base / 100, desc = (theirs.h - theirs.base) / 100;
      // overrides are percentages of the adjusted size, so divide by size-adjust
      const fit = { 'size-adjust': (sa * 100).toFixed(2) + '%', 'ascent-override': (asc / sa * 100).toFixed(2) + '%', 'descent-override': (desc / sa * 100).toFixed(2) + '%', 'line-gap-override': '0%' };
      const check = (await metrics(LOCAL + x.ours, x.ourWeight, x.style, 'F' + i, { sizeAdjust: fit['size-adjust'], ascentOverride: fit['ascent-override'], descentOverride: fit['descent-override'], lineGapOverride: '0%' }))(x.text);
      out.push({ ...x, fit, theirs, check });
    }
    return out;
  }, { PAIRS, LOCAL });
  for (const r of res) console.error(`${r.family} ${r.weight} ${r.style}: width ${r.theirs.w.toFixed(0)} -> ${r.check.w.toFixed(0)}, line ${r.theirs.h.toFixed(1)}/${r.check.h.toFixed(1)}, baseline ${r.theirs.base.toFixed(1)}/${r.check.base.toFixed(1)}`);
  console.log('/* Free stand-ins registered under Paragon\'s font names, fitted by tools/fonts/fit-fonts.js */');
  for (const r of res) console.log(`@font-face{font-family:"${r.family}";src:url(/assets/fonts/${r.ours}) format("woff2");font-weight:${r.weight === r.ourWeight ? r.weight : r.weight};font-style:${r.style};font-display:swap;${Object.entries(r.fit).map(([k, v]) => `${k}:${v}`).join(';')}${r.ourWeight !== r.weight ? `;font-variation-settings:"wght" ${r.ourWeight}` : ''}}`);
  await b.close();
})();
