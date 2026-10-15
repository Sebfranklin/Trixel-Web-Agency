/**
 * Graphics showcase — scroll smoothness verification.
 *
 * The rail position is driven by page scroll. Writing it straight from scroll
 * events produces visible jumps, because scroll events arrive in coarse steps and
 * `scroll-snap-type: mandatory` snaps the rail back on every write. The drive now
 * eases toward its target on its own frame loop.
 *
 * This samples the rail once per animation frame while the page scrolls through
 * the pinned region and asserts the motion is continuous: monotonic, and free of
 * large single-frame jumps relative to the total travel.
 */
import { chromium } from '/system/conda/node/nvm/versions/node/v22.23.2/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/home/zeus/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true
});
const page = await context.newPage();
await page.goto('file://' + path.join(rootDir, 'index.html'), { waitUntil: 'load' });
await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
await page.locator('#graphics').scrollIntoViewIfNeeded();
await page.waitForTimeout(300);

const samples = await page.evaluate(async () => {
  const section = document.getElementById('graphics');
  const pin = section.querySelector('.graphics-pin');
  const rail = document.getElementById('graphicsRail');
  const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 68;
  const start = section.getBoundingClientRect().top + window.scrollY - nav;
  const travel = section.offsetHeight - pin.offsetHeight;

  // Begin at the very top of the pinned span and settle.
  window.scrollTo(0, start);
  await new Promise((r) => setTimeout(r, 500));

  const out = [];
  const STEPS = 90;          // page-scroll increments across the pinned span
  const FRAMES_PER_STEP = 2; // let the eased loop advance between increments
  for (let i = 0; i <= STEPS; i++) {
    window.scrollTo(0, start + travel * (i / STEPS));
    for (let f = 0; f < FRAMES_PER_STEP; f++) {
      await new Promise((r) => requestAnimationFrame(r));
      out.push(rail.scrollLeft);
    }
  }
  // Let it settle at the end.
  for (let f = 0; f < 30; f++) await new Promise((r) => requestAnimationFrame(r));
  const settled = rail.scrollLeft;
  const max = rail.scrollWidth - rail.clientWidth;
  return { samples: out, settled, max };
});

await browser.close();

const s = samples.samples;
let maxJump = 0;
let maxJumpAt = -1;
let regressions = 0;
for (let i = 1; i < s.length; i++) {
  const d = s[i] - s[i - 1];
  if (d < -0.6) regressions++;
  if (Math.abs(d) > maxJump) {
    maxJump = Math.abs(d);
    maxJumpAt = i;
  }
}

const total = s[s.length - 1] - s[0];
const reach = samples.max > 0 ? samples.settled / samples.max : 0;
// A single frame should never cover more than a small slice of total travel.
const jumpShare = total > 0 ? maxJump / total : 0;

const rows = [
  { metric: 'frames sampled', value: s.length },
  { metric: 'rail travel (px)', value: Math.round(total) },
  { metric: 'largest single-frame jump (px)', value: Math.round(maxJump), at: maxJumpAt },
  { metric: 'that jump as % of total travel', value: (jumpShare * 100).toFixed(2) + '%' },
  { metric: 'backward steps (stutter)', value: regressions },
  { metric: 'settled at end', value: (reach * 100).toFixed(1) + '% of travel' }
];
console.table(rows);

const problems = [];
if (jumpShare > 0.05) problems.push(`largest frame jump is ${(jumpShare * 100).toFixed(1)}% of total travel (want <=5%)`);
if (regressions > 2) problems.push(`${regressions} backward steps indicate stutter`);
if (reach < 0.99) problems.push(`rail settles at only ${(reach * 100).toFixed(1)}% of travel`);
if (s.some((v) => v < -0.5)) problems.push('rail went negative');

console.log(
  problems.length === 0
    ? '\nSUCCESS: rail motion is continuous, monotonic, and reaches full travel.'
    : '\nPROBLEMS:\n - ' + problems.join('\n - ')
);
process.exit(problems.length === 0 ? 0 : 1);
