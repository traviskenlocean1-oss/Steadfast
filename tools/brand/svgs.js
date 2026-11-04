// Steadfast replacements for Paragon's inline brand SVGs, keyed by Paragon's viewBox (each one is unique to one mark).
// build.js keeps Paragon's <svg ...> tag (class, size, attributes) and swaps only the inner drawing.
// Text uses the page fonts: "Review Condensed" (bold condensed), "Simplon Norm" (narrow), "Steadfast Script", "Steadfast Block".
const KB = 'M13 6.5C13 4 15 2.5 20 2.5S27 4 27 6.5V11.2C31.8 13.6 35 18.6 35 24.3 35 32.1 28.3 37.5 20 37.5S5 32.1 5 24.3C5 18.6 8.2 13.6 13 11.2ZM17 7.2V10A16 16 0 0 1 23 10V7.2C23 6.6 22 6.2 20 6.2S17 6.6 17 7.2Z';
const STAR = 'M20 0C21.6 13 27 18.4 40 20 27 21.6 21.6 27 20 40 18.4 27 13 21.6 0 20 13 18.4 18.4 13 20 0Z';
// kettlebell (40x40 drawing) fitted into a w x h box, centered, at `fill` of the box height
const kb = (w, h, fill = 1, x = null, y = null) => {
  const s = (h * fill) / 40, ox = x ?? (w - 40 * s) / 2, oy = y ?? (h - 40 * s) / 2;
  return `<path fill="currentColor" fill-rule="evenodd" transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${s.toFixed(4)})" d="${KB}"/>`;
};
const star = (cx, cy, r) => `<path fill="currentColor" transform="translate(${cx - r} ${cy - r}) scale(${(r / 20).toFixed(4)})" d="${STAR}"/>`;
// text stretched to an exact width (textLength), baseline y
const t = (str, x, y, size, width, font = 'Review Condensed', extra = '') =>
  `<text x="${x}" y="${y}" font-family="${font}" font-weight="700" font-size="${size}" ${width ? `textLength="${width}" lengthAdjust="spacingAndGlyphs"` : ''} fill="currentColor" ${extra}>${str}</text>`;
const tc = (str, cx, y, size, width, font, extra = '') => t(str, cx - width / 2, y, size, width, font, extra);

