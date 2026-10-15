/**
 * Nav declutter regression test (pass 15).
 * Desktop: 5 links only (Home cut — logo navigates home; FAQ cut — footer covers it),
 * clock + CTA remain, zero overflow.
 * Mobile drawer: Home present (per verify-breakpoints contract), key links reachable,
 * drawer not scrollable, zero overflow.
 * Footer still exposes FAQ + Home so nothing becomes unreachable.
 */
import { chromium } from '/system/conda/node/nvm/versions/node/v22.23.2/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const CHROME = '/home/zeus/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const results = [];

async function snapshot(width, height, mobile) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  await page.goto('file://' + path.join(rootDir, 'index.html'), { waitUntil: 'networkidle' });
  const d = {};
  d.topLinks = await page.evaluate(() => {
    const nav = document.querySelector('#navlinks');
    const st = getComputedStyle(nav);
    if (st.display === 'none') return 'NAV_HIDDEN';
    return Array.from(nav.querySelectorAll(':scope > a'))
      .filter(a => getComputedStyle(a).display !== 'none')
      .map(a => a.textContent.trim());
  });
  d.legible = await page.evaluate(() => {
    const out = {};
    const clock = document.querySelector('.nav-clock');
    const cta = document.querySelector('.navcta');
    const menu = document.querySelector('#menu');
    out.clockVisible = !!clock && clock.getBoundingClientRect().width > 0;
    out.ctaVisible = !!cta && getComputedStyle(cta).display !== 'none';
    out.hamburgerOnMobile = !!menu && getComputedStyle(menu).display !== 'none';
    const faqNav = Array.from(document.querySelectorAll('#navlinks > a[href="faq.html"]'));
    out.faqNavVisible = faqNav.some(a => getComputedStyle(a).display !== 'none');
    const homeLinks = Array.from(document.querySelectorAll('#navlinks a')).filter(a => a.textContent.trim() === 'Home');
    out.homeDesktopVisible = homeLinks.some(a => getComputedStyle(a).display !== 'none' && a.getBoundingClientRect().width > 0);
    const ctaLike = Array.from(document.querySelectorAll('.navlinks a, .nav a.navcta'))
      .filter(a => {
        const s = getComputedStyle(a);
        return s.display !== 'none' && a.getBoundingClientRect().width > 0 && /start a project|chat on whatsapp/i.test(a.textContent);
      });
    out.ctaCount = ctaLike.length;
    out.footerHasFaq = !!document.querySelector('.footer a[href="faq.html"]');
    out.noHOverflow = document.documentElement.scrollWidth <= innerWidth;
    return out;
  });
  if (mobile) {
    await page.click('#menu');
    await page.waitForTimeout(250);
    d.drawer = await page.evaluate(() => {
      const nav = document.querySelector('#navlinks');
      if (!nav.classList.contains('open')) return { open: false };
      const links = Array.from(nav.querySelectorAll('a')).map(a => a.textContent.trim());
      return {
        open: true,
        hasHome: links.includes('Home'),
        hasServices: links.includes('Services'),
        hasPricing: links.includes('Pricing'),
        noScroll: nav.scrollHeight <= nav.clientHeight + 2,
        noHOverflow: document.documentElement.scrollWidth <= innerWidth
      };
    });
  }
  await context.close();
  return d;
}

// Desktop 1440
const desk = await snapshot(1440, 900, false);
results.push({
  device: 'Desktop 1440x900',
  links: JSON.stringify(desk.topLinks) === JSON.stringify(['Services', 'Work', 'Pricing', 'How it works', 'About']) ? 'OK' : `FAIL(${desk.topLinks.join(',')})`,
  clock: desk.legible.clockVisible ? 'OK' : 'FAIL',
  cta: desk.legible.ctaVisible ? 'OK' : 'FAIL',
  homeHidden: !desk.legible.homeDesktopVisible ? 'OK' : 'FAIL(visible)',
  faqGone: !desk.legible.faqNavVisible ? 'OK' : 'FAIL(visible)',
  footerFaq: desk.legible.footerHasFaq ? 'OK' : 'FAIL',
  overflow: desk.legible.noHOverflow ? 'OK' : 'FAIL',
  drawer: 'n/a'
});

// Mobile 375
const mob = await snapshot(375, 812, true);
const dr = mob.drawer || {};
results.push({
  device: 'MobileS 375x812',
  links: 'n/a',
  clock: mob.legible.clockVisible ? 'OK' : 'FAIL',
  cta: mob.legible.hamburgerOnMobile ? 'OK' : 'FAIL',
  homeHidden: !desk.legible.homeDesktopVisible && (dr.hasHome === true) ? 'OK' : `FAIL(deskV=${desk.legible.homeDesktopVisible},drawerHome=${dr.hasHome})`,
  faqGone: !mob.legible.faqNavVisible ? 'OK' : 'FAIL(visible)',
  footerFaq: mob.legible.footerHasFaq ? 'OK' : 'FAIL',
  overflow: mob.legible.noHOverflow && (dr.noHOverflow !== false) ? 'OK' : 'FAIL',
  drawer: dr.open && dr.noScroll && dr.hasServices && dr.hasPricing ? 'OK' : `FAIL(open=${dr.open},scroll=${dr.noScroll})`
});

await browser.close();
console.table(results);
const bad = results.filter((r) => Object.entries(r).some(([k, v]) => k !== 'device' && String(v).startsWith('FAIL')));
console.log(bad.length === 0 ? '\nSUCCESS: nav declutter verified.' : '\nPROBLEMS:\n' + bad.map(r => JSON.stringify(r)).join('\n'));
process.exit(bad.length === 0 ? 0 : 1);
