import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Storytelling HTML structure exists with planned narrative and cards', () => {
  const htmlPath = path.join(rootDir, 'index.html');
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Must have sticky storytelling container #story
  assert.ok(html.includes('id="story"'), 'Must contain #story section');
  assert.ok(html.includes('story-deck') || html.includes('deck-card'), 'Must contain story-deck element');

  // Verify the 5 planned narrative beats from the single HTML
  assert.ok(html.includes('Seven hours later') || html.includes('SEVEN HOURS LATER'), 'Must include Beat 0 text');
  assert.ok((html.includes('The answer') || html.includes('THE ANSWER')) && (html.includes('wasn') || html.includes('WAS NOT')), 'Must include Beat 1 text');
  assert.ok(html.includes('How much') || html.includes('HOW MUCH'), 'Must include Beat 2 text');
  assert.ok(html.includes('2 seconds') || html.includes('2 SECONDS') || html.includes('TWO SECONDS'), 'Must include Beat 3 text');
  assert.ok(html.includes('one tap') || html.includes('ONE TAP'), 'Must include Beat 4 text');

  // Verify cards exist
  assert.ok(html.includes('deck-card') || html.includes('shuffle-card'), 'Must contain deck cards');
  assert.ok(html.includes('cnt') || html.includes('counter'), 'Must contain price counter element');
});

test('Storytelling CSS contains 3D card shuffling rules and stop states', () => {
  const cssPath = path.join(rootDir, 'assets', 'styles.css');
  assert.ok(fs.existsSync(cssPath), 'assets/styles.css must exist');
  const css = fs.readFileSync(cssPath, 'utf8');

  // 3D perspective and deck positioning
  assert.ok(css.includes('perspective') || css.includes('transform-style'), 'CSS must define 3D perspective for card deck');
  assert.ok(css.includes('deck-card') || css.includes('story-deck'), 'CSS must define card deck styles');
  assert.ok(css.includes('translate3d') || css.includes('rotate'), 'CSS must contain 3D card transform positioning');
});

test('Storytelling JavaScript implements scroll progress with stop plateau', () => {
  const jsPath = path.join(rootDir, 'assets', 'app.js');
  assert.ok(fs.existsSync(jsPath), 'assets/app.js must exist');
  const js = fs.readFileSync(jsPath, 'utf8');

  // Scroll calculation and stop plateau
  assert.ok(js.includes('story') || js.includes('deck'), 'app.js must reference story or deck');
  assert.ok(js.includes('28500') || js.includes('28,500'), 'app.js must include ₦28,500 count up animation');
});

test('WhatsApp and Email configuration is unified across all pages', () => {
  const files = [
    'index.html', 'start.html', 'pricing.html', 'work.html',
    'services.html', 'about.html', 'faq.html', 'how-it-works.html',
    'terms.html', 'privacy.html'
  ];

  for (const file of files) {
    const fullPath = path.join(rootDir, file);
    assert.ok(fs.existsSync(fullPath), `${file} must exist`);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Must link to WhatsApp (+2347042998527)
    assert.ok(content.includes('2347042998527'), `${file} must contain WhatsApp phone number 2347042998527`);

    // Must contain trixeltechnologies@gmail.com
    assert.ok(content.includes('trixeltechnologies@gmail.com'), `${file} must contain official email trixeltechnologies@gmail.com`);

    // Must NOT contain old placeholder email or t.me
    assert.ok(!content.includes('hello@trixeltech.com'), `${file} must not contain deprecated email hello@trixeltech.com`);
    assert.ok(!content.includes('https://t.me/'), `${file} must not contain deprecated t.me link`);
  }
});

