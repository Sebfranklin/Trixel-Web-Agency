# Master SEO, Discoverability & Showcase Execution Plan

**Project:** TrixelTech Production Engineering  
**Working Branch:** `feature/mobile-whatsapp-docs-flow`  
**Tracking / Alert Endpoint:** `https://ntfy.sh/trixeltech-alerts`  
**Target Gauntlet Quality Bar:** Measurable Lighthouse / Structural Score ≥ 95/100 (Zero SEO, Social, or Discovery Defects)

---

## Part 1: Comprehensive Failure-to-Rank Audit (Root Causes)

| Vector | Status Quo Gap | Concrete Penalty / Impact |
| :--- | :--- | :--- |
| **1. Crawl Architecture** | Missing `robots.txt` and `sitemap.xml` | Search bot crawlers (Googlebot, Bingbot) and AI indexing bots have no manifest of the 15 pages; discovery is delayed or fragmented. |
| **2. Social & Sharing Previews** | Zero Open Graph (`og:*`) & Twitter Cards (`twitter:*`) | When links are shared on WhatsApp (+234 704 299 8527), Twitter, Telegram, or LinkedIn, zero cards render (no logo, no image, no summary). Low click-through. |
| **3. Structured Data (Schema.org)** | Zero `application/ld+json` schemas | Search engines and AI engines (ChatGPT, Claude, Perplexity) cannot extract business name, service catalog, price range (NGN), contact point, or reviews. |
| **4. Canonical & Duplicate Guard** | No `<link rel="canonical">` | Potential split link-equity between `trixeltech.pages.dev`, sub-routes, and upcoming custom domain. |
| **5. High-Intent Geo-Search Keywords** | Minimal Nigerian / Lagos local search intent | Missing queries like "affordable website developer Nigeria", "Telegram bot builder Lagos", "business website design ₦50k", "AI website customer service Nigeria". |
| **6. Semantic Heading Hierarchy** | Missing keyword-rich alt texts, subheadings, semantic tags | Content uses generic labels instead of keyword-rich semantic tokens. |

---

## Part 2: Measurable SEO & Discoverability Target (Gauntlet Metric)

To guarantee high ranking and discoverability **without relying on external live Google crawler lag**, we define a deterministic, measurable 100-point gate:

### 100-Point Discoverability Benchmark:
1. **Crawling Seam (20 pts):** Valid `robots.txt` + auto-updating `sitemap.xml` referencing all 15 routes with `lastmod`, `changefreq`, and `priority`.
2. **Metadata Integrity (20 pts):** Every HTML page has unique Title (<60 chars), Meta Description (120–160 chars), Canonical URL, and Theme Color.
3. **Rich Social Share Cards (20 pts):** Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) and Twitter (`twitter:card`, `twitter:image`) present and validated on every page.
4. **Structured Schema Engine (20 pts):** Valid `application/ld+json` schemas:
   - `Organization` & `LocalBusiness` (Trixel Technologies, Lagos/Nigeria, phone, email, logo)
   - `WebSite` with SearchAction
   - `Service` + `Offer` catalog with Naira pricing for Websites, Bots, Stores, AI Assistants, and Graphics.
5. **High-Intent Search Seams (20 pts):** On-page semantic keywords embedded naturally across headings, body copy, and FAQ accordions.

*Target Gate: 100 / 100 on automated verification test.*

---

## Part 3: Live Showcase Demo Sites Specification

Instead of abstract wireframes or static placeholders, we are building **3 fully working, beautifully crafted interactive showcase sites** accessible directly from `work.html` and deployed on live URLs:

1. **Demo 1: Minimalist SaaS / Corporate Business (`/showcase/apex-apparel/` or Linear/Stripe design standard)**
   - *Industry:* Premium Nigerian Fashion & Apparel Brand (Apex Apparel)
   - *Design System:* Inspired by `linear.app` + `stripe` (dark modern luxury, high-contrast typography, crisp product showcase, instant WhatsApp buy flow).
   - *Touches Services:* Landing page & Basic/Growing Website.

2. **Demo 2: Instant Automated Bot / Delivery Concierge (`/showcase/trixel-bot-concierge/`)**
   - *Industry:* Instant Food & Package Delivery Bot Web App
   - *Design System:* Inspired by `raycast` + `telegram` (reactive interactive simulator where users type/tap and bot replies in 1.8s with menu, Lekki delivery rates, and Paystack mock payment).
   - *Touches Services:* Telegram Bots & AI Customer Assistants.

3. **Demo 3: Modern E-Commerce Store (`/showcase/aura-beauty/`)**
   - *Industry:* Modern Cosmetics & Lifestyle Boutique (Aura Skin)
   - *Design System:* Inspired by `apple` + `framer` clean aesthetic (product cards, variant selector, bag drawer, direct Paystack checkout trigger).
   - *Touches Services:* Online Stores (Starter & Growth).

---

## Part 4: Task Execution Queue

- [ ] **Task 1: SEO Foundation Engine**
  - Create `robots.txt` allowing all legitimate crawlers + sitemap directive.
  - Create comprehensive `sitemap.xml` mapping all pages + showcase sites.
  - Create branded Open Graph social preview SVG/PNG card (`assets/og-image.png`).
- [ ] **Task 2: Global Metadata & Schema Injection**
  - Inject Open Graph and Twitter tags across all 15 HTML pages.
  - Inject rich `application/ld+json` structured schema into `index.html`, `pricing.html`, `services.html`, and `services/ai-assistants.html`.
  - Add canonical links across all pages.
- [ ] **Task 3: On-Page Local SEO & Keyword Elevation**
  - Weave high-intent Nigerian search queries into meta titles, descriptions, and FAQ accordions without keyword stuffing.
- [ ] **Task 4: Build 3 Interactive Showcase Demo Sites**
  - Build Demo 1: Apex Apparel (Premium Fashion Website)
  - Build Demo 2: SwiftDrop Delivery (Bot & AI Concierge Simulator)
  - Build Demo 3: Aura Skin (Modern E-Commerce Store)
  - Link all three from `work.html` and homepage portfolio cards.
- [ ] **Task 5: Automated Verification & Adversarial Audit**
  - Create and run `tests/seo-discoverability.test.mjs` (enforcing the 100-point gate).
  - Run Playwright responsive verification across all 6 breakpoints.
  - Run `oxlint --type-aware` and `gitleaks`.
- [ ] **Task 6: Cloudflare Production Deployment & Notification**
  - Deploy to Cloudflare Pages (`trixeltech.pages.dev`).
  - Ping final success alert via `ntfy.sh/trixeltech-alerts`.
