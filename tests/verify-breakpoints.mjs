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

    // Verify hero text visibility & no clipping
    const heroVisible = await page.evaluate(() => {
      const h1 = document.querySelector('.hero h1');
      if (!h1) return false;
      const rect = h1.getBoundingClientRect();
      return rect.width <= window.innerWidth && rect.height > 0;
    });

    // Verify Royal Blue brand color is applied to hero primary button
    const royalColor = await page.evaluate(() => {
      const el = document.querySelector('.hero .btn.primary') || document.querySelector('.btn.primary');
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
      const mid = story.offsetTop + (story.offsetHeight - window.innerHeight) * 0.5;
      window.scrollTo({ top: mid, behavior: 'instant' });
      const rect = sticky.getBoundingClientRect();
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
      heroTextClean: heroVisible,
      storySectionPresent: storyExists > 0,
      stickyPinnedDuringScroll: stickyPinned,
      brandColor: royalColor,
      interactiveShuffleWorks: card3Active,
      counterText: counterText?.trim()
    });
  }

  // --- SPECIALIZED FLOW TESTS ---
  console.log('\nTesting Interactive Wizard on start.html...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('file://' + path.join(rootDir, 'start.html'), { waitUntil: 'load' });

  // Step 1 to Step 2
  await page.locator('.wizard-pane[data-step="1"] button[data-next="2"]').click();
  await page.waitForTimeout(200);

  // Step 2 to Step 3
  await page.locator('.wizard-pane[data-step="2"] button[data-next="3"]').click();
  await page.waitForTimeout(200);

  // Step 3 to Step 4
  await page.locator('.wizard-pane[data-step="3"] button[data-next="4"]').click();
  await page.waitForTimeout(200);

  // Fill in form on Step 4
  await page.locator('#clientName').fill('Tunde Adebayo');
  await page.locator('#businessName').fill('Apex Apparel');
  await page.locator('#clientWhatsApp').fill('+234 801 234 5678');
  await page.locator('#clientEmail').fill('tunde@apexapparel.ng');

  // Submit to Step 5
  await page.locator('#generateEnquiryBtn').click();
  await page.waitForTimeout(300);

  const step5Active = await page.evaluate(() => {
    const p5 = document.querySelector('.wizard-pane[data-step="5"]');
    return p5 && p5.classList.contains('active');
  });

  const waLink = await page.locator('#waSendBtn').getAttribute('href');
  console.log('Generated WhatsApp Link:', waLink?.slice(0, 80) + '...');
  const waLinkValid = waLink && waLink.includes('wa.me/2347042998527') && waLink.includes('Tunde%20Adebayo');

  // Capture Wizard Step 5 screenshot
  await page.screenshot({ path: path.join(screenshotsDir, 'Mobile_S_wizard_step5.png') });

  // --- PRICING PAGE TEST ---
  console.log('\nTesting Pricing Scope Modal & Mobile Price Bar on pricing.html...');
  await page.goto('file://' + path.join(rootDir, 'pricing.html'), { waitUntil: 'load' });

  // Verify mobile price bar visible on mobile
  const priceBarVisible = await page.locator('#mobilePriceBar').isVisible();

  // Click scope modal button for landing page
  await page.locator('.plan-scope-btn[data-scope="landing-page"]').click();
  await page.waitForTimeout(200);

  const modalOpen = await page.evaluate(() => {
    const m = document.querySelector('#scopeModalBackdrop');
    return m && m.classList.contains('open');
  });

  // Close modal
  await page.locator('#scopeModalClose').click();
  await page.waitForTimeout(200);
  const modalClosed = await page.evaluate(() => {
    const m = document.querySelector('#scopeModalBackdrop');
    return m && !m.classList.contains('open');
  });

  await browser.close();

  console.log('\n--- VERIFICATION RESULTS ---');
  console.table(results);
  console.log('Wizard Step 5 Active:', step5Active);
  console.log('WhatsApp Link Valid:', waLinkValid);
  console.log('Mobile Price Bar Visible:', priceBarVisible);
  console.log('Scope Modal Opened & Closed:', modalOpen && modalClosed);

  const allPassed = results.every(r => !r.horizontalOverflow && r.heroTextClean && r.storySectionPresent && r.interactiveShuffleWorks && r.stickyPinnedDuringScroll && r.brandColor === 'rgb(37, 99, 235)');
  if (!allPassed || !step5Active || !waLinkValid || !priceBarVisible || !modalOpen || !modalClosed) {
    console.error('FAILED: Verification checks did not pass!');
    process.exit(1);
  }
  console.log('\nSUCCESS: All 6 breakpoints and specialized flows verified cleanly!');
}

run().catch(err => {
  console.error('Error running visual verification:', err);
  process.exit(1);
});
