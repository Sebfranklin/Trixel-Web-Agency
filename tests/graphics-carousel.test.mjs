/**
 * Graphics showcase carousel — deterministic verification.
 * Checks rendering, horizontal scrollability, image loading, CTA target,
 * scroll-snap behaviour, tap-target size, and console cleanliness across the
 * six standard breakpoints.
 */
import { chromium } from '/system/conda/node/nvm/versions/node/v22.23.2/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const shotsDir = path.join(rootDir, 'tests', 'screenshots');
fs.mkdirSync(shotsDir, { recursive: true });

const CHROME = '/home/zeus/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome';
const EXPECTED_CARDS = 14;
const EXPECTED_CTA = 'services/graphics-and-add-ons.html';

const breakpoints = [
  { name: 'Mobile_S', width: 375, height: 812, mobile: true },
  { name: 'Mobile_L', width: 430, height: 932, mobile: true },
  { name: 'Tablet', width: 768, height: 1024, mobile: false },
  { name: 'Laptop', width: 1280, height: 800, mobile: false },
  { name: 'Desktop', width: 1440, height: 900, mobile: false },
  { name: 'Wide', width: 1920, height: 1080, mobile: false }
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const results = [];
const consoleErrors = [];

for (const bp of breakpoints) {
  const context = await browser.newContext({ viewport: { width: bp.width, height: bp.height } });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`[${bp.name}] ${m.text()}`); });
  page.on('pageerror', (e) => consoleErrors.push(`[${bp.name}] pageerror: ${e.message}`));

  await page.goto('file://' + path.join(rootDir, 'index.html'), { waitUntil: 'load' });

  // Scroll the rail into view so lazy images resolve.
  await page.locator('#graphics').scrollIntoViewIfNeeded();
  await page.waitForFunction(
    (n) => {
      const imgs = document.querySelectorAll('#graphicsRail img');
      return imgs.length === n && [...imgs].every((i) => i.complete && i.naturalWidth > 0);
    },
    EXPECTED_CARDS,
    { timeout: 20000 }
  );

  const metrics = await page.evaluate(() => {
    const section = document.getElementById('graphics');
    const rail = document.getElementById('graphicsRail');
    const cards = document.querySelectorAll('#graphics .graphics-card');
    const imgs = document.querySelectorAll('#graphicsRail img');
    const cta = document.querySelector('#graphics a.btn');
    const prev = document.getElementById('graphicsPrev');
    const bar = document.getElementById('graphicsBar');
    const cs = getComputedStyle(rail);
    const rect = prev.getBoundingClientRect();
    return {
      sectionVisible: !!section && section.getBoundingClientRect().height > 0,
      cardCount: cards.length,
      loadedImages: [...imgs].filter((i) => i.complete && i.naturalWidth > 0).length,
      scrollable: rail.scrollWidth > rail.clientWidth + 4,
      overflowXPage: document.documentElement.scrollWidth > window.innerWidth + 1,
      ctaHref: cta ? cta.getAttribute('href') : null,
      snapType: cs.scrollSnapType,
      btnW: Math.round(rect.width),
      btnH: Math.round(rect.height),
      railScrollLeft: rail.scrollLeft,
      barWidth: bar ? bar.style.width : null,
      // New: every card must be a keyboard-reachable button, and images must be
      // shown whole (contain) rather than cropped, per the brief.
      clickableCards: document.querySelectorAll('#graphics button.graphics-art').length,
      pinOverflow: (() => {
        const pin = document.querySelector('#graphics .graphics-pin');
        if (!pin) return -1;
        return Math.round(pin.scrollHeight - pin.clientHeight);
      })(),
      pinned: (() => {
        const pin = document.querySelector('#graphics .graphics-pin');
        return pin ? getComputedStyle(pin).position : 'none';
      })(),
      allContain: [...document.querySelectorAll('#graphics .graphics-art img')]
        .every((i) => getComputedStyle(i).objectFit === 'contain'),
      firstFit: (() => {
        const first = document.querySelector('#graphics .graphics-art img');
        if (!first) return null;
        const frame = 3 / 4;
        const ratio = first.naturalWidth / first.naturalHeight;
        return { ratio: +ratio.toFixed(3), frame, delta: +Math.abs(ratio - frame).toFixed(3) };
      })()
    };
  });

  // Interaction: step forward and confirm the rail actually moves + bar syncs.
  await page.locator('#graphicsNext').click();
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => ({
    railScrollLeft: document.getElementById('graphicsRail').scrollLeft,
    barWidth: document.getElementById('graphicsBar').style.width
  }));

  // Hide sticky chrome so the capture shows only the section under review.
  await page.addStyleTag({ content: '.nav,.mobile-pricebar{visibility:hidden!important}' });
  await page.locator('#graphics .graphics-pin').screenshot({ path: path.join(shotsDir, `graphics-${bp.name}.png`) });

  results.push({
    breakpoint: bp.name, width: bp.width,
    section: metrics.sectionVisible ? 'OK' : 'FAIL',
    cards: metrics.cardCount === EXPECTED_CARDS ? 'OK' : `FAIL(${metrics.cardCount})`,
    images: metrics.loadedImages === EXPECTED_CARDS ? 'OK' : `FAIL(${metrics.loadedImages}/${EXPECTED_CARDS})`,
    scrollable: metrics.scrollable ? 'OK' : 'FAIL',
    pageOverflow: metrics.overflowXPage ? 'FAIL' : 'OK',
    // Scroll-snap is deliberately OFF: on a scroll-driven rail, `mandatory` and
    // even `proximity` re-snap the position on every programmatic write, which
    // measured as a one-card-width jump mid-sweep. See graphics-smoothness.test.mjs.
    snapOff: metrics.snapType === 'none' ? 'OK' : `FAIL(${metrics.snapType})`,
    cta: metrics.ctaHref === EXPECTED_CTA ? 'OK' : `FAIL(${metrics.ctaHref})`,
    tapTarget: !bp.mobile || (metrics.btnW >= 44 && metrics.btnH >= 44) ? 'OK' : `FAIL(${metrics.btnW}x${metrics.btnH})`,
    arrowMoves: after.railScrollLeft > metrics.railScrollLeft ? 'OK' : 'FAIL',
    barSyncs: after.barWidth !== metrics.barWidth ? 'OK' : 'FAIL',
    clickable: metrics.clickableCards === EXPECTED_CARDS ? 'OK' : `FAIL(${metrics.clickableCards})`,
    wholeImage: metrics.allContain ? 'OK' : 'FAIL',
    bestFitFirst: metrics.firstFit && metrics.firstFit.delta <= 0.05 ? 'OK' : `FAIL(${metrics.firstFit && metrics.firstFit.ratio})`,
    pinned: metrics.pinned === 'sticky' ? 'OK' : `FAIL(${metrics.pinned})`,
    pinFits: metrics.pinOverflow <= 1 ? 'OK' : `FAIL(+${metrics.pinOverflow}px)`
  });

  await context.close();
}

