# Handoff — Graphics showcase carousel (TrixelTech homepage)

**Date:** 2026-10-14 (pass 13 added 2026-10-15)
**Site:** `trixeltech/website/` (branch `feature/mobile-whatsapp-docs-flow`)
**Preview:** https://twins-math-refers-newbie.trycloudflare.com (current live preview)
**Status:** Built, verified at 6 breakpoints, visually reviewed, **awaiting your approval before deploy**

---

## Revision 6 — cards must never move vertically (pass 13)

Reported on a real phone: *"on mobile the images scrolling is great but the top of the image
cards slightly enters under the 'brand work. Built to sell' — the cards should not move
vertically."*

### Root cause (measured — two bugs stacking)

1. **The rail was vertically pannable.** `overflow-x:auto` computes `overflow-y` to `auto`
   per the CSS spec, so the rail — a scroll container — could pan vertically.
2. **vh vs svh mismatch.** Card art is sized with `vh` units while the pinned panel is sized
   with `svh`. A real phone's browser chrome makes `vh > svh`, so cards were guaranteed taller
   than the rail's leftover space. Pass 12's `z-index:1` on the intro then painted the heading
   above the panned-up cards — exactly the reported symptom (paint-order patch, not geometry).

Playwright's emulated viewport has no browser chrome (`vh == svh`), which is why four test
suites and six breakpoints never caught it. The latent signature was visible: `scrollHeight`
exceeded `clientHeight` by 8px at 375×812.

Measured with 120px chrome simulated: cards overflowed the rail by **100–111px on every phone
size** (e.g. 413px content in a 305px rail at 390×844) — the maximum distance card tops could
slide beneath the headline.

### Fix (assets/styles.css, pass 13)

```css
.graphics-rail{overflow-y:hidden;touch-action:pan-x pan-y;grid-auto-rows:100%}
.graphics-card{height:100%}
.graphics-art{height:auto;flex:1 1 auto;min-height:0}
```

- `overflow-y:hidden`: the rail itself cannot finger-scroll vertically (and the fitted
  layout below leaves zero scroll range — nothing to reveal even programmatically).
- `touch-action:pan-x pan-y` — **not** the stricter `pan-x`. Correction from on-device
  feedback after the first cut: `touch-action` intersects across the element chain, so
  `pan-x` removed `pan-y` from gestures born on the cards — and since the pinned rail is
  DRIVEN by page scroll, the slide froze whenever a finger rested on an image
  ("scrolling upwards on the images doesn't slide, only if I'm outside the images").
  `pan-y` lets vertical gestures rise to the page scroller, which the drive converts into
  rail travel; the rail still cannot pan vertically because of `overflow-y:hidden`.
  (Synthetic-event tests bypass native gesture arbitration, which is why the suite stayed
  green while the device regressed.)
- `grid-auto-rows:100%` + stretched cards + flexing art: when a real phone's chrome squeezes
  the panel, the ART absorbs the squeeze (`min-height:0`) so card tops never leave the rail box
  and labels never clip. When there is room, the aspect-ratio frame keeps the exact pass-11
  composition unchanged.

### Verification

- **New regression test: `tests/graphics-vertical-lock.test.mjs`** — 4 phone sizes, each
  asserting: computed `overflow-y:hidden`, `touch-action:pan-x pan-y`, programmatically-set
  `scrollTop=60` clamps back to 0, and every card fits its rail box under simulated chrome.
  RED before the fix (overflowY=auto, scroll stuck at 60, 100px overflow), GREEN after.
- All four existing suites still green: `graphics-pin-fit`, `graphics-carousel`,
  `graphics-smoothness`, `graphics-touch`.
- `tests/verify-breakpoints.mjs`: all 6 breakpoints, mobile zero-scroll nav, clean.
- Visual: mid-sweep captures at 375×812 and 390×844-with-120px-chrome-sim
  (`tests/screenshots/graphics-pinned-mid-Mobile_S.png`,
  `tests/screenshots/graphics-chrome-simMobile.png`) — headline zone clear (9px gap),
  labels intact, CTA clear of the fixed price bar.

---

## Revision 5 — larger cards

Reported: *"can we make each of those cards a bit bigger."*

Measurement showed why they were small: card height is bounded by the pinned panel, and the
smallest common phone (**375×667 had 0px slack**) was setting the ceiling for every larger screen.
Taller phones were leaving their spare height unused.

Fix: cards now scale with viewport height, and short screens get a compact tier that drops the
intro paragraph to buy back room for the artwork rather than shrinking it.

| Viewport | Card width before | after | Change |
|---|---|---|---|
| 390×844 | 215px | **247px** | +15% |
| 430×932 | 225px | **259px** | +15% |
| 768×1024 | 285px | **323px** | +13% |
| 375×560 | 101px | **139px** | +38% |
| 375×667 | 170px | 165px | −3% (compact tier; paragraph dropped) |
| 1440×900 | 311px | 311px | unchanged — this size has zero slack |

Fewer cards are visible at once as a result (1.8 → 1.6 on a 390px phone), which is expected and
matches what the earlier visual review recommended.

---

## Revision 4 — smooth scroll

Reported: *"the scroll should be smooth, not seem like breaking."*

Two causes, both measured:

1. **`scroll-snap-type` was fighting the drive.** The rail inherited `x mandatory` from the
   site's unused `.work-slider`. Mandatory snap forces the rail to the nearest card on *every*
   programmatic `scrollLeft` write, so the position was continuously being yanked. Relaxing it to
   `proximity` cut the worst frame; removing snap entirely cut it further.
2. **The position was written straight from the scroll event**, so it inherited the coarse
   granularity of scroll delivery. It now eases toward its target on its own
   `requestAnimationFrame` loop (`EASE = 0.14`), decoupled from scroll-event timing.

Measured per-frame, sampled 182 frames across the full pinned sweep at 390×844:

| | Before | After |
|---|---|---|
| Largest single-frame jump | 228px | **17px** |
| As share of total travel | 8.36% | **0.63%** |
| Backward steps (stutter) | 0 | 1 |
| Settles at full travel | 100% | **100%** |

A 13× reduction. The 228px jump was almost exactly one card width — the signature of snap
re-engaging mid-sweep.

The pinned region was also lengthened (440vh desktop / 400vh tablet / 360vh mobile) so the rail
travels slower per unit of page scroll, which reads as smoother.

**Regression note:** `graphics-carousel.test.mjs` previously asserted `scroll-snap-type:mandatory`.
That assertion is now inverted to expect `none`, with the reason recorded inline — the old
expectation would have blocked this fix.

New test: **`tests/graphics-smoothness.test.mjs`** samples `rail.scrollLeft` once per animation
frame while scrolling the pinned span and asserts monotonic motion, no frame covering more than 5%
of total travel, and full travel reached on settle. This is the guard that would catch snap being
reintroduced.

---

## Revision 3 — mobile corrections after feedback

Reported: *"looks horrible on mobile, some stuff are hidden"* and *"if my hand is touching the
images while scrolling they don't scroll to side"*.

### The freeze bug (worst of these, and self-inflicted)

I had treated **any** touch on the rail as "manual interaction" and suspended the scroll drive for
1.2s. So resting a finger on a card while scrolling froze the carousel — exactly the reported
symptom. Fixed by making the override **direction-aware**: only a gesture that is predominantly
*horizontal* (|dx| > |dy|, past a 6px threshold) counts as a swipe. A vertical drag now leaves the
drive running. Same rule applied to wheel events (`deltaX` vs `deltaY`).

Verified by synthetic gesture in `tests/graphics-touch.test.mjs`:

| Gesture on a card | Rail | Result |
|---|---|---|
| Vertical drag, then page scroll | 1363 → 1591 | advances (fixed) |
| Horizontal swipe, then page scroll | 1363 → 1363 | drive yields (correct) |

### Other fixes

| Issue | Cause | Fix |
|---|---|---|
| Peek card's label sliced to "FLY" / "BR" at the screen edge | Hard-cut by the viewport | Right-edge `mask-image` fade so the clipped card dissolves; fade removed at the end of the rail |
| First card sat 18px left of the headline | `scroll-snap-align:start` snaps to the container's padding edge | `scroll-padding-inline:var(--pad)` |
| CTA slid under the fixed price bar on short viewports | **`min-height:520px` on the pin overrode `calc(100svh - var(--nav))`**, making the panel 18px taller than a 560px screen | `min-height:0`; height now follows the viewport exactly; extra short-height tier added |
| Dead band under the CTA | 84px padding clearing a 66px bar | Reduced to 70px |
| Arrow buttons near-invisible | Inherited `--line` is ~18% alpha on near-black | Stronger border on `.graphics-nav .deck-btn` only |
| Captions too small on mobile | Over-tightened in the previous pass | Restored larger: name ~18px, category 10px, 68px caption box |