const SVGS = {
  // nav emblem + small horses -> kettlebell
  '0 0 32 25': kb(32, 25, 1.1, null, -1.5),
  '0 0 75 59': kb(75, 59, 1.05),
  '0 0 43 34': kb(43, 34, 1.05),
  '0 0 386 319': kb(386, 319, 1.05),
  // footer: the Steadfast badge (pill, script wordmark, tagline)
  '0 0 1344 484': `<rect x="14" y="14" width="1316" height="456" rx="228" fill="none" stroke="currentColor" stroke-width="28"/>
    ${t('STRENGTH &amp;', 1000, 128, 70, 250)}${t('CONDITIONING', 1000, 196, 70, 250)}${t('CLUB', 1166, 264, 70, 84)}
    <text x="90" y="430" font-family="Steadfast Script" font-size="300" fill="currentColor" transform="rotate(-6 90 430)" textLength="830" lengthAdjust="spacingAndGlyphs">Steadfast</text>`,
  // hero badges
  '0 0 81 30': `<rect x="1" y="1" width="79" height="28" rx="14" fill="none" stroke="currentColor" stroke-width="2"/>${t('STRENGTH', 58, 9, 5, 16, 'Simplon Norm')}${t('CLUB', 66, 14.5, 5, 8, 'Simplon Norm')}<text x="7" y="25" font-family="Steadfast Script" font-size="17" fill="currentColor" transform="rotate(-6 7 25)" textLength="48" lengthAdjust="spacingAndGlyphs">Steadfast</text>`,
  '0 0 53 29': `<ellipse cx="26.5" cy="11" rx="25" ry="10" fill="none" stroke="currentColor" stroke-width="1.6"/><ellipse cx="26.5" cy="11" rx="12" ry="10" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11H51.5" stroke="currentColor" stroke-width="1.2"/>${star(26.5, 11, 6)}${tc('A STRENGTH &amp; CONDITIONING CLUB', 26.5, 27, 4.6, 52, 'Simplon Norm')}`,
  // "AN ORIGINAL PARAGON FILM"
  '0 0 115 41': `${tc('AN ORIGINAL', 57.5, 8, 8, 44, 'Simplon Norm')}${tc('STEADFAST', 57.5, 31, 25, 113, 'Review Condensed')}${tc('PROGRAM', 57.5, 40, 7, 30, 'Simplon Norm')}`,
  // home services mark: script S + star
  '0 0 380 381': `<text x="30" y="330" font-family="Steadfast Script" font-size="400" fill="currentColor">S</text>${star(300, 300, 62)}`,
  // PRGN oval -> STDFST oval
  '0 0 156 131': `<ellipse cx="72" cy="38" rx="70" ry="36" fill="currentColor"/><ellipse cx="72" cy="38" rx="64" ry="30" fill="none" stroke="#fff" stroke-width="2.5"/>${tc('STDFST', 72, 50, 34, 104, 'Steadfast Block', 'style="fill:#fff"')}${tc('BUILT NOT', 72, 99, 24, 96, 'Review Condensed', 'font-style="italic"')}${tc('BOUGHT', 72, 126, 24, 80, 'Review Condensed', 'font-style="italic"')}`,
  // "PURSUIT film crew" illustration -> coach crew lockup
  '0 0 462 458': `${tc('STEADFAST', 231, 92, 110, 440, 'Review Condensed', 'font-style="italic"')}
    ${kb(462, 458, 0.42, 34, 130)}${kb(462, 458, 0.5, 156, 112)}${kb(462, 458, 0.42, 290, 130)}
    <rect x="40" y="356" width="382" height="10" fill="currentColor"/>${tc('COACH CREW', 231, 418, 46, 230, 'Review Condensed', 'font-style="italic"')}${tc('NASHVILLE · STRENGTH &amp; CONDITIONING', 231, 448, 18, 300, 'Simplon Norm')}`,

  // ---- loader marks (one per Paragon mark, same box) ----
  '0 0 1131 128': (() => { const L = 'STEADFAST'.split(''); let s = `<rect x="0" y="4" width="120" height="120" fill="currentColor"/>${kb(120, 120, 0.8).replace('translate(', 'style="fill:#e3492b" transform="translate(')}`; L.forEach((c, i) => { const x = 133 + i * 111; s += `<rect x="${x}" y="4" width="100" height="120" fill="none" stroke="currentColor" stroke-width="8"/>${tc(c, x + 50, 104, 100, 56, 'Steadfast Block')}`; }); return s; })(),
  '0 0 1094 163': `<path d="M8 20H1086V112H8Z" fill="none" stroke="currentColor" stroke-width="10"/><path d="M8 40H60M8 60H40M8 80H60" stroke="currentColor" stroke-width="8"/>${t('STEADFAST', 90, 104, 96, 900, 'Review Condensed', 'font-style="italic"')}${t('NASHVILLE, TN', 800, 152, 34, 286, 'Simplon Norm')}`,
  '0 0 487 487': `<circle cx="243.5" cy="243.5" r="230" fill="none" stroke="currentColor" stroke-width="26"/><path d="M60 180H427V310H60Z" fill="currentColor"/><text x="90" y="290" font-family="Steadfast Script" font-size="140" style="fill:#e3492b" textLength="310" lengthAdjust="spacingAndGlyphs">Steadfast</text>`,
  '0 0 922 205': `<rect x="0" y="0" width="922" height="40" fill="currentColor"/>${t('STEADFAST', 0, 200, 170, 922, 'Steadfast Block')}`,
  '0 0 597 522': `<rect x="10" y="10" width="577" height="502" rx="200" fill="none" stroke="currentColor" stroke-width="20"/><rect x="40" y="190" width="517" height="150" fill="currentColor"/>${tc('STDF', 298.5, 310, 140, 380, 'Steadfast Block', 'style="fill:#e3492b"')}`,
  '0 0 690 404': `${[0, 1, 2, 3, 4].map(i => kb(690, 404, 0.42, 120 + i * 95, 0)).join('')}${tc('Steadfast', 345, 320, 170, 640, 'Review Condensed')}${tc('STRENGTH CLUB', 345, 396, 54, 420, 'Simplon Norm')}`,
  '0 0 1079 200': `${t('STEADFAST', 0, 112, 120, 640, 'Review Condensed')}<path d="M690 120L760 20H820L750 120ZM800 120L870 20H930L860 120ZM910 120L980 20H1079L1009 120Z" fill="currentColor"/><rect x="0" y="126" width="700" height="10" fill="currentColor"/>${t('STRENGTH &amp; CONDITIONING', 0, 190, 40, 640, 'Simplon Norm')}`,
  '0 0 1009 261': `<rect x="6" y="6" width="997" height="249" rx="124" fill="none" stroke="currentColor" stroke-width="10"/><rect x="36" y="36" width="937" height="189" rx="94" fill="none" stroke="currentColor" stroke-width="10"/><rect x="66" y="66" width="877" height="129" rx="64" fill="none" stroke="currentColor" stroke-width="10"/>${tc('STDFST’S', 504.5, 164, 96, 560, 'Steadfast Block')}`,
  '0 0 819 405': `${[[0, 0], [1, 1], [0, 2], [2, 0], [1, 3]].map(([c, r]) => `<path d="M${130 + c * 100 - r * 30} ${r * 90}h90l-30 85h-90z" fill="currentColor"/>`).join('')}${t('STEADFAST', 240, 360, 130, 560, 'Review Condensed', 'font-style="italic"')}`,
  '0 0 586 430': `<path d="M0 0H586V140L293 40 0 140Z" fill="currentColor"/>${tc('Steadfast', 293, 400, 230, 560, 'Review Condensed')}`,
  '0 0 594 562': `<circle cx="297" cy="220" r="200" fill="none" stroke="currentColor" stroke-width="22"/><path d="M100 220H494" stroke="currentColor" stroke-width="18"/>${star(297, 220, 150)}<path d="M80 560L120 480H150L110 560ZM140 560L180 480H210L170 560ZM200 560L240 480H270L230 560Z" fill="currentColor"/>${t('STDF', 290, 556, 96, 300, 'Steadfast Block')}`,
  '0 0 1165 212': t('STEADFAST', 0, 190, 200, 1165, 'Review Condensed', 'font-style="italic"'),
  '0 0 647 489': `<path d="M0 230L80 170H360L560 0H647L420 230H200L120 300H0Z" fill="currentColor"/>${tc('STEADFAST', 323.5, 400, 84, 600, 'Simplon Norm')}${tc('STRENGTH CLUB', 323.5, 460, 40, 320, 'Simplon Norm')}`,
  '0 0 421 565': `<rect x="10" y="10" width="401" height="545" rx="40" fill="none" stroke="currentColor" stroke-width="16"/>${star(210.5, 210, 150)}<rect x="10" y="420" width="401" height="10" fill="currentColor"/>${tc('STEADFAST', 210.5, 520, 80, 340, 'Review Condensed')}`,
};
module.exports = { SVGS };
