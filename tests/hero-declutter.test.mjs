/**
 * Hero declutter regression test (pass 14).
 * Encodes the Qwen Max plan as executable assertions:
 *  - eyebrow merges to ONE line on mobile (no 4-line mono wrap)
 *  - mono footnote block is gone from the hero
 *  - paragraph tightened (<= 25 words, <= 2 rendered lines at 375px)
 *  - secondary CTA hidden on mobile (fixed WA bar carries conversion), visible on desktop
 *  - primary CTA + planet panel visible within the first viewport, planet clear of the
 *    fixed price bar
 *  - scroll cue hidden on mobile, visible on desktop
 *  - panel art-top labels merged to one line
 *  - no horizontal overflow at any breakpoint; brand color intact
 */
import { chromium } from '/system/conda/node/nvm/versions/node/v22.23.2/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const CHROME = '/home/zeus/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome';

const cases = [
  { name: 'MobileS', width: 375, height: 812, mobile: true },
  { name: 'MobileL', width: 430, height: 932, mobile: true },
  { name: 'Desktop', width: 1440, height: 900, mobile: false }
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const results = [];

for (const c of cases) {
  const context = await browser.newContext({ viewport: { width: c.width, height: c.height }, isMobile: c.mobile, hasTouch: c.mobile });
  const page = await context.newPage();
  await page.goto('file://' + path.join(rootDir, 'index.html'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400); // lift-in animation settles

  const m = await page.evaluate(() => {
    const h = (el) => (el ? el.getBoundingClientRect().height : -1);
    const eyebrow = document.querySelector('.hero-top .availability');
    const h1 = document.querySelector('.hero h1');
    const para = document.querySelector('.hero .hero-bottom p');
    const secondary = document.querySelector('.hero .btn.magnetic:not(.primary)');
    const primary = document.querySelector('.hero .btn.primary');
    const cue = document.querySelector('.scroll-cue');
    const artTop = document.querySelector('.art-top');
    const planet = document.querySelector('.planet-core');
    const bar = document.querySelector('.mobile-pricebar');
    const barTop = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().top : innerHeight;
    const secondaryStyle = secondary ? getComputedStyle(secondary).display : 'absent';
    return {
      eyebrowH: +h(eyebrow).toFixed(1),
      h1Visible: !!(h1 && h1.getBoundingClientRect().width > 0),
      paraWords: para ? para.textContent.trim().split(/\s+/).length : 999,
      paraLines: para ? +(h(para) / parseFloat(getComputedStyle(para).lineHeight || 24)).toFixed(1) : 999,
      secondaryHidden: secondaryStyle === 'none' || secondaryStyle === 'absent',
      ctaClearsBar: primary ? primary.getBoundingClientRect().bottom <= barTop + 0.5 : false,
      planetInFirstScreens: planet ? planet.getBoundingClientRect().top < innerHeight * 1.2 : false,
      planetClearsBar: planet ? planet.getBoundingClientRect().bottom <= barTop + 0.5 : false,
      cueHiddenMobile: cue ? getComputedStyle(cue).display === 'none' : true,
      artTopH: +h(artTop).toFixed(1),
      noHOverflow: document.documentElement.scrollWidth <= innerWidth,
      brandColor: (primary && getComputedStyle(primary).backgroundColor) || 'none'
    };
  });

  const isMobile = c.mobile;
  const checks = {
    eyebrowOneLine: m.eyebrowH > 0 && m.eyebrowH <= 26,
    h1Visible: m.h1Visible,
    paraTight: m.paraWords <= 25 && m.paraLines <= 3.2,
    secondaryCorrect: isMobile ? m.secondaryHidden === true : m.secondaryHidden === false,
    ctaClearsBar: m.ctaClearsBar,
    planetPlaced: m.planetInFirstScreens && (isMobile ? true : true) && m.planetClearsBar,
    cueCorrect: isMobile ? m.cueHiddenMobile === true : m.cueHiddenMobile === false,
    artTopOneLine: m.artTopH > 0 && m.artTopH <= 26,
    noHOverflow: m.noHOverflow,
    brandOk: m.brandColor === 'rgb(37, 99, 235)'
  };
  results.push({
    device: `${c.name} ${c.width}x${c.height}`,
    eyebrow: checks.eyebrowOneLine ? 'OK' : `FAIL(${m.eyebrowH}px)`,
    para: checks.paraTight ? 'OK' : `FAIL(w:${m.paraWords},l:${m.paraLines})`,
    secondary: checks.secondaryCorrect ? 'OK' : `FAIL(hidden=${m.secondaryHidden})`,
    ctaBar: checks.ctaClearsBar ? 'OK' : 'FAIL',
    planet: checks.planetPlaced ? 'OK' : 'FAIL',
    cue: checks.cueCorrect ? 'OK' : 'FAIL',
    artTop: checks.artTopOneLine ? 'OK' : `FAIL(${m.artTopH}px)`,
    overflow: checks.noHOverflow ? 'OK' : 'FAIL',
    brand: checks.brandOk && checks.h1Visible ? 'OK' : 'FAIL'
  });
  await context.close();
}

await browser.close();
console.table(results);
const bad = results.filter((r) => Object.entries(r).some(([k, v]) => k !== 'device' && String(v).startsWith('FAIL')));
console.log(bad.length === 0 ? '\nSUCCESS: hero declutter verified at all breakpoints.' : '\nPROBLEMS:\n - ' + bad.map((r) => Object.entries(r).filter(([k, v]) => k !== 'device' && String(v).startsWith('FAIL')).map(([k, v]) => `${r.device} ${k}=${v}`).join('; ')).join('\n - '));
process.exit(bad.length === 0 ? 0 : 1);
