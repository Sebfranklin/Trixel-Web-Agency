import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SHOWCASES = [
  {
    slug: 'nyx-orbital',
    name: 'NYX Orbital',
    pages: ['index.html', 'platform.html', 'field-notes.html', 'contact.html'],
    css: 'style.css'
  },
  {
    slug: 'loudmouth-studio',
    name: 'Loudmouth Studio',
    pages: ['index.html', 'work.html', 'services.html', 'contact.html'],
    css: 'style.css'
  },
  {
    slug: 'morrow-archive',
    name: 'Morrow Archive',
    pages: ['index.html', 'shop.html', 'journal.html', 'about.html'],
    css: 'style.css'
  },
  {
    slug: 'goodday-club',
    name: 'Goodday Club',
    pages: ['index.html', 'activities.html', 'membership.html', 'contact.html'],
    css: 'style.css'
  },
  {
    slug: 'stillwater-house',
    name: 'Stillwater House',
    pages: ['index.html', 'rooms.html', 'rituals.html', 'enquire.html'],
    css: 'style.css'
  }
];

test('Showcase directories and all multipage assets exist', () => {
  const showcaseBase = path.join(rootDir, 'showcase');
  assert.ok(fs.existsSync(showcaseBase), 'showcase/ directory must exist');

  for (const s of SHOWCASES) {
    const dir = path.join(showcaseBase, s.slug);
    assert.ok(fs.existsSync(dir), `showcase/${s.slug} directory must exist`);

    // CSS file
    const cssPath = path.join(dir, s.css);
    assert.ok(fs.existsSync(cssPath), `${s.slug}/${s.css} must exist`);
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    assert.ok(cssContent.length > 500, `${s.slug}/${s.css} must not be empty`);

    // HTML pages
    for (const page of s.pages) {
      const pagePath = path.join(dir, page);
      assert.ok(fs.existsSync(pagePath), `${s.slug}/${page} must exist`);
      const html = fs.readFileSync(pagePath, 'utf8');
      assert.ok(html.includes('<!doctype html>'), `${s.slug}/${page} must have doctype`);
      assert.ok(html.includes('<title>'), `${s.slug}/${page} must have title`);
      // Return link to Trixeltech
      assert.ok(html.includes('work.html'), `${s.slug}/${page} must include link back to Trixeltech work.html`);
    }
  }
});

test('Internal link integrity: Zero broken relative navigation links across all showcase pages', () => {
  const brokenLinks = [];
  for (const s of SHOWCASES) {
    const dir = path.join(rootDir, 'showcase', s.slug);
    for (const page of s.pages) {
      const html = fs.readFileSync(path.join(dir, page), 'utf8');
      const hrefMatches = html.matchAll(/href="([^"#:]+?)"/g);
      for (const m of hrefMatches) {
        const target = m[1];
        if (target.startsWith('http') || target.startsWith('mailto:') || target.startsWith('#')) continue;
        const resolved = path.resolve(dir, target);
        if (!fs.existsSync(resolved)) {
          brokenLinks.push(`${s.slug}/${page} -> ${target}`);
        }
      }
    }
  }
  assert.deepEqual(brokenLinks, [], `Found broken internal relative links: ${brokenLinks.join(', ')}`);
});

test('Runtime safety: Brand links avoid # DOMException and image URLs are valid', () => {
  for (const s of SHOWCASES) {
    const indexPath = path.join(rootDir, 'showcase', s.slug, 'index.html');
    const html = fs.readFileSync(indexPath, 'utf8');
    assert.ok(!html.includes('class="brand" href="#"'), `${s.slug} brand logo must not use href="#"`);
    assert.ok(!html.includes('Kindern?'), `${s.slug} must not contain malformed image URL strings`);
    assert.ok(!html.includes("</section>'</main>"), `${s.slug} must not contain stray quote markup`);
  }
});

test('Mobile touch targets: Showcase navigation bar and CTAs meet WCAG 44px min-height', () => {
  for (const s of SHOWCASES) {
    const cssPath = path.join(rootDir, 'showcase', s.slug, 'style.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    assert.ok(css.includes('min-height: 44px'), `${s.slug} style.css must configure min-height: 44px for touch targets`);
    assert.ok(css.includes('overflow-x: hidden'), `${s.slug} style.css must prevent horizontal overflow`);
  }

  const workHtml = fs.readFileSync(path.join(rootDir, 'work.html'), 'utf8');
  assert.ok(workHtml.includes('min-height:44px'), 'work.html action buttons must enforce 44px touch target');
});

test('Accessibility: work.html filter buttons declare aria-pressed state', () => {
  const workHtml = fs.readFileSync(path.join(rootDir, 'work.html'), 'utf8');
  assert.ok(workHtml.includes('aria-pressed="true"'), 'work.html active filter must have aria-pressed="true"');
  assert.ok(workHtml.includes('aria-pressed="false"'), 'work.html inactive filters must have aria-pressed="false"');

  const appJs = fs.readFileSync(path.join(rootDir, 'assets', 'app.js'), 'utf8');
  assert.ok(appJs.includes("x.setAttribute('aria-pressed'"), 'app.js must dynamically update aria-pressed');
});

test('Demo studio root index.html is NOT in Trixeltech root', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert.ok(!indexHtml.includes('Five brands.<br><span>Five worlds.</span>'), 'Root index.html must remain Trixeltech, not demo studio index');
  assert.ok(indexHtml.includes('TRIXELTECH'), 'Root index.html must be Trixeltech');
  assert.ok(!fs.existsSync(path.join(rootDir, 'showcase', 'index.html')), 'showcase/index.html must not exist');
});

test('work.html features all 5 showcase demos with launch links', () => {
  const workPath = path.join(rootDir, 'work.html');
  assert.ok(fs.existsSync(workPath), 'work.html must exist');
  const html = fs.readFileSync(workPath, 'utf8');

  for (const s of SHOWCASES) {
    assert.ok(html.includes(`showcase/${s.slug}/`), `work.html must link to showcase/${s.slug}/`);
    assert.ok(html.includes(s.name), `work.html must feature ${s.name}`);
  }
});

test('index.html proof section links to showcase demos', () => {
  const indexPath = path.join(rootDir, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');

  assert.ok(html.includes('showcase/'), 'index.html should link to at least one live showcase demo');
});
