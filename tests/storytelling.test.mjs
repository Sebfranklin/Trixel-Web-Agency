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
