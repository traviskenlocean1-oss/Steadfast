// The 15 home-gallery polaroids: gym still in a polaroid frame with a hand-written caption, at Paragon's 1008x1251.
// Photo window + caption line measured from Paragon's own polaroids. -> assets/img/polaroid-NN.webp, tools/media/polaroids.json
// node tools/media/polaroids.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '../..');
const file = p => 'file:///' + p.split(path.sep).join('/');
// Paragon id -> [still, caption]
const P = [
  ['68dea4cee34b76ddee21a427', 'v007', 'Always Steady'],
  ['68dea4d49f90693c9dcf1039', 'v136', 'Chalk Up'],
  ['68dea8e5b1292fab5bf2346a', 'v111', 'Crew Dre'],
  ['68dea4de4d093c0e39f959af', 'v024', 'Spot Me'],
  ['68dfdd63aabac74da27d0802', 'v148', 'Iron Hour'],
  ['68dea500985dc919c77ed44a', 'v196', 'PR Day!'],
  ['68dea5243560b5565356a23f', 'v125', 'Set 9'],
  ['68dea532ca4f51e705a5d6e8', 'v045', 'Nashville'],
  ['68dea547ddc7d50f2a71d326', 'v113', 'Last Rep'],
  ['68dea55891c92920df16a44c', 'v186', 'Day One'],
  ['68dea568ca4f51e705a5e632', 'v066', 'Rack Talk'],
  ['68dea5778628a5f35497ea68', 'v018', 'Coach Says'],
  ['68dea5912f81eb710d51d8db', 'v252', 'Take a Bow!'],
  ['68dea5a3830ab225481d6da5', 'v032', 'Sweat Set'],
  ['68dea5ccf3d3c407868160a5', 'v005', 'Work Worth Doing'],
];
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1008, height: 1251 } });
  const map = {};
  for (const [i, [id, still, cap]] of P.entries()) {
    const img = file(path.join(__dirname, '../stock/posters', still + '.jpg'));
    const tmp = path.join(__dirname, "_polaroid.html");
    fs.writeFileSync(tmp, `<style>
      @font-face{font-family:Pen;src:url('${file(path.join(__dirname, '../brand/nanum-pen.woff2'))}')}
      body{margin:0;background:transparent}
      .f{position:relative;width:1008px;height:1251px;border-radius:14px;background:linear-gradient(160deg,#f7f5ef,#ecE8df);box-shadow:inset 0 0 0 2px rgba(0,0,0,.05)}
      .ph{position:absolute;left:68px;top:92px;width:864px;height:913px;background:url('${img}') center/cover;filter:saturate(.9) contrast(1.03);box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}
      .c{position:absolute;left:0;right:0;top:1060px;text-align:center;font:150px/1 Pen;color:#5a2fae;transform:rotate(${i % 2 ? -1.5 : 1}deg)}
    </style><div class="f"><div class="ph"></div><div class="c">${cap}</div></div>`);
    await p.goto(file(tmp));
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(150);
    const png = path.join(ROOT, 'assets/img', `polaroid-${String(i + 1).padStart(2, '0')}.png`);
    await (await p.$('.f')).screenshot({ path: png, omitBackground: true });
    const webp = png.replace('.png', '.webp');
    execFileSync('magick', [png, '-quality', '82', webp]);
    execFileSync('magick', [png, '-resize', '500x', '-quality', '80', webp.replace('.webp', '-500.webp')]);
    fs.unlinkSync(png);
    map[id] = { src: '/assets/img/' + path.basename(webp), small: '/assets/img/' + path.basename(webp).replace('.webp', '-500.webp'), caption: cap };
  }
  fs.unlinkSync(path.join(__dirname, "_polaroid.html"));
  fs.writeFileSync(path.join(__dirname, 'polaroids.json'), JSON.stringify(map, null, 1));
  await b.close();
  console.log('polaroids', Object.keys(map).length);
})();
