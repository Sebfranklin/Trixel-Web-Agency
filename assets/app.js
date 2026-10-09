(()=>{
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Year in footer
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  // Mobile navigation drawer toggle
  const menu = $('#menu');
  const links = $('#navlinks');
  if (menu && links) {
    menu.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
      menu.textContent = open ? '×' : '☰';
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('#navlinks a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
        menu.textContent = '☰';
        document.body.style.overflow = '';
      });
    });
  }

  // Scroll reveal animations
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('visible'));
  }

  // Page reading scroll progress bar
  const pg = $('#pageProgress');
  function progress() {
    if (pg) {
      const max = document.documentElement.scrollHeight - innerHeight;
      pg.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
    }
  }
  addEventListener('scroll', progress, { passive: true });
  progress();

  /* ==========================================================================
     Storytelling Scroll Engine & 3D Shuffling Deck
     ========================================================================== */
  const story = $('#story');
  if (story) {
    const beats = $$('.story-beat', story);
    const cards = $$('.deck-card', story);
    const dots = $$('.deck-dot', story);
    const deck = $('#storyDeck');
    const storyClock = $('#storyClock');
    const storyCounter = $('#storyCounter');
    const progressBar = $('#deckProgressBar');
    const cnt = $('#cnt');
    const prevBtn = $('#deckPrev');
    const nextBtn = $('#deckNext');
    const totalBeats = cards.length || 5;
    let currentBeat = -1;
    let counted = false;

    const timeLabels = [
      '09:41 AM / THE SILENCE',
      '09:41 AM / THE FRICTION',
      '09:41 AM / THE GHOSTING',
      'DAY 0 / THE SYSTEM',
      'DAY 0 / THE CLOSE'
    ];

    const navClock = $('#navClock');
    const clockBeats = ['09:41 AM', '09:41 AM', '09:41 AM', 'Day 0', 'Day 0'];

    function updateDeck(beatIndex, fractionInBeat = 0) {
      if (beatIndex < 0) beatIndex = 0;
      if (beatIndex >= totalBeats) beatIndex = totalBeats - 1;

      // Stop Plateau: when fractionInBeat < 0.7, card is firmly stopped and readable
      const isStopped = fractionInBeat < 0.7;
      if (deck) deck.classList.toggle('is-stopped', isStopped);

      cards.forEach((card, idx) => {
        const isActive = idx === beatIndex;
        card.setAttribute('aria-hidden', String(!isActive));
        if (isActive) {
          card.removeAttribute('inert');
        } else {
          card.setAttribute('inert', '');
        }

        card.style.transform = '';
        card.style.opacity = '';

        if (idx < beatIndex) {
          card.setAttribute('data-state', 'exited');
        } else if (idx === beatIndex) {
          card.setAttribute('data-state', 'active');
        } else if (idx === beatIndex + 1) {
          card.setAttribute('data-state', 'next-1');
        } else if (idx === beatIndex + 2) {
          card.setAttribute('data-state', 'next-2');
        } else {
          card.setAttribute('data-state', 'queued');
        }
      });

      if (currentBeat !== beatIndex) {
        currentBeat = beatIndex;
        beats.forEach((b, i) => b.classList.toggle('active', i === beatIndex));
        dots.forEach((d, i) => d.classList.toggle('active', i === beatIndex));
        if (storyClock) storyClock.textContent = timeLabels[beatIndex] || 'DAY 0';
        if (storyCounter) storyCounter.textContent = `0${beatIndex + 1} / 05`;
        if (navClock) navClock.textContent = clockBeats[beatIndex] || 'Day 0';

        if (beatIndex === 4 && cnt && !counted) {
          counted = true;
          if (!reduce) {
            let startT = null;
            const anim = (t) => {
              if (!startT) startT = t;
              const k = Math.min(1, (t - startT) / 1100);
              const val = Math.round(28500 * (1 - Math.pow(1 - k, 3)));
              cnt.textContent = '₦' + val.toLocaleString('en-NG');
              if (k < 1) requestAnimationFrame(anim);
            };
            requestAnimationFrame(anim);
          } else {
            cnt.textContent = '₦28,500';
          }
        }
      }

      if (progressBar) {
        const totalProgress = (beatIndex + fractionInBeat) / (totalBeats - 1);
        progressBar.style.width = Math.min(100, Math.max(5, Math.round(totalProgress * 100))) + '%';
      }
    }

    let isProgrammaticScroll = false;

    function onScroll() {
      if (isProgrammaticScroll) return;
      const rect = story.getBoundingClientRect();
      const track = story.offsetHeight - innerHeight;
      if (track <= 0) return;
      const p = Math.min(1, Math.max(0, -rect.top / track));
      const rawP = p * totalBeats;
      const beatIndex = Math.min(totalBeats - 1, Math.floor(rawP));
      const fractionInBeat = Math.min(1, rawP - beatIndex);
      updateDeck(beatIndex, fractionInBeat);
    }

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();

    function jumpToBeat(targetBeat) {
      isProgrammaticScroll = true;
      updateDeck(targetBeat, 0);
      const track = story.offsetHeight - innerHeight;
      const targetTop = story.offsetTop + ((targetBeat + 0.25) / totalBeats) * track;
      window.scrollTo({ top: targetTop, behavior: reduce ? 'auto' : 'smooth' });
      setTimeout(() => { isProgrammaticScroll = false; }, reduce ? 50 : 800);
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const targetBeat = Number(dot.dataset.goto || 0);
        jumpToBeat(targetBeat);
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const targetBeat = Math.max(0, currentBeat - 1);
        jumpToBeat(targetBeat);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const targetBeat = Math.min(totalBeats - 1, currentBeat + 1);
        jumpToBeat(targetBeat);
      });
    }
  }

  // Work page filters
  const filterBtns = $$('.filter-btn');
  const projectCards = $$('.project-card');
  filterBtns.forEach(b => b.addEventListener('click', () => {
    filterBtns.forEach(x => x.classList.toggle('active', x === b));
    projectCards.forEach(c => c.hidden = b.dataset.filter !== 'all' && c.dataset.type !== b.dataset.filter);
  }));

  /* ==========================================================================
     Pricing Page Calculator, Floating Mobile Bar & Scope Modal
     ========================================================================== */
  const calc = $('#priceCalculator');
  if (calc) {
    const base = () => Number($('input[name="package"]:checked', calc)?.value || 0);
    const pages = $('#extraPages');

    function update() {
      const n = Math.max(0, Math.min(20, Number(pages?.value || 0)));
      if (pages) pages.value = n;

      const selected = $('input[name="package"]:checked', calc);
      const custom = selected?.dataset.custom === 'true';
      const pkgLabel = selected?.dataset.label || 'Website';
      const isGrowing = pkgLabel === 'Growing business website';

      const selectedExtras = $$('[data-extra]:checked', calc);
      const addOnTotal = selectedExtras.reduce((sum, e) => {
        return sum + ((isGrowing && e.dataset.label === 'Analytics') ? 0 : Number(e.value || 0));
      }, 0);

      const total = base() + addOnTotal + n * 10000;
      const formattedTotal = custom ? 'Custom quote' : '₦' + total.toLocaleString('en-NG');

      const calcTotalEl = $('#calcTotal');
      if (calcTotalEl) calcTotalEl.textContent = formattedTotal;

      const breakdownEl = $('#calcBreakdown');
      if (breakdownEl) {
        breakdownEl.textContent = custom
          ? 'Your requirements need a tailored scope and quote.'
          : `Starting estimate for ${pkgLabel}. Your final fixed price is confirmed before work begins.`;
        if (isGrowing && $('[data-extra][data-label="Analytics"]', calc)?.checked) {
          breakdownEl.textContent += ' (Analytics is included in the Growing website at no extra cost).';
        }
      }

      const monthly = $('input[name="care"]:checked', calc);
      const monthlyVal = monthly ? Number(monthly.value || 0) : 0;
      const monthlyEl = $('#monthlyCost');
      if (monthlyEl) {
        monthlyEl.textContent = monthlyVal > 0
          ? 'Monthly care: ₦' + monthlyVal.toLocaleString('en-NG') + '/month'
          : 'No monthly care selected';
      }

      // Sync floating mobile bar
      const mobileVal = $('#mobilePriceVal');
      const mobileLbl = $('#mobilePriceLabel');
      const mobileWa = $('#mobilePriceWaBtn');
      if (mobileVal) mobileVal.textContent = formattedTotal;
      if (mobileLbl) mobileLbl.textContent = custom ? 'CUSTOM QUOTE' : 'STARTING ESTIMATE';

      // Build parameters for start.html
      const params = new URLSearchParams();
      if (selected) params.set('package', pkgLabel);
      selectedExtras.forEach(e => params.append('addOn', e.dataset.label || ''));
      if (n > 0) params.set('extraPages', String(n));
      if (monthlyVal > 0) params.set('care', String(monthlyVal));
      params.set('estimate', formattedTotal);

      $$('[data-carry]').forEach(a => {
        a.href = 'start.html?' + params.toString();
      });

      // Update WhatsApp Quote Action Links
      const extraNames = selectedExtras.map(e => e.dataset.label || '').filter(Boolean);
      const waQuoteText = `Hey Trixeltech! I heard about your service "${pkgLabel}" in particular and I'm interested in getting started.\n\nCalculator Selections:\n• Package: ${pkgLabel} (${formattedTotal})\n• Extras: ${extraNames.length ? extraNames.join(', ') : 'None'}${n > 0 ? ` (+${n} extra pages)` : ''}\n• Monthly care: ${monthlyVal > 0 ? '₦' + monthlyVal.toLocaleString('en-NG') + '/mo' : 'None'}\n\nPlease let me know the next steps to confirm scope!`;
      const waQuoteUrl = `https://wa.me/2347042998527?text=${encodeURIComponent(waQuoteText)}`;

      const waQuoteBtn = $('#waQuoteBtn');
      if (waQuoteBtn) waQuoteBtn.href = waQuoteUrl;
      if (mobileWa) mobileWa.href = waQuoteUrl;
    }

    calc.addEventListener('change', update);
    pages?.addEventListener('input', update);
    update();
  }

  // Copy Summary on Pricing Page
  const copyBtn = $('#copySummary');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const selected = $('input[name="package"]:checked', calc)?.dataset.label || 'Website';
      const total = $('#calcTotal')?.textContent || '₦50,000';
      const breakdown = $('#calcBreakdown')?.textContent || '';
      const monthly = $('#monthlyCost')?.textContent || '';
      const text = `TRIXELTECH ESTIMATE SUMMARY\n• Package: ${selected}\n• Total: ${total}\n• Scope: ${breakdown}\n• Care: ${monthly}\n\nOfficial Contact: WhatsApp +2347042998527 | trixeltechnologies@gmail.com`;

      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied ✓';
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        copyBtn.textContent = 'Copied ✓';
      }
      setTimeout(() => { copyBtn.textContent = 'Copy summary'; }, 2500);
    });
  }

  /* ==========================================================================
     Package Scope Modal Dictionary & Interactions
     ========================================================================== */
  const scopeModalBackdrop = $('#scopeModalBackdrop');
  const scopeModalClose = $('#scopeModalClose');
  const scopeModalTitle = $('#scopeModalTitle');
  const scopeModalContent = $('#scopeModalContent');
  const scopeModalWaBtn = $('#scopeModalWaBtn');

  const scopeDatabase = {
    'landing-page': {
      title: 'Landing Page · From ₦50,000',
      tagline: 'Single high-converting page focused on explaining one offer and driving action.',
      included: [
        'One custom-designed scrolling page with up to 6–7 main content sections',
        'Responsive layout for mobile, tablet, and desktop screens',
        'Clear conversion CTAs: direct WhatsApp button, call link, or enquiry triggers',
        'One simple contact / enquiry form with launch testing',
        'Image optimization and foundational on-page SEO structure',
        'Hosting / deployment and HTTPS setup where supported',
        '2 consolidated client revision rounds'
      ],
      excluded: [
        'Copywriting / extensive marketing research (available as add-on)',
        'Paid ads, conversion tracking pixels, or advanced multi-channel analytics',
        'Payment gateways, customer user accounts, or complex CMS systems',
        'Domain registration fees or third-party infrastructure subscriptions'
      ],
      timeline: 'Target delivery: 3–5 working days once content and deposit are received.'
    },
    'basic-website': {
      title: 'Basic Business Website · ₦80,000',
      tagline: 'For growing businesses requiring a clean, authoritative multi-page presence.',
      included: [
        'Up to 4 standard pages (Home, About, Services, Contact)',
        'Mobile-first responsive build and clear navigation hierarchy',
        'Direct WhatsApp click-to-chat integration and contact lead form',
        'Basic SEO setup, hosting deployment, HTTPS verification, and launch testing',
        '2 consolidated client revision rounds'
      ],
      excluded: [
        'Online store / cart checkout, client portals, or user logins',
        'CMS blog management or complex interactive databases',
        'Domain registration fees and paid third-party plugins'
      ],
      timeline: 'Target delivery: 3–7 working days upon receipt of approved materials.'
    },
    'growing-website': {
      title: 'Growing Business Website · ₦150,000',
      tagline: 'Comprehensive digital home for active businesses seeking content reach and lead capture.',
      included: [
        'Up to 7 standard pages with custom layout and typography',
        'Privacy-friendly analytics tracking setup included at no extra charge',
        'Strengthened lead capture forms, service breakdowns, and social links',
        'Complete on-page SEO structure and Google Search Console indexing setup',
        'Simple CMS for announcements or blog articles where requested',
        '3 revision rounds + 14 days post-launch support (up to 3 requests)'
      ],
      excluded: [
        'E-commerce store checkout, paid third-party subscriptions, complex web apps'
      ],
      timeline: 'Target delivery: 7–14 working days based on content readiness.'
    },
    'ai-assistant': {
      title: 'AI Website Customer Assistant · From ₦20,000',
      tagline: '24/7 web chatbot trained on your company FAQs to answer visitors and qualify leads in 2 seconds.',
      included: [
        'Custom embedded chat interface matching your brand style',
        'Answers derived strictly from your approved business documentation & FAQs',
        'Product, pricing, and operating hour inquiries handled instantly',
        'Direct escalation to WhatsApp (+2347042998527) for high-intent buyers',
        'Full responsive mobile and desktop launch testing'
      ],
      excluded: [
        'Third-party AI token/API usage costs (paid directly on your own provider account)',
        'WhatsApp AI / WhatsApp API bots (not offered)',
        'Unrestrained web scraping or autonomous outbound spamming'
      ],
      timeline: 'Target delivery: 2–4 working days once business documentation is approved.'
    },
    'flyers-bundle': {
      title: 'Social Media Flyers Bundle (5-Pack) · ₦20,000',
      tagline: '5 cohesive promotional flyers designed for product drops, discounts, and announcements.',
      included: [
        '5 individual promotional flyers with unified brand styling (save ₦5,000)',
        'High-resolution exports optimized for Instagram Feed, Stories, and WhatsApp Status',
        'High-contrast typography, clear offer messaging, and call-to-action triggers',
        '2 consolidated client revision rounds'
      ],
      excluded: [
        'Full logo redesign or complete corporate branding identity system',
        'Professional photography or video editing'
      ],
      timeline: 'Target delivery: 2–3 working days once copy and photos are supplied.'
    },
    'minor-redesign': {
      title: 'Minor Website Refresh · ₦40,000',
      tagline: 'Fixing styling inconsistencies, broken alignments, and typography without full rebuild.',
      included: [
        'Up to 3 existing pages refreshed',
        'Brand color palette, typography, hierarchy, and spacing adjustments',
        'Restyling existing buttons, links, and basic form elements',
        'Fixing mobile overflow, cramped text, and layout alignment bugs',
        '1 consolidated revision round'
      ],
      excluded: [
        'Creating new pages, backend rewriting, or structural database changes'
      ],
      timeline: 'Target delivery: 2–3 working days.'
    },
    'standard-redesign': {
      title: 'Standard Redesign · ₦80,000',
      tagline: 'Overhaul page structure and mobile usability for up to 5 existing pages.',
      included: [
        'Up to 5 existing pages visually and structurally restructured',
        'Refreshed page layouts, visual hierarchy, navigation, and conversion CTAs',
        'Enhanced mobile, tablet, and desktop responsive performance',
        'Restyled forms and interactive touch elements',
        '2 consolidated revision rounds'
      ],
      excluded: [
        'Platform migration across completely incompatible architectures'
      ],
      timeline: 'Target delivery: 4–7 working days.'
    },
    'major-redesign': {
      title: 'Major Redesign & Rebuild · From ₦120,000',
      tagline: 'Complete architecture rebuild and modernization for 7+ pages.',
      included: [
        'Complete architecture rebuild and modernization for 7+ pages',
        'Modern component stack, responsive restructure, and asset performance tuning',
        'Comprehensive navigation overhaul and conversion re-alignment',
        'Full SEO parity check and migration safeguard'
      ],
      excluded: [
        'Third-party software subscription licenses or paid plugins'
      ],
      timeline: 'Scoped individually during consultation.'
    },
    'basic-bot': {
      title: 'Basic Automated Bot · ₦20,000',
      tagline: 'Instant 2-second answers to routine customer questions.',
      included: [
        'Instant automated welcome menu',
        'Pre-written answers to common customer FAQs and policies',
        'Operating hours, service list, contact links, and address / location sharing',
        'Lightweight cloud hosting setup'
      ],
      excluded: [
        'Product catalogs, multi-step ordering, payment collection, or user databases'
      ],
      timeline: 'Target delivery: 2–3 working days.'
    },
    'standard-bot': {
      title: 'Standard Catalog Bot · ₦40,000',
      tagline: 'Guide customers through product categories and collect inquiry details.',
      included: [
        'Product or service category browsing with inline buttons',
        'Guided option selection and customer intake forms',
        'Instant order / lead notification dispatched directly to business owner',
        'Clear pricing and inquiry summaries'
      ],
      excluded: [
        'In-bot automated payment processing and multi-tier databases'
      ],
      timeline: 'Target delivery: 3–5 working days.'
    },
    'payment-bot': {
      title: 'Payment-Enabled Bot · From ₦60,000',
      tagline: 'Verified online payments collected directly within the messaging flow.',
      included: [
        'Paystack or Flutterwave verified checkout flow',
        'Automated payment verification and instant digital customer receipt',
        'Real-time dispatch alert to business owner with transaction reference',
        'Custom order confirmation workflow'
      ],
      excluded: [
        'Payment gateway transaction fees (paid directly to Paystack / Flutterwave)'
      ],
      timeline: 'Target delivery: 5–7 working days.'
    },
    'starter-store': {
      title: 'Starter Online Store · ₦350,000',
      tagline: 'Direct product sales with automated online checkout and payment receipts.',
      included: [
        'Catalogue setup for up to 20 initial products',
        'Shopping cart, checkout page, and customer order management',
        'Paystack or Flutterwave online payment integration with instant verification',
        'Automated email/receipt confirmation to customer and store owner',
        'Mobile-optimized product presentation and search'
      ],
      excluded: [
        'Product photography, copywriting, paid merchant gateway fees, domain registration'
      ],
      timeline: 'Target delivery: 7–14 working days.'
    },
    'growth-store': {
      title: 'Growth Online Store · ₦500,000',
      tagline: 'Expanded catalogue with discount codes, shipping tiers, and category filters.',
      included: [
        'Catalogue setup for up to 50 initial products with category filters',
        'Discount coupon codes and promotional banner system',
        'Shipping fee rules and regional delivery rate calculations',
        'Inventory tracking and low-stock alerts',
        'Customer account dashboard (if desired) and payment gateway setup'
      ],
      excluded: [
        'Paid ERP connectors, custom warehouse logistics, third-party gateway charges'
      ],
      timeline: 'Target delivery: 14–21 working days.'
    },
    'custom-project': {
      title: 'Custom Architecture & System · Custom Quote',
      tagline: 'Bespoke web applications, custom APIs, and specialized business workflows.',
      included: [
        'Tailored web applications, internal tools, and client portals',
        'Custom RESTful/webhook API integrations',
        'Specialized business workflow automation',
        'Full upfront technical architecture specification before development'
      ],
      excluded: [
        'Defined following initial technical scoping consultation'
      ],
      timeline: 'Determined by agreed milestone roadmap.'
    }
  };

  function openScopeModal(scopeKey) {
    const data = scopeDatabase[scopeKey];
    if (!data || !scopeModalBackdrop) return;

    if (scopeModalTitle) scopeModalTitle.textContent = data.title;
    if (scopeModalContent) {
      scopeModalContent.innerHTML = `
        <p class="lead" style="margin-bottom:18px;color:var(--text)">${data.tagline}</p>
        <div style="margin-bottom:18px">
          <h4 style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--royal);margin-bottom:8px">Included in this package:</h4>
          <ul style="padding-left:18px;line-height:1.6;font-size:14px;color:var(--muted)">
            ${data.included.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        <div style="margin-bottom:18px">
          <h4 style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--red);margin-bottom:8px">Explicitly excluded (available as add-on or separate):</h4>
          <ul style="padding-left:18px;line-height:1.6;font-size:14px;color:var(--muted)">
            ${data.excluded.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        <div class="notice" style="margin-top:14px">
          <strong>Timeline:</strong> ${data.timeline}
        </div>
      `;
    }

    if (scopeModalWaBtn) {
      const waText = `Hey Trixeltech! I heard about your service "${data.title}" in particular and I'm interested in the scope details. Let's discuss!`;
      scopeModalWaBtn.href = `https://wa.me/2347042998527?text=${encodeURIComponent(waText)}`;
    }

    scopeModalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeScopeModal() {
    if (!scopeModalBackdrop) return;
    scopeModalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  $$('.plan-scope-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openScopeModal(btn.dataset.scope);
    });
  });

  if (scopeModalClose) {
    scopeModalClose.addEventListener('click', closeScopeModal);
  }

  if (scopeModalBackdrop) {
    scopeModalBackdrop.addEventListener('click', (e) => {
      if (e.target === scopeModalBackdrop) closeScopeModal();
    });
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && scopeModalBackdrop.classList.contains('open')) {
        closeScopeModal();
      }
    });
  }

  /* ==========================================================================
     Interactive One-Prompt-at-a-Time Questionnaire Wizard (start.html)
     ========================================================================== */
  const wizardForm = $('#interactiveWizard');
  if (wizardForm) {
    const urlParams = new URLSearchParams(location.search);
    const stepLabel = $('#wizardStepLabel');
    const progressBar = $('#wizardProgressBar');
    const percentLabel = $('#wizardPercent');
    const titleEl = $('#wizardStepTitle');
    const subEl = $('#wizardStepSub');
    const panes = $$('.wizard-pane', wizardForm);

    const stepHeaders = {
      1: { title: 'What are you looking to build?', sub: 'Select the option that best fits your business need right now.' },
      2: { title: 'What is your primary project goal?', sub: 'Tell us the key outcome that makes this project a success.' },
      3: { title: 'What is your timeline and budget?', sub: 'Help us schedule production and align technical scope.' },
      4: { title: 'Where should we send your quote?', sub: 'Direct contact info for your official fixed-scope proposal.' },
      5: { title: 'Your enquiry is prepared!', sub: 'Review below and send directly to WhatsApp for immediate response.' }
    };

    let currentStep = 1;

    // Wizard option click handling
    $$('.wizard-pane .wizard-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const pane = opt.closest('.wizard-pane');
        const field = opt.dataset.field;
        $$(`.wizard-option[data-field="${field}"]`, pane).forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });

    // Pre-fill from calculator URL parameters if arrived from pricing.html
    const carriedPkg = urlParams.get('package');
    if (carriedPkg) {
      const matchOpt = $$('.wizard-option[data-field="service"]').find(opt => {
        const val = opt.dataset.value.toLowerCase();
        return val.includes(carriedPkg.toLowerCase()) || carriedPkg.toLowerCase().includes(val);
      });
      if (matchOpt) {
        $$('.wizard-option[data-field="service"]').forEach(o => o.classList.remove('selected'));
        matchOpt.classList.add('selected');
      }

      const budgetSelect = $('#budgetSelect');
      if (budgetSelect) {
        budgetSelect.value = 'Carry over from calculator';
      }

      const notesField = $('#projectNotes');
      if (notesField) {
        const addOns = urlParams.getAll('addOn');
        const extraPages = urlParams.get('extraPages');
        const estimate = urlParams.get('estimate');
        let noteParts = [];
        if (estimate) noteParts.push(`Calculator estimate: ${estimate}`);
        if (addOns.length) noteParts.push(`Selected add-ons: ${addOns.join(', ')}`);
        if (extraPages) noteParts.push(`Extra pages: ${extraPages}`);
        notesField.value = noteParts.join(' | ');
      }
    }

    function setStep(target) {
      if (target < 1) target = 1;
      if (target > 5) target = 5;
      currentStep = target;

      panes.forEach(p => {
        const stepNum = Number(p.dataset.step);
        p.classList.toggle('active', stepNum === currentStep);
      });

      if (currentStep <= 4) {
        const pct = Math.round((currentStep / 4) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (percentLabel) percentLabel.textContent = pct + '%';
        if (stepLabel) stepLabel.textContent = `STEP ${currentStep} OF 4`;
      } else {
        if (progressBar) progressBar.style.width = '100%';
        if (percentLabel) percentLabel.textContent = '100%';
        if (stepLabel) stepLabel.textContent = 'READY TO SEND';
      }

      const header = stepHeaders[currentStep];
      if (header) {
        if (titleEl) titleEl.textContent = header.title;
        if (subEl) subEl.textContent = header.sub;
      }

      // Scroll wizard smoothly into view if on mobile
      const wizardContainer = $('#wizardContainer');
      if (wizardContainer && innerWidth < 800) {
        wizardContainer.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    }

    // Step navigation buttons
    $$('[data-next]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = Number(btn.dataset.next);
        setStep(next);
      });
    });

    $$('[data-prev]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prev = Number(btn.dataset.prev);
        setStep(prev);
      });
    });

    // Form submission -> Step 5 summary & WhatsApp URL generation
    wizardForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = $('#clientName');
      const waInput = $('#clientWhatsApp');
      const emailInput = $('#clientEmail');

      if (!nameInput?.value.trim() || !waInput?.value.trim() || !emailInput?.value.trim()) {
        alert('Please fill in your name, WhatsApp number, and email address.');
        return;
      }

      const service = $('.wizard-option[data-field="service"].selected')?.dataset.value || 'Business Website';
      const goal = $('.wizard-option[data-field="goal"].selected')?.dataset.value || 'Online growth';
      const notes = $('#projectNotes')?.value.trim() || '';
      const timeline = $('.wizard-option[data-field="timeline"].selected')?.dataset.value || '3–5 days';
      const budget = $('#budgetSelect')?.value || '₦50,000–₦100,000';
      const name = nameInput.value.trim();
      const business = $('#businessName')?.value.trim() || '';
      const whatsapp = waInput.value.trim();
      const email = emailInput.value.trim();

      // Format summary
      const summaryLines = [
        `TRIXELTECH PROJECT ENQUIRY`,
        `==================================`,
        `Service: ${service}`,
        `Goal: ${goal}`,
        notes ? `Reference/Notes: ${notes}` : null,
        `Timeline: ${timeline}`,
        `Budget Range: ${budget}`,
        `----------------------------------`,
        `Client Name: ${name}`,
        business ? `Business Name: ${business}` : null,
        `Client WhatsApp: ${whatsapp}`,
        `Client Email: ${email}`,
        `==================================`
      ].filter(Boolean);

      const summaryText = summaryLines.join('\n');
      const summaryPre = $('#wizardSummaryText');
      if (summaryPre) summaryPre.textContent = summaryText;

      // WhatsApp pre-written message requested by user
      const waPrewritten = `Hey Trixeltech! I heard about your service "${service}" in particular and I'm interested in getting started.\n\nProject Details:\n• Name: ${name}${business ? ' (' + business + ')' : ''}\n• Goal: ${goal}\n• Timeline: ${timeline}\n• Budget: ${budget}${notes ? '\n• Notes: ' + notes : ''}\n• Email: ${email}\n\nLooking forward to your fixed scope confirmation!`;

      const waUrl = `https://wa.me/2347042998527?text=${encodeURIComponent(waPrewritten)}`;
      const emailUrl = `mailto:trixeltechnologies@gmail.com?subject=${encodeURIComponent(`Project Enquiry: ${service} - ${name}`)}&body=${encodeURIComponent(waPrewritten)}`;

      const waSendBtn = $('#waSendBtn');
      if (waSendBtn) waSendBtn.href = waUrl;

      const emailSendBtn = $('#emailSendBtn');
      if (emailSendBtn) emailSendBtn.href = emailUrl;

      setStep(5);
    });

    // Copy Wizard Summary button
    const copyWizardBtn = $('#copyWizardBtn');
    if (copyWizardBtn) {
      copyWizardBtn.addEventListener('click', async () => {
        const text = $('#wizardSummaryText')?.textContent || '';
        try {
          await navigator.clipboard.writeText(text);
          copyWizardBtn.textContent = 'Copied ✓';
        } catch {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          copyWizardBtn.textContent = 'Copied ✓';
        }
        setTimeout(() => { copyWizardBtn.textContent = 'Copy Summary'; }, 2500);
      });
    }

    // Restart Wizard button
    const restartBtn = $('#restartWizardBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        wizardForm.reset();
        $$('.wizard-option').forEach(o => o.classList.remove('selected'));
        $$('.wizard-pane[data-step="1"] .wizard-option')[0]?.classList.add('selected');
        $$('.wizard-pane[data-step="2"] .wizard-option')[0]?.classList.add('selected');
        $$('.wizard-pane[data-step="3"] .wizard-option')[0]?.classList.add('selected');
        setStep(1);
      });
    }

    setStep(1);
  }

})();