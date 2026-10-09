import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const CORE_PAGES = [
  'index.html',
  'services.html',
  'work.html',
  'pricing.html',
  'how-it-works.html',
  'about.html',
  'faq.html',
  'start.html',
  'terms.html',
  'privacy.html',
  'services/websites.html',
  'services/telegram-bots.html',
  'services/online-stores.html',
  'services/graphics-and-add-ons.html',
  'services/ai-assistants.html'
];

const SHOWCASE_PAGES = [
  'showcase/apex-apparel/index.html',
  'showcase/swiftdrop-bot/index.html',
  'showcase/aura-skin/index.html'
];

test('Crawlability: robots.txt is valid, allows root and references sitemap', () => {
  const robotsPath = path.join(rootDir, 'robots.txt');
  assert.ok(fs.existsSync(robotsPath), 'robots.txt must exist at root');
  const content = fs.readFileSync(robotsPath, 'utf8');

  assert.ok(content.includes('User-agent: *'), 'robots.txt must specify User-agent: *');
  assert.ok(content.includes('Allow: /'), 'robots.txt must allow root crawling');
  assert.ok(content.includes('Sitemap: https://trixeltech.pages.dev/sitemap.xml'), 'robots.txt must point to sitemap.xml');
});

test('Indexing: sitemap.xml indexes all core pages and showcase sites', () => {
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  assert.ok(fs.existsSync(sitemapPath), 'sitemap.xml must exist at root');
  const content = fs.readFileSync(sitemapPath, 'utf8');

  assert.ok(content.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'sitemap.xml must have valid XML header');
  assert.ok(content.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'sitemap.xml must declare urlset namespace');

  for (const page of CORE_PAGES) {
    const urlSegment = page === 'index.html' ? 'https://trixeltech.pages.dev/' : `https://trixeltech.pages.dev/${page}`;
    assert.ok(content.includes(urlSegment), `sitemap.xml must contain entry for ${urlSegment}`);
  }

  assert.ok(content.includes('https://trixeltech.pages.dev/showcase/apex-apparel/'), 'sitemap.xml must include apex-apparel showcase');
  assert.ok(content.includes('https://trixeltech.pages.dev/showcase/swiftdrop-bot/'), 'sitemap.xml must include swiftdrop-bot showcase');
  assert.ok(content.includes('https://trixeltech.pages.dev/showcase/aura-skin/'), 'sitemap.xml must include aura-skin showcase');
});

test('Social Card Assets: og-image.svg and og-image.png exist with valid proportions', () => {
  const svgPath = path.join(rootDir, 'assets', 'og-image.svg');
  const pngPath = path.join(rootDir, 'assets', 'og-image.png');

  assert.ok(fs.existsSync(svgPath), 'assets/og-image.svg must exist');
  assert.ok(fs.existsSync(pngPath), 'assets/og-image.png must exist');

  const pngStats = fs.statSync(pngPath);
  assert.ok(pngStats.size > 20000, `og-image.png should be high-resolution (>20KB), got ${pngStats.size} bytes`);
});

test('Metadata & Canonical completeness across all 15 core pages', () => {
  for (const page of CORE_PAGES) {
    const filePath = path.join(rootDir, page);
    assert.ok(fs.existsSync(filePath), `${page} must exist on disk`);
    const html = fs.readFileSync(filePath, 'utf8');

    // Title
    assert.ok(html.includes('<title>'), `${page} must have a <title> tag`);
    
    // Meta Description
    assert.ok(html.includes('<meta name="description"'), `${page} must have meta description`);

    // Canonical link
    assert.ok(html.includes('<link rel="canonical"'), `${page} must have canonical tag`);

    // Open Graph
    assert.ok(html.includes('property="og:title"'), `${page} must have og:title`);
    assert.ok(html.includes('property="og:description"'), `${page} must have og:description`);
    assert.ok(html.includes('property="og:image"'), `${page} must have og:image`);

    // Twitter Card
    assert.ok(html.includes('name="twitter:card"'), `${page} must have twitter:card`);
  }
});

test('Structured Data: index.html has complete JSON-LD Organization & LocalBusiness schema', () => {
  const indexPath = path.join(rootDir, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');

  assert.ok(html.includes('application/ld+json'), 'index.html must include JSON-LD script');
  assert.ok(html.includes('"@type":"Organization"'), 'Schema must define Organization');
  assert.ok(html.includes('"@type":"LocalBusiness"'), 'Schema must define LocalBusiness');
  assert.ok(html.includes('"telephone":"+2347042998527"'), 'Schema must declare official WhatsApp/phone');
  assert.ok(html.includes('"email":"trixeltechnologies@gmail.com"'), 'Schema must declare official email');
});

test('Interactive Showcase Demos: 3 working showcase sites exist and are fully configured', () => {
  for (const showcase of SHOWCASE_PAGES) {
    const filePath = path.join(rootDir, showcase);
    assert.ok(fs.existsSync(filePath), `${showcase} must exist on disk`);
    const html = fs.readFileSync(filePath, 'utf8');

    assert.ok(html.includes('<meta name="viewport"'), `${showcase} must have responsive viewport meta`);
    assert.ok(html.includes('TRIXELTECH'), `${showcase} must carry Trixeltech branding`);
    assert.ok(html.includes('/work.html') || html.includes('Trixeltech'), `${showcase} must link back to Trixeltech`);
  }
});

test('100-Point Gauntlet Discoverability Target is Achieved (Score >= 95)', () => {
  let score = 0;
  
  // 1. Crawlability & Indexing (20 pts)
  if (fs.existsSync(path.join(rootDir, 'robots.txt'))) score += 10;
  if (fs.existsSync(path.join(rootDir, 'sitemap.xml'))) score += 10;

  // 2. Social Sharing Assets (20 pts)
  if (fs.existsSync(path.join(rootDir, 'assets', 'og-image.svg'))) score += 10;
  if (fs.existsSync(path.join(rootDir, 'assets', 'og-image.png'))) score += 10;

  // 3. Schema Structured Data (20 pts)
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  if (indexHtml.includes('application/ld+json')) score += 10;
  if (indexHtml.includes('"@type":"LocalBusiness"') && indexHtml.includes('"@type":"Organization"')) score += 10;

  // 4. Meta & Canonicals across all 15 pages (20 pts)
  let allPagesHaveMeta = true;
  for (const page of CORE_PAGES) {
    const html = fs.readFileSync(path.join(rootDir, page), 'utf8');
    if (!html.includes('canonical') || !html.includes('og:title') || !html.includes('twitter:card')) {
      allPagesHaveMeta = false;
      break;
    }
  }
  if (allPagesHaveMeta) score += 20;

  // 5. Working Showcase Demos (20 pts)
  let allShowcasesExist = true;
  for (const showcase of SHOWCASE_PAGES) {
    if (!fs.existsSync(path.join(rootDir, showcase))) {
      allShowcasesExist = false;
      break;
    }
  }
  if (allShowcasesExist) score += 20;

  console.log(`\n========================================`);
  console.log(`🎯 GAUNTLET DISCOVERABILITY SCORE: ${score} / 100`);
  console.log(`========================================\n`);

  assert.ok(score >= 95, `Gauntlet target score must be >= 95, achieved ${score}`);
});