// ---- Behavioural: lightbox and scroll-driven rail (375px) ----
{
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => consoleErrors.push(`[lightbox] pageerror: ${e.message}`));
  await page.goto('file://' + path.join(rootDir, 'index.html'), { waitUntil: 'load' });
  await page.locator('#graphics').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  // Open the first card.
  await page.locator('#graphics .graphics-art').first().click();
  await page.waitForTimeout(350);
  const opened = await page.evaluate(() => {
    const lb = document.getElementById('graphicsLightbox');
    const img = document.getElementById('glbImg');
    return {
      isOpen: lb.classList.contains('open'),
      src: img.getAttribute('src'),
      hasTitle: (document.getElementById('glbTitle').textContent || '').length > 0,
      bodyLocked: getComputedStyle(document.body).overflow === 'hidden',
      imgLoaded: img.complete && img.naturalWidth > 0
    };
  });
  results.push({ breakpoint: 'lightbox', width: 375,
    opensOnClick: opened.isOpen ? 'OK' : 'FAIL',
    showsImage: opened.src && opened.imgLoaded ? 'OK' : `FAIL(${opened.src})`,
    caption: opened.hasTitle ? 'OK' : 'FAIL',
    scrollLocked: opened.bodyLocked ? 'OK' : 'FAIL',
    escapeCloses: 'PENDING', other: '-' });

  // Escape must close it.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  const closed = await page.evaluate(() => ({
    open: document.getElementById('graphicsLightbox').classList.contains('open'),
    unlocked: getComputedStyle(document.body).overflow !== 'hidden'
  }));
  results[results.length - 1].escapeCloses = closed.open ? 'FAIL' : 'OK';
  results[results.length - 1].other = closed.unlocked ? 'unlockOK' : 'FAIL(unlock)';

  await context.close();

  // Scroll-driven rail must work with no prior interaction, so use a fresh context.
  const dctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page2 = await dctx.newPage();
  page2.on('pageerror', (e) => consoleErrors.push(`[drive] pageerror: ${e.message}`));
  await page2.goto('file://' + path.join(rootDir, 'index.html'), { waitUntil: 'load' });
  await page2.locator('#graphics').scrollIntoViewIfNeeded();
  await page2.waitForTimeout(300);
  const drive = await page2.evaluate(async () => {
    const rail = document.getElementById('graphicsRail');
    document.documentElement.style.scrollBehavior = 'auto';
    const y0 = window.scrollY;
    const before = rail.scrollLeft;
    window.scrollBy(0, 900);
    await new Promise((r) => setTimeout(r, 600));
    return { before, after: rail.scrollLeft, scrolled: window.scrollY !== y0 };
  });
  results.push({ breakpoint: 'scrollDrive', width: 375,
    pageScrolled: drive.scrolled ? 'OK' : 'FAIL',
    railAdvanced: drive.after > drive.before ? 'OK' : `FAIL(${drive.before}->${drive.after})`,
    opensOnClick: '-', showsImage: '-', caption: '-', scrollLocked: '-', escapeCloses: '-', other: '-' });

  await dctx.close();
}

await browser.close();

console.table(results);
console.log('\nExpected cards:', EXPECTED_CARDS, '| CTA target:', EXPECTED_CTA);
console.log('Console errors:', consoleErrors.length === 0 ? 'NONE' : consoleErrors.length);
for (const e of consoleErrors) console.log('  ', e);

const failed = results.flatMap((r) =>
  Object.entries(r).filter(([, v]) => typeof v === 'string' && v.startsWith('FAIL')).map(([k, v]) => `${r.breakpoint}.${k}=${v}`)
);
console.log('\n' + (failed.length === 0 ? 'SUCCESS: graphics carousel verified at all 6 breakpoints.' : 'FAILURES: ' + failed.join(', ')));
console.log('Screenshots ->', shotsDir);
process.exit(failed.length === 0 && consoleErrors.length === 0 ? 0 : 1);
