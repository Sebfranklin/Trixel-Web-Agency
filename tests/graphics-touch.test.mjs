/**
 * Graphics showcase — touch-intent verification.
 *
 * The rail advances from page scroll, but must yield to a deliberate horizontal
 * swipe. The bug this guards against: treating *any* touch on a card as "manual
 * interaction", which froze the carousel whenever a finger rested on an image
 * while the page scrolled.
 *
 * A synthetic vertical drag must therefore NOT suspend the drive, and a synthetic
 * horizontal drag MUST suspend it.
 */
import { chromium } from '/system/conda/node/nvm/versions/node/v22.23.2/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/home/zeus/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

/** Dispatch a touch gesture on the first card and report how the rail responds. */
async function gesture(dx, dy, scrollFraction) {
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

  const out = await page.evaluate(
    async ({ dx, dy, scrollFraction }) => {
      const rail = document.getElementById('graphicsRail');
      const card = rail.querySelector('.graphics-card');
      const r = card.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;

      const send = (type, cx, cy) => {
        const t = new Touch({ identifier: 1, target: card, clientX: cx, clientY: cy });
        card.dispatchEvent(
          new TouchEvent(type, {
            touches: type === 'touchend' ? [] : [t],
            changedTouches: [t],
            bubbles: true,
            cancelable: true
          })
        );
      };

      send('touchstart', x, y);
      send('touchmove', x + dx, y + dy);
      send('touchend', x + dx, y + dy);

      const before = rail.scrollLeft;
      const section = document.getElementById('graphics');
      const pin = section.querySelector('.graphics-pin');
      const nav =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 68;
      const start = section.getBoundingClientRect().top + window.scrollY - nav;
      const travel = section.offsetHeight - pin.offsetHeight;
      window.scrollTo(0, start + travel * scrollFraction);
      await new Promise((res) => setTimeout(res, 400));
      return { before, after: rail.scrollLeft };
    },
    { dx, dy, scrollFraction }
  );

  await context.close();
  return out;
}

// A vertical drag on a card must leave the scroll drive intact.
const vertical = await gesture(1, -60, 0.6);
// A horizontal drag is a manual swipe and must suspend the drive.
const horizontal = await gesture(-80, 2, 0.95);

await browser.close();

const rows = [
  {
    gesture: 'vertical drag on a card',
    before: vertical.before,
    after: vertical.after,
    result: vertical.after > vertical.before ? 'OK (advanced)' : 'FAIL (frozen)'
  },
  {
    gesture: 'horizontal swipe on a card',
    before: horizontal.before,
    after: horizontal.after,
    result: horizontal.after <= horizontal.before + 2 ? 'OK (yielded)' : 'FAIL (overridden)'
  }
];
console.table(rows);

const failed = rows.filter((r) => r.result.startsWith('FAIL'));
console.log(
  failed.length === 0
    ? '\nSUCCESS: a finger on an image no longer freezes the carousel, and a deliberate swipe still takes control.'
    : '\nFAILURES: ' + failed.map((r) => `${r.gesture} -> ${r.result}`).join('; ')
);
process.exit(failed.length === 0 ? 0 : 1);