### Three claims from the visual review that measurement disproved

Recorded so they are not "fixed" later:

1. "Progress bar only reaches ⅔" — measured `barPct: 100` at the end.
2. "Price bar vanishes at the end" — measured `pricebarVisible: true` at every position.
3. "Caption rows are ragged" — measured caption heights `56/56/56`, identical.

Treating those as real would have introduced regressions.

### Verification added

- `tests/graphics-pin-fit.test.mjs` — 10 viewport sizes including real phone heights with browser
  chrome (390×844, 375×667, 360×600, 375×560, 360×520). Asserts overflow in **both** directions
  box-to-box (a centred flex container hides top overflow from `scrollHeight`), that the panel
  never extends past the screen, that the first card shares the headline's grid line, and that the
  CTA clears the fixed bar.
- `tests/graphics-touch.test.mjs` — the direction-aware gesture rules above.

Four changes after first review. **All verified; the preview reflects this revision.**

## Revision 2 — pinned scroll, full-image view, click to expand

Four changes after first review. All verified; the preview reflects the latest revision.

### 1. The section is now PINNED (this was the reported bug)

The first implementation scrubbed the rail sideways while the page kept scrolling. The
requirement is the opposite: the page should **stop**, the rail should travel **leftwards**, then
the page should **resume** — the mechanic the site already uses in `.story-section`.

Rebuilt as a tall wrapper + sticky inner panel:

```css
.graphics-scroll{position:relative;height:400vh}          /* 320vh on mobile */
.graphics-pin{position:sticky;top:var(--nav);height:calc(100svh - var(--nav))}
```

Progress through the wrapper maps to the rail's full horizontal travel. Measured at 375×812:

| Scroll progress | Pin top | Pin held? | Rail position |
|---|---|---|---|
| 0% | 58px | yes | 1% |
| 25% | 58px | yes | 25% |
| 50% | 58px | yes | 49% |
| 75% | 58px | yes | 74% |
| 100% | 58px | yes | 100% |

Pin holds still throughout; rail advances monotonically to full travel. **Deliberately not
scroll-jacking** — page scroll is never blocked, and any direct interaction with the rail (swipe,
wheel, or the step arrows) suspends the drive for 1.2s so a manual step isn't yanked back.

**Cards are height-driven** (`--art-h`, width derived via the 3:4 ratio) so the whole composition
always fits the pinned viewport. Asserted: `pinFits: OK` — zero overflow at all six breakpoints.

### 2. Every design now shows in full (no cropping)

Changed `object-fit:cover` → `contain`. Mixed orientations letterbox inside the fixed frame
instead of being cropped, so no design is ever cut. Visual review confirmed the letterboxing on
the dark card body "reads as deliberate gallery matting", not a broken image, and that no design
is distorted (verified circles stay circular, full footers visible).

### 3. Click any card to view it full size

Cards are now `<button>` elements opening a lightbox that reuses the site's existing modal
pattern (`.scope-modal-backdrop` / `.scope-modal-close`). Full-size image, client name, category,
and a CTA through to the graphics page. Closes on ✕, backdrop click, or **Escape**; returns focus
to the card that opened it; locks body scroll while open.

### 4. Best-fitting orientation first

The rail is ordered by aspect-ratio distance from the 3:4 frame, closest first —
`tempo-music-academy` (0.747) leads, then the other portrait pieces, with landscape work last
(they letterbox most). Asserted as `bestFitFirst: OK` at every breakpoint.

### Defects found and fixed in this revision

