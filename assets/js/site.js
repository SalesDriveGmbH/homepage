/* =================================================================
   SalesDrive · v4 · Shared Site JS
   Nav scroll, reveals, counters, cookie consent, smooth anchors
   ================================================================= */
(function() {
  /* NAV SCROLL */
  const nav = document.getElementById('nav');
  const progress = document.getElementById('progress');
  function onScroll() {
    const y = window.scrollY;
    if (progress) {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = ((y / total) * 100) + '%';
    }
    if (nav) {
      if (y > 12) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* REVEAL ON SCROLL */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
  document.querySelectorAll('.reveal, .reveal-blur, .reveal-scale, .reveal-slide-r, .reveal-slide-l, .reveal-shadow').forEach(el => revealIO.observe(el));

  /* WORD-BY-WORD HEADLINES */
  document.querySelectorAll('[data-words]').forEach((container) => {
    const words = container.querySelectorAll('.w');
    words.forEach((w, i) => { w.style.transitionDelay = (0.06 + i * 0.08) + 's'; });
    // If above-the-fold, fire on load; otherwise let IntersectionObserver handle it
    const rect = container.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setTimeout(() => container.classList.add('in'), 200);
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.2 });
      io.observe(container);
    }
  });

  /* COUNTERS */
  function animateCounter(el) {
    const target = parseFloat(el.dataset.to);
    const duration = parseInt(el.dataset.duration || '1800', 10);
    const start = performance.now();
    const fmt = (val) => {
      if (target >= 1000) return Math.floor(val).toLocaleString('de-DE');
      const dec = el.dataset.decimals;
      if (dec) return val.toFixed(parseInt(dec, 10)).replace('.', ',');
      return Math.floor(val).toString();
    };
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(eased * target);
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = fmt(target);
    }
    requestAnimationFrame(frame);
  }
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCounter(e.target); counterIO.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.counter').forEach(el => counterIO.observe(el));

  /* VIMEO CLICK-TO-PLAY */
  function attachVimeo(container) {
    const id = container.dataset.vimeoId;
    if (!id) return;
    let played = false;
    function play(e) {
      if (played) return;
      played = true;
      if (e) { e.preventDefault(); e.stopPropagation(); }
      const iframe = document.createElement('iframe');
      iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:inherit;z-index:5;';
      container.querySelectorAll('img, .hero__play, .hero__rec, .hero__caption, .case__tag, .case__play, .case__author, .video-card__play, .video-card__tag, .video-card__author, .video-card__caption, .case-detail__play, .case-detail__person-tag').forEach(el => {
        el.style.transition = 'opacity .3s ease';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      });
      container.appendChild(iframe);
    }
    container.addEventListener('click', play);
  }
  document.querySelectorAll('[data-vimeo-id]').forEach(attachVimeo);

  /* HERO DEVICE MOUSE PARALLAX */
  const heroDevice = document.querySelector('.hero__device');
  if (heroDevice && window.matchMedia('(min-width: 980px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let rafId = null;
    heroDevice.addEventListener('mousemove', (e) => {
      const rect = heroDevice.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const dy = (e.clientY - rect.top - rect.height / 2) / rect.height;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        heroDevice.style.transform = `perspective(1500px) translateZ(0) rotateY(${dx * 2.4}deg) rotateX(${-dy * 2.4}deg)`;
      });
    });
    heroDevice.addEventListener('mouseleave', () => {
      heroDevice.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
      heroDevice.style.transform = 'perspective(1500px) translateZ(0)';
      setTimeout(() => { heroDevice.style.transition = ''; }, 700);
    });
  }

  /* MECHANIK TIMELINE LINE FILL */
  const tl = document.getElementById('mechanikTimeline');
  const tlFill = document.getElementById('mechanikLineFill');
  const tlSteps = document.querySelectorAll('#mechanikTimeline .tl-step');
  if (tl && tlFill) {
    let tlTicking = false;
    function updateTimelineFill() {
      const rect = tl.getBoundingClientRect();
      const total = rect.height;
      const viewCenter = window.innerHeight * 0.55;
      const progressVal = Math.max(0, Math.min(1, (viewCenter - rect.top) / total));
      tlFill.style.height = (progressVal * total) + 'px';
      tlSteps.forEach((step) => {
        const sr = step.getBoundingClientRect();
        const bubbleY = sr.top + 28;
        if (bubbleY < viewCenter) step.classList.add('active');
        else step.classList.remove('active');
      });
      tlTicking = false;
    }
    window.addEventListener('scroll', () => {
      if (!tlTicking) { requestAnimationFrame(updateTimelineFill); tlTicking = true; }
    }, { passive: true });
    updateTimelineFill();
  }

  /* HUB BEZEL SCROLL TILT */
  const hubStage = document.getElementById('hubStage');
  const hubBezel = document.getElementById('hubBezel');
  if (hubStage && hubBezel && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let hubTicking = false;
    function updateHubTilt() {
      const rect = hubStage.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.top < vh && rect.bottom > 0) {
        const center = rect.top + rect.height / 2;
        const offset = (center - vh / 2) / vh;
        const tilt = offset * 6;
        hubBezel.style.transform = `perspective(1800px) rotateX(${tilt}deg)`;
      }
      hubTicking = false;
    }
    window.addEventListener('scroll', () => {
      if (!hubTicking) { requestAnimationFrame(updateHubTilt); hubTicking = true; }
    }, { passive: true });
    updateHubTilt();
  }

  /* SMOOTH ANCHORS */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 56;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ================== COOKIE CONSENT ================== */
  const COOKIE_KEY = 'sd_cookie_consent_v1';
  function getConsent() {
    try { return JSON.parse(localStorage.getItem(COOKIE_KEY)); } catch (e) { return null; }
  }
  function setConsent(data) {
    try { localStorage.setItem(COOKIE_KEY, JSON.stringify(Object.assign({ ts: Date.now() }, data))); } catch (e) {}
  }
  function buildCookieBanner() {
    if (getConsent()) return; // already decided
    const wrap = document.createElement('div');
    wrap.className = 'cookie';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-live', 'polite');
    wrap.innerHTML = `
      <div class="cookie__head">
        <div class="cookie__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 11.5A9.5 9.5 0 1 1 12.5 2.5a4 4 0 0 0 4 4 4 4 0 0 0 4 4 4 4 0 0 0 1 .5z"/><circle cx="9" cy="9" r=".5" fill="currentColor"/><circle cx="14" cy="13" r=".5" fill="currentColor"/><circle cx="10" cy="15" r=".5" fill="currentColor"/><circle cx="16" cy="16" r=".5" fill="currentColor"/></svg>
        </div>
        <div class="cookie__title">Cookies &amp; Datenschutz</div>
      </div>
      <p class="cookie__text">Wir nutzen Cookies, um diese Seite zu betreiben und ihre Performance zu messen. Notwendige Cookies laufen immer. Den Rest entscheidest du. Details in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>
      <button type="button" class="cookie__toggle" data-toggle>Einstellungen anzeigen <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
      <div class="cookie__options">
        <div class="cookie__opt">
          <label><input type="checkbox" checked disabled> <span class="cookie__opt-label">Notwendig</span></label>
          <span class="cookie__opt-info muted" style="font-size:11px;color:var(--ink-mute);">immer aktiv</span>
        </div>
        <div class="cookie__opt">
          <label><input type="checkbox" data-cat="analytics"> <span class="cookie__opt-label">Analytics</span></label>
        </div>
        <div class="cookie__opt">
          <label><input type="checkbox" data-cat="marketing"> <span class="cookie__opt-label">Marketing</span></label>
        </div>
      </div>
      <div class="cookie__actions">
        <button type="button" class="btn btn--ghost" data-decline>Nur Notwendige</button>
        <button type="button" class="btn btn--primary" data-accept>Alle akzeptieren</button>
      </div>
    `;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('in'));

    wrap.querySelector('[data-toggle]').addEventListener('click', () => {
      wrap.classList.toggle('is-expanded');
    });
    wrap.querySelector('[data-accept]').addEventListener('click', () => {
      const analytics = wrap.querySelector('[data-cat="analytics"]').checked;
      const marketing = wrap.querySelector('[data-cat="marketing"]').checked;
      // If neither was actively toggled, treat "accept all" as accept-all
      const allOn = !wrap.classList.contains('is-expanded');
      setConsent({ essential: true, analytics: allOn || analytics, marketing: allOn || marketing });
      dismiss();
    });
    wrap.querySelector('[data-decline]').addEventListener('click', () => {
      setConsent({ essential: true, analytics: false, marketing: false });
      dismiss();
    });
    function dismiss() {
      wrap.classList.remove('in');
      setTimeout(() => wrap.remove(), 500);
    }
  }
  // Run after DOM idle so it doesn't compete with hero entrance
  if (document.readyState === 'complete') {
    setTimeout(buildCookieBanner, 1400);
  } else {
    window.addEventListener('load', () => setTimeout(buildCookieBanner, 1400));
  }
})();
