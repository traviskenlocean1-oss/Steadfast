// One-off line-count tuning: edits inside copy values so each paragraph wraps to Paragon's line count.
// node tools/text/_tune.js   (each edit must hit exactly one value, or it stops)
const fs = require('fs'), path = require('path');
const EDITS = [
  // home testimonials (also used wide on Game Ready): +1 line each
  ['common.json', 'and in turn gave me a season I will remember forever.&quot;', 'and in turn gave me a season I will remember forever. They pushed me hard and never once let me coast.&quot;'],
  ['home.json', 'consistently delivers real results.&quot;', 'consistently delivers real results. They learned my name, my goals, and my excuses.&quot;'],
  // coach bios
  ['coaches.json', 'blending old-school barbell training with modern sports science.', 'blending old-school barbell training with modern sports science and a lot of patience.'],
  ['coaches.json', 'shaped by the work ethic and patience of the South.', 'shaped by the work ethic and patience of the South. He still opens the gym himself most mornings.'],
  ['coaches.json', 'we could build something great together.', 'we could build something great together, one rep at a time.'],
  ['coaches.json', 'as a Nashville-based mobility coach.', 'as a Nashville-based mobility and recovery coach.'],
  ['coaches.json', "it’s how they move and how they feel", "it’s how well they move and how they feel"],
  ['coaches.json', 'Past work includes physical therapy clinics,', 'Past work includes PT clinics,'],
  // Barbell Club approach: +1 line
  ['programs.json', 'can change the shape of an entire year.', 'can change the shape of an entire year of lifting, and every heavy single after it.'],
  // Meet Day post: p1 -1 line, p2 +1, p3 +1
  ['results.json', 'big crowds, loud hype, endless lists of rules to follow.', 'big crowds, loud hype, endless rules.'],
  ['results.json', "but didn’t scare anyone off.", "but didn’t scare a single first-timer off the platform."],
  ['results.json', 'sometimes slowing down is just as sweet.', 'sometimes slowing down and taking your time is just as sweet.'],
  // 2026 post
  ['results.json', 'not in the program itself.', 'not in the program or the app itself.'],
  ['results.json', "where a beginner doesn&#x27;t dread the first visit.", "where a nervous beginner doesn&#x27;t dread the first visit through the door."],
  // merch post
  ['results.json', 'or ask any coach on your next visit to the floor.', 'or ask any coach about sizes on your next visit to the Steadfast floor.'],
  // new floor post
  ['results.json', 'as much as they are proud of the results.', 'as much as they are proud of the results they earn on the floor.'],
];
for (const [f, from, to] of EDITS) {
  const p = path.join(__dirname, f);
  const o = JSON.parse(fs.readFileSync(p, 'utf8'));
  const hits = Object.keys(o).filter(k => typeof o[k] === 'string' && o[k].includes(from));
  if (hits.length !== 1) throw new Error(`${f}: "${from}" matched ${hits.length} values`);
  o[hits[0]] = o[hits[0]].replace(from, to);
  fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n');
}
console.log('applied', EDITS.length);
