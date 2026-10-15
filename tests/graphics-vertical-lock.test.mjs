/**
 * Graphics showcase — vertical lock regression test.
 *
 * Reported on a real phone: "the top of the image cards slightly enters under
 * the 'brand work. Built to sell' — the cards should not move vertically."
 *
 * Root cause (measured, see HANDOFF pass 13):
 *  - `.graphics-rail` sets overflow-x:auto, which per CSS computes overflow-y
 *    to `auto` — the rail is VERTICALLY pannable.
 *  - Card art is sized with vh units while the pinned panel is sized with svh.
 *    On a real phone (browser chrome present) vh > svh, so cards are taller
 *    than the rail's leftover space and the rail overflows vertically.
 *  - A resting finger + vertical momentum then pans the cards up so their tops
 *    slide beneath the intro headline (which paints above them via z-index).
 *
 * Playwright's emulated viewport has no browser chrome (vh == svh), so this
 * test simulates the chrome by shrinking the pinned panel's height — exactly
 * the geometry a real phone produces (cards keep vh sizing, panel loses space).
 *
 * Assertions, per mobile size, both with and without simulated chrome:
 *  1. computed overflow-y on the rail is `hidden`  — the rail itself cannot pan vertically
 *  2. computed touch-action on the rail is `pan-x pan-y` — native horizontal swipe pans the
 *     rail, while vertical gestures must rise to the PAGE scroller (the pinned rail is driven
 *     by page scroll, so blocking pan-y — as a stricter `touch-action:pan-x` did — freezes the
 *     slide whenever a finger rests on an image)
 *  3. setting rail.scrollTop = 60 clamps back to 0 under simulated chrome
 *  4. under simulated chrome, every visible card fits the rail's box
 *     (tops never above the rail, bottoms/labels never clipped)
 */
import { chromium } from '/system/conda/node/nvm/versions/node/v22.23.2/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const CHROME = '/home/zeus/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome';

// Visual chrome on real phones steals ~60-130px. 120px is a representative tall
// chrome (iOS Safari with bottom bar + top URL bar).
const CHROME_SIM = '.graphics-pin{height:calc(100svh - var(--nav) - 120px)}';

const cases = [
  { name: 'iPhone14_390x844', width: 390, height: 844 },
  { name: 'MobileS_375x812', width: 375, height: 812 },
  { name: 'iPhoneSE_375x667', width: 375, height: 667 },
  { name: 'MobileL_430x932', width: 430, height: 932 }
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const results = [];

for (const c of cases) {
  const context = await browser.newContext({
    viewport: { width: c.width, height: c.height },
    hasTouch: true,
    isMobile: true
  });
  const page = await context.newPage();
  await page.goto('file://' + path.join(rootDir, 'index.html'), { waitUntil: 'load' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

  // Park the pinned panel in its held position before measuring.
  await page.evaluate(async () => {
    const section = document.getElementById('graphics');
    const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 68;
    window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY - nav);
    await new Promise((r) => setTimeout(r, 320));
  });

  // 1 + 2: computed styles (valid with or without simulated chrome).
  const computed = await page.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('graphicsRail'));
    return { overflowY: cs.overflowY, touchAction: cs.touchAction };
  });

  // 3 + 4: geometry under simulated real-phone chrome.
  await page.addStyleTag({ content: CHROME_SIM });
  await page.evaluate(async () => { await new Promise((r) => setTimeout(r, 200)); });
  const geometry = await page.evaluate(() => {
    const rail = document.getElementById('graphicsRail');
    rail.scrollTop = 60;
    const clampedScrollTop = rail.scrollTop;
    rail.scrollTop = 0;
    const rr = rail.getBoundingClientRect();
    const cards = [...rail.querySelectorAll('.graphics-card')].filter((el) => {
      const b = el.getBoundingClientRect();
      return b.right > 0 && b.left < window.innerWidth;
    });
    const fits = cards.map((el) => {
      const b = el.getBoundingClientRect();
      return { topOK: b.top >= rr.top - 0.5, bottomOK: b.bottom <= rr.bottom + 0.5 };
    });
    return {
      clampedScrollTop,
      railScrollH: rail.scrollHeight,
      railClientH: rail.clientHeight,
      cardCount: cards.length,
      allCardsFit: fits.every((f) => f.topOK && f.bottomOK)
    };
  });

  results.push({
    device: c.name,
    overflowY: computed.overflowY === 'hidden' ? 'OK' : `FAIL(${computed.overflowY})`,
    touchAction: computed.touchAction === 'pan-x pan-y' ? 'OK' : `FAIL(${computed.touchAction})`,
    scrollLock: geometry.clampedScrollTop === 0 ? 'OK' : `FAIL(${geometry.clampedScrollTop})`,
    cardsFit: geometry.allCardsFit ? 'OK' : `FAIL(${geometry.railScrollH}/${geometry.railClientH})`,
    cards: geometry.cardCount
  });
  await context.close();
}

await browser.close();
console.table(results);

const bad = results.filter(
  (r) => r.overflowY.startsWith('FAIL') || r.touchAction.startsWith('FAIL') ||
         r.scrollLock.startsWith('FAIL') || r.cardsFit.startsWith('FAIL')
);
console.log(
  bad.length === 0
    ? '\nSUCCESS: the rail cannot pan vertically, ignores vertical scroll attempts, and every card stays inside the rail box under simulated real-phone chrome.'
    : '\nPROBLEMS (rail must never move cards vertically):\n - ' +
        bad.map((r) => `${r.device}: overflowY=${r.overflowY} touchAction=${r.touchAction} scrollLock=${r.scrollLock} cardsFit=${r.cardsFit}`).join('\n - ')
);
process.exit(bad.length === 0 ? 0 : 1);
