/**
 * Graphics showcase — pinned-region fit verification.
 *
 * The carousel is a pinned (sticky) panel: vertical scroll is consumed while the
 * rail travels sideways. That layout only works if the composition always fits
 * the pinned viewport, and the failure mode is silent — `justify-content:center`
 * plus `overflow:hidden` hides overflow at the TOP, which is invisible to
 * `scrollHeight` and so invisible to a naive assertion. This test therefore
 * measures each child's box against the panel's box directly.
 *
 * It also covers real phone heights (browser chrome reduces the viewport well
 * below the nominal device height) and confirms the CTA always clears the fixed
 * mobile price bar.
 */
import { chromium } from '/system/conda/node/nvm/versions/node/v22.23.2/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const CHROME = '/home/zeus/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome';

const cases = [
  { name: 'iPhone14', width: 390, height: 844, mobile: true },
  { name: 'iPhoneSE', width: 375, height: 667, mobile: true },
  { name: 'SmallPhone', width: 360, height: 600, mobile: true },
  { name: 'ShortPhone', width: 375, height: 560, mobile: true },
  { name: 'VeryShort', width: 360, height: 520, mobile: true },
  { name: 'Mobile_L', width: 430, height: 932, mobile: true },
  { name: 'Tablet', width: 768, height: 1024, mobile: false },
  { name: 'Laptop', width: 1280, height: 800, mobile: false },
  { name: 'Desktop', width: 1440, height: 900, mobile: false },
  { name: 'Wide', width: 1920, height: 1080, mobile: false }
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const results = [];

for (const c of cases) {
  const context = await browser.newContext({
    viewport: { width: c.width, height: c.height },
    hasTouch: c.mobile,
    isMobile: c.mobile
  });
  const page = await context.newPage();
  await page.goto('file://' + path.join(rootDir, 'index.html'), { waitUntil: 'load' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

  const m = await page.evaluate(async () => {
    const section = document.getElementById('graphics');
    const pin = section.querySelector('.graphics-pin');
    const rail = document.getElementById('graphicsRail');
    const nav =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 68;
    // Park the panel in its held position.
    const start = section.getBoundingClientRect().top + window.scrollY - nav;
    window.scrollTo(0, start);
    await new Promise((r) => setTimeout(r, 320));

    const pr = pin.getBoundingClientRect();
    const kids = [...pin.children];
    const tops = kids.map((k) => k.getBoundingClientRect().top);
    const bottoms = kids.map((k) => k.getBoundingClientRect().bottom);

    const card = rail.querySelector('.graphics-card');
    const h2 = pin.querySelector('h2');
    const cta = pin.querySelector('.graphics-foot .btn');
    const bar = document.querySelector('.mobile-pricebar');
    const barShown = bar && getComputedStyle(bar).display !== 'none';

    return {
      // Overflow in EITHER direction, measured box-to-box (scrollHeight misses
      // overflow above the top of a centred flex container).
      overTop: Math.round(Math.max(0, pr.top - Math.min(...tops))),
      overBottom: Math.round(Math.max(0, Math.max(...bottoms) - pr.bottom)),
      // The panel must not extend past the screen it is pinned to.
      pinBelowScreen: Math.round(Math.max(0, pr.bottom - window.innerHeight)),
      // First card must share the headline's left grid line.
      gridDelta: Math.round(card.getBoundingClientRect().left - h2.getBoundingClientRect().left),
      ctaClearsBar: !barShown || cta.getBoundingClientRect().bottom <= bar.getBoundingClientRect().top + 0.5,
      railScrollable: rail.scrollWidth > rail.clientWidth + 4,
      headingVisible: (() => {
        const r = h2.getBoundingClientRect();
        return r.top >= pr.top - 1 && r.bottom <= pr.bottom + 1;
      })()
    };
  });

  results.push({
    device: c.name,
    vp: `${c.width}x${c.height}`,
    overTop: m.overTop,
    overBottom: m.overBottom,
    pinPastScreen: m.pinBelowScreen,
    gridDelta: m.gridDelta,
    headingFits: m.headingVisible ? 'OK' : 'FAIL',
    ctaClearsBar: m.ctaClearsBar ? 'OK' : 'FAIL',
    railScrolls: m.railScrollable ? 'OK' : 'FAIL'
  });
  await context.close();
}

await browser.close();
console.table(results);

const bad = results.filter(
  (r) =>
    r.overTop > 0 ||
    r.overBottom > 0 ||
    r.pinPastScreen > 0 ||
    r.gridDelta !== 0 ||
    r.ctaClearsBar === 'FAIL' ||
    r.headingFits === 'FAIL' ||
    r.railScrolls === 'FAIL'
);
console.log(
  bad.length === 0
    ? '\nSUCCESS: the pinned panel fits, stays on screen, aligns to the text grid, and keeps the CTA clear of the price bar at every size.'
    : '\nPROBLEMS:\n - ' +
        bad
          .map(
            (r) =>
              `${r.device}(${r.vp}) overTop=${r.overTop} overBottom=${r.overBottom} pinPastScreen=${r.pinPastScreen} gridDelta=${r.gridDelta} cta=${r.ctaClearsBar} heading=${r.headingFits}`
          )
          .join('\n - ')
);
process.exit(bad.length === 0 ? 0 : 1);
