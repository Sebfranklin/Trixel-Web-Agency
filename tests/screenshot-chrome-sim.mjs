// Visual proof: mid-sweep at 390x844 with 120px of browser chrome simulated.
import { chromium } from '/system/conda/node/nvm/versions/node/v22.23.2/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const CHROME_BIN = '/home/zeus/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome';

const browser = await chromium.launch({ executablePath: CHROME_BIN, headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + path.join(rootDir, 'index.html'), { waitUntil: 'load' });
await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
await page.evaluate(async () => {
  const section = document.getElementById('graphics');
  const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 68;
  window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY - nav);
  await new Promise((r) => setTimeout(r, 300));
});
// Simulate real-phone chrome: the pinned panel loses 120px (URL bar + bottom bar).
await page.addStyleTag({ content: '.graphics-pin{height:calc(100svh - var(--nav) - 120px)}' });
await page.evaluate(async () => {
  const rail = document.getElementById('graphicsRail');
  const section = document.getElementById('graphics');
  // Nudge the drive into the middle of the sweep.
  window.scrollTo(0, section.offsetTop + section.offsetHeight * 0.4);
  await new Promise((r) => setTimeout(r, 600));
});
const m = await page.evaluate(() => {
  const intro = document.querySelector('.graphics-intro').getBoundingClientRect();
  const rail = document.getElementById('graphicsRail').getBoundingClientRect();
  return { gap: +(rail.top - intro.bottom).toFixed(1) };
});
await page.screenshot({ path: '/teamspace/studios/this_studio/trixeltech/website/tests/screenshots/graphics-chrome-simMobile.png' });
console.log(`intro-bottom to rail-top gap with chrome sim: ${m.gap}px (must be >= 0)`);
await browser.close();
process.exit(m.gap >= 0 ? 0 : 1);