| Defect | How it was found | Fix |
|---|---|---|
| Rail reset itself immediately after an arrow click | Test failure `arrowMoves` | Interaction cooldown so manual steps survive |
| Scroll-drive suppressed by an earlier card click | Test failure `scrollDrive` | Cooldown made short and scoped; drive test moved to a clean context |
| **Lightbox clipped its own caption and CTA** — `overflow:hidden` cut 35px at 1440×900; CTA bottom 844 vs panel bottom 833 | Geometry measurement | Cap image to `62vh` (`50vh` mobile) + `overflow-y:auto` safety net. Now `clippedPx: 0` at all six breakpoints |
| "VIEW" affordance invisible on touch and in static capture | Visual review | Always faintly visible, brightens on hover/focus |

**Rejected as a false positive:** the visual reviewer reported the mobile lightbox was uncovered,
covered by the price bar, and had no visible ✕. Measurement showed the backdrop is
`position:fixed`, `inset:0`, `z-index:120` against the bar's `38`, with close/caption/CTA all in
view. No change made.

### Verification added

`tests/graphics-carousel.test.mjs` now asserts, per breakpoint: clickable card count, computed
`object-fit:contain`, first-card aspect fit, `position:sticky` on the pin, pin overflow ≤1px,
plus behavioural tests for lightbox open/close/Escape/scroll-lock and scroll-driven rail advance.

---

## What was asked

Showcase the 14 images in `graphics/` on the homepage as a carousel that slides as the user
scrolls (mobile-first), with a redirect link to the graphics design section. Preview link first;
deploy only after approval.

---

## What was delivered

**A new `.graphics` section on the homepage**, inserted between the existing `WORK` and `PRICING`
sections.

| Piece | Detail |
|---|---|
| Images | 14 WebP files staged to `assets/graphics/` (2.0 MB total, lazy-loaded) |
| Rail | Native CSS scroll-snap carousel — swipe/scroll to slide |
| Cards | Design image + client name + category label (`FLYER` / `BRAND`) |
| Controls | Progress bar + prev/next arrows |
| CTA | → `services/graphics-and-add-ons.html` |
| Section number | `05 / GRAPHICS`; pricing renumbered `05` → `06` for coherence |

### Files changed

```
 M index.html                              — new section, 14 cards
 M assets/styles.css                        — carousel styles (appended)
 M assets/app.js                            — progress sync + arrow stepping (appended)
?? assets/graphics/                        — 14 WebP images
?? tests/graphics-carousel.test.mjs        — new verification suite
```

**Not committed.** Working tree left dirty so you can review the diff. Nothing deployed.

---

## Key design decision (worth your confirmation)

**No new visual style was introduced.** The site already has a locked design system in
`styles.css` (`--bg:#080a0f`, `--royal:#2563eb`, `--accent:#d7ff38`, Archivo Black display,
Manrope body, DM Mono labels, 1px hairline borders). Per AGENTS.md §5 the goal is zero visual
drift, so the carousel binds to those existing tokens.

It also **reuses CSS that was already in the file but never used** — `.work-slider`'s scroll-snap
mechanics and the `.deck-btn` / `.deck-progress-bar` controls. Ponytail: reuse before inventing.

**The one subjective choice:** images are cropped with `object-fit:cover` at a 3/4 ratio so the
rail reads as a uniform editorial grid. This means tall flyers are cropped top/bottom in the
carousel (full artwork remains on the graphics page). **If you'd rather show every design
uncropped, it's a one-line change** — `.graphics-art img{object-fit:contain}`. Say the word.

---

## Verification

### Automated — 6 breakpoints, all green

`tests/graphics-carousel.test.mjs` (new) and `tests/verify-breakpoints.mjs` (existing, no regressions).

| Breakpoint | Section | Cards | Images | Scrollable | Page overflow | Snap | CTA | Tap target | Arrow moves | Bar syncs |
|---|---|---|---|---|---|---|---|---|---|---|
| Mobile_S 375 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Mobile_L 430 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Tablet 768 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Laptop 1280 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Desktop 1440 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Wide 1920 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |

**Console errors: NONE.** Images: 14/14 loaded at every width.

```bash
node tests/graphics-carousel.test.mjs     # carousel-specific
node tests/verify-breakpoints.mjs          # existing suite, regression check
```

### Visual QA — vision model review, 4 real defects found and fixed

A vision-capable subagent inspected all six screenshots. It found four genuine defects that the
DOM-level tests could not see, all now fixed:

