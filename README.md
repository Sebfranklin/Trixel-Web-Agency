# TRIXELTECH website

## Pages
- `index.html` Home
- `services.html` Services hub
- `services/websites.html`
- `services/telegram-bots.html`
- `services/online-stores.html`
- `services/graphics-and-add-ons.html`
- `work.html`
- `pricing.html` Interactive starting-price calculator
- `how-it-works.html`
- `about.html`
- `faq.html`
- `start.html` Project questionnaire
- `terms.html` Draft legal page
- `privacy.html` Draft privacy page

## Run
Open `index.html` in a browser, or upload the whole folder to static hosting. Keep the `assets` folder and all HTML files in their relative locations.

## Important implementation notes
- Built with HTML, CSS and JavaScript only. Google Fonts are loaded externally; the page still has fallback fonts.
- Navigation links are shared and responsive. The mobile navigation expands and includes a pinned project CTA. A mobile price/chat bar appears on scroll-capable pages.
- Motion respects `prefers-reduced-motion`.
- The pricing calculator updates the estimate and carries selections into the questionnaire. Recurring care is shown separately from the one-time total.
- The questionnaire currently prepares a message and gives the visitor a choice to continue to Telegram, copy the summary, or email. It does not persist or silently submit data. Telegram prefilled text support can vary by client, so copy/email fallback is provided.
- Portfolio cards are labelled **Concept project** because real client cases were not supplied. Replace them with verified work before launch.
- Legal pages are drafts and need professional review.
- Items requiring confirmation in the content brief remain flagged, including price-summary validity, response time, founder profile and demo bot URL.
- Payment processing, server-side payment verification, CMS, real portfolio case-study drawers, and a working bot demo are not backend features in this static frontend.
