import { chromium } from '/system/conda/node/nvm/versions/node/v22.23.2/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'tests', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const breakpoints = [
  { name: 'Mobile_S', width: 375, height: 812 },
  { name: 'Mobile_L', width: 430, height: 932 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Laptop', width: 1280, height: 800 },
  { name: 'Desktop', width: 1440, height: 900 },
  { name: 'Wide', width: 1920, height: 1080 }
];

async function run() {
  console.log('Starting Playwright Multi-Breakpoint Visual Verification...');
  const browser = await chromium.launch({
    executablePath: '/home/zeus/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome',
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const fileUrl = 'file://' + path.join(rootDir, 'index.html');
  const results = [];

  for (const bp of breakpoints) {
    console.log(`\nTesting Breakpoint: ${bp.name} (${bp.width}x${bp.height})`);
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto(fileUrl, { waitUntil: 'load' });

    // Check horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    // Verify Royal Blue brand color is applied
    const royalColor = await page.evaluate(() => {
      const el = document.querySelector('.btn.primary');
      const cs = window.getComputedStyle(el);
      return cs.backgroundColor;
    });

    // Verify #story section exists and can be scrolled into view
    const storyExists = await page.locator('#story').count();

    // Scroll into the story section
    await page.locator('#story').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Verify sticky top during continuous scroll
    const stickyPinned = await page.evaluate(() => {
      const story = document.querySelector('#story');
      const sticky = document.querySelector('.story-sticky');
      // Scroll to 50% through story
      const mid = story.offsetTop + (story.offsetHeight - window.innerHeight) * 0.5;
      window.scrollTo({ top: mid, behavior: 'instant' });
      const rect = sticky.getBoundingClientRect();
      // Pinned near top of viewport (e.g. 58px on mobile, 68px on desktop)
      return rect.top >= 50 && rect.top <= 75;
    });

    // Capture initial beat 0 screenshot
    await page.locator('.deck-dot[data-goto="0"]').click();
    await page.waitForTimeout(400);
    const shotPath0 = path.join(screenshotsDir, `${bp.name}_beat0.png`);
    await page.screenshot({ path: shotPath0 });

    // Click on beat 3 (System) dot to test interactive shuffle
    await page.locator('.deck-dot[data-goto="3"]').click();
    await page.waitForTimeout(600);

    // Verify card 3 is active
    const card3Active = await page.evaluate(() => {
      const c = document.querySelector('.deck-card[data-index="3"]');
      return c && c.getAttribute('data-state') === 'active';
    });

    // Click on beat 4 (Resolution & Checkout) to test price counter
    await page.locator('.deck-dot[data-goto="4"]').click();
    await page.waitForTimeout(1600); // Allow tally count-up animation to complete

    const counterText = await page.locator('#cnt').textContent();

    // Capture beat 4 screenshot
    const shotPath4 = path.join(screenshotsDir, `${bp.name}_beat4.png`);
    await page.screenshot({ path: shotPath4 });

    results.push({
      breakpoint: bp.name,
      width: bp.width,
      height: bp.height,
      horizontalOverflow: overflow,
      storySectionPresent: storyExists > 0,
      stickyPinnedDuringScroll: stickyPinned,
      brandColor: royalColor,
      interactiveShuffleWorks: card3Active,
      counterText: counterText?.trim(),
      screenshot: shotPath0
    });
  }

  await browser.close();
  console.log('\n--- VERIFICATION RESULTS ---');
  console.table(results);

  const allPassed = results.every(r => !r.horizontalOverflow && r.storySectionPresent && r.interactiveShuffleWorks && r.stickyPinnedDuringScroll && r.brandColor === 'rgb(37, 99, 235)');
  if (!allPassed) {
    console.error('FAILED: Some breakpoint tests failed!');
    process.exit(1);
  }
  console.log('SUCCESS: All 6 breakpoints verified cleanly!');
}

run().catch(err => {
  console.error('Error running visual verification:', err);
  process.exit(1);
});