| # | Defect | Fix |
|---|---|---|
| 1 | **Staircased card bottoms** — a two-line client name grew its caption, so card bottoms misaligned across the rail (Tablet/Laptop/Desktop/Wide) | Fixed caption height (`min-height:68px`, vertically centred) |
| 2 | **Orphaned word wrap** — "EVERGREEN LAWN / CO" left a 2-letter widow | `text-wrap:balance` on card titles |
| 3 | **Tablet headline squeeze** — the shared `.section-intro` crushed the headline into a 4-line column with a dead zone beside it | Stack that intro for `.graphics` only at ≤900px |
| 4 | **Fixed mobile price bar overlapped the section foot** — measured 59px of overlap at 375px, covering the CTA | `padding-bottom:92px` on `.graphics` at ≤760px |

**Fix 4 measurement note.** After the fix, overlap at an arbitrary mid-scroll position still
reads 19px at 375px. That is **not a residual defect**: the section is taller than the viewport, so
at intermediate scroll offsets its foot necessarily sits under the always-fixed bottom bar. Measured
at the position a user actually reaches — the end of the section — the result is clean:

| At 375×812, section end | Value |
|---|---|
| Fixed bar top | 746px |
| CTA bottom | 693px → **clear by 53px** |
| Arrows bottom | 632px → **clear by 114px** |

Verified with `scroll-behavior` forced to `auto` (the site's global `scroll-behavior:smooth` makes
scripted `scrollTo` measurements unreliable — it silently returns pre-animation values). Worth
knowing for any future scroll-position assertion on this site.

**One reported issue was rejected after measurement.** The reviewer estimated the mobile arrows at
~26×27px (below the 44px floor). Direct measurement showed **44×44px** — the estimate was wrong,
no change made. This is recorded because the instinct to "fix" a false positive would have
regressed a correct value.

### Quality gates

| Gate | Result |
|---|---|
| `playwright` 6 breakpoints | PASS (both suites) |
| Console errors | NONE |
| `fallow audit` | Ran — all findings flagged **"inherited styling debt from HEAD"**; only new hits were `unused_file` + `unresolved_import` on the new test file (both expected: it's a standalone Playwright script) |
| Mobile tap targets ≥44px | PASS (measured) |
| Page-level horizontal overflow | NONE at any width |
| Secrets scan | Clean — no credentials in any public file |

---

## Reusable capability discovered

`graphics-carousel.test.mjs` is a **generic scroll-snap carousel verifier**: it checks element
presence, card count, real image decode (`naturalWidth`), scrollability, page overflow, snap mode,
CTA target, tap-target size, arrow movement, and progress sync — at all six AGENTS.md breakpoints.
Copy it for any future rail/carousel work.

---

## Risks and notes

1. **Not deployed.** Nothing pushed, nothing published to Cloudflare. The tunnel is a temporary
   preview only and dies with this session.
2. **Preview tunnel is account-less** — no uptime guarantee, `trycloudflare.com` URL changes each
   run. Fine for review, not for production.
3. **14 images = 2.0 MB.** All lazy-loaded and below the fold, so they don't affect the initial
   paint. Confirmed no layout shift (explicit `width`/`height` on every image).
4. **The crop question** (see design decision above) is the most likely thing you'll want changed.
5. **Pricing label was renumbered** `05 → 06`. Required for coherence since graphics took `05`.
   Only that label changed; pricing content is untouched.
6. **Pre-existing, NOT touched:** the site's own `.deck-btn` controls in the story deck are 28×28px
   at mobile — below the 44px tap-target floor. That's existing debt, outside this task's scope. I
   scoped my own 44px fix to `.graphics-nav .deck-btn` so the story deck is unaffected. Worth a
   separate fix if you want it.
7. **`--pad` at 375px clamps to 18px**, so mobile card width is 78% of that inset container
   (≈278px) — leaves a deliberate peek of the next card to signal swipeability.

---

## To deploy when approved

The site is a Cloudflare Pages project (`trixeltech.pages.dev` canonical). `wrangler` is **not
installed** on PATH — deploy needs either:

```bash
npx wrangler pages deploy trixeltech/website --project-name <name>
```

with `CLOUDFLARE_API_TOKEN` injected via Infisical (never a literal), or a git push if the Pages
project is wired to this branch. **I have not run either** — awaiting your go-ahead.