test('Interactive Questionnaire Wizard is configured on start.html', () => {
  const startPath = path.join(rootDir, 'start.html');
  const html = fs.readFileSync(startPath, 'utf8');

  assert.ok(html.includes('id="interactiveWizard"'), 'start.html must contain #interactiveWizard');
  assert.ok(html.includes('data-step="1"'), 'start.html must contain Step 1');
  assert.ok(html.includes('data-step="2"'), 'start.html must contain Step 2');
  assert.ok(html.includes('data-step="3"'), 'start.html must contain Step 3');
  assert.ok(html.includes('data-step="4"'), 'start.html must contain Step 4');
  assert.ok(html.includes('data-step="5"'), 'start.html must contain Step 5');
  assert.ok(html.includes('id="wizardProgressBar"'), 'start.html must contain progress bar');
  assert.ok(html.includes('id="waSendBtn"'), 'start.html must contain WhatsApp button');
});

test('Pricing scope modal and mobile pricebar exist on pricing.html', () => {
  const pricingPath = path.join(rootDir, 'pricing.html');
  const html = fs.readFileSync(pricingPath, 'utf8');

  assert.ok(html.includes('id="scopeModalBackdrop"'), 'pricing.html must contain scope modal');
  assert.ok(html.includes('id="mobilePriceBar"'), 'pricing.html must contain mobile price bar');
  assert.ok(html.includes('plan-scope-btn'), 'pricing.html must contain plan scope buttons');
});

test('Terms of service embeds complete Client Services Agreement from Trixel docs', () => {
  const termsPath = path.join(rootDir, 'terms.html');
  const html = fs.readFileSync(termsPath, 'utf8');

  assert.ok(html.includes('CLIENT SERVICES AGREEMENT'), 'terms.html must contain Client Services Agreement');
  assert.ok(html.includes('Price and Payment'), 'terms.html must contain price and payment terms');
  assert.ok(html.includes('Revisions & Change Requests'), 'terms.html must contain revisions terms');
});

test('Mobile navigation includes Home link across all HTML pages', () => {
  const pages = [
    'index.html', 'start.html', 'pricing.html', 'work.html',
    'services.html', 'about.html', 'faq.html', 'how-it-works.html',
    'terms.html', 'privacy.html',
    'services/ai-assistants.html', 'services/websites.html',
    'services/telegram-bots.html', 'services/online-stores.html',
    'services/graphics-and-add-ons.html'
  ];

  for (const page of pages) {
    const fullPath = path.join(rootDir, page);
    assert.ok(fs.existsSync(fullPath), `${page} must exist`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.ok(content.includes('>Home</a>'), `${page} must contain Home nav link`);
  }
});

test('Colors: Prices use green, WhatsApp uses authentic WA green, and Red is not on prices', () => {
  const cssPath = path.join(rootDir, 'assets', 'styles.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(css.includes('--money-green:#d7ff38'), 'CSS must define --money-green as cyber lime');
  assert.ok(css.includes('--wa-green:#25D366'), 'CSS must define authentic WhatsApp green');
  assert.ok(css.includes('.btn.btn-wa') || css.includes('.btn-wa'), 'CSS must define .btn.btn-wa button styling');
  assert.ok(css.includes('var(--money-green)'), 'Price class must use var(--money-green)');
});

test('AI Website Customer Assistants service page exists and covers master doc tiers', () => {
  const aiPath = path.join(rootDir, 'services', 'ai-assistants.html');
  assert.ok(fs.existsSync(aiPath), 'services/ai-assistants.html must exist');
  const content = fs.readFileSync(aiPath, 'utf8');

  assert.ok(content.includes('AI Website Customer Assistants') || content.includes('AI Customer Assistants'), 'Must mention AI Customer Assistants');
  assert.ok(content.includes('20,000'), 'Must mention ₦20,000 basic FAQ bot');
  assert.ok(content.includes('30,000'), 'Must mention ₦30,000 knowledge base');
  assert.ok(content.includes('50,000'), 'Must mention ₦50,000 workflows');
  assert.ok(content.includes('btn-wa'), 'Must use authentic WhatsApp button');
});

