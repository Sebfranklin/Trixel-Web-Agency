// Capture current hero at key breakpoints for the declutter analysis.
import { chromium } from '/system/conda/node/nvm/versions/node/v22.23.2/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const CHROME_BIN = '/home/zeus/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome';
const SIZES = [
  { name: 'Mobile_S', w: 375, h: 812, mobile: true },
  { name: 'Mobile_L', w: 430, h: 932, mobile: true },
  { name: 'Desktop', w: 1440, h: 900, mobile: false }
];

const browser = await chromium.launch({ executablePath: CHROME_BIN, headless: true });
for (const s of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, isMobile: s.mobile, hasTouch: s.mobile, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('file://' + path.join(rootDir, 'index.html'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600); // let hero lift-in animation settle
  await page.screenshot({ path: path.join(__dirname, `hero-${s.name}.png`), clip: { x: 0, y: 0, width: s.w, height: Math.min(s.h, 812) } });
  const overflow = await page.evaluate(() => ({ across: document.documentElement.scrollWidth, down: document.documentElement.scrollHeight, win: innerWidth }));
  console.log(`${s.name}: pageScrollWidth=${overflow.across} vs win=${overflow.win} overflow=${overflow.across > overflow.win ? 'YES' : 'none'}`);
  await ctx.close();
}
await browser.close();
console.log('saved ->', __dirname);
