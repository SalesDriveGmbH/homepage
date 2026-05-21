/* ============================================================
   SalesDrive – FANCY JS
   Journey draw-on-scroll, megastat reveal, sticky scroll chapters,
   word-by-word soft reveal.
   ============================================================ */
(function(){
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('fancy-page');
  requestAnimationFrame(() => document.body.classList.add('loaded'));
  setTimeout(() => document.documentElement.classList.add('loaded'), 50);

  /* === Word-by-word soft reveal === */
  document.querySelectorAll('.word-reveal-soft').forEach(el => {
    if (el.dataset.wrInit) return;
    el.dataset.wrInit = '1';
    const html = el.innerHTML;
    // Wrap each word inside `.w`, but keep <br> + <em> tags
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    function wrap(node) {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        const parts = node.textContent.split(/(\s+)/);
        parts.forEach((p, i) => {
          if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
          else if (p.length) {
            const span = document.createElement('span');
            span.className = 'w';
            span.textContent = p;
            span.style.transitionDelay = (i * 0.04) + 's';
            frag.appendChild(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        [...node.childNodes].forEach(wrap);
      }
    }
    [...tmp.childNodes].forEach(wrap);
    el.innerHTML = tmp.innerHTML;
    // recompute delays globally so cascade is smooth
    const ws = el.querySelectorAll('.w');
    ws.forEach((w, i) => w.style.transitionDelay = (i * 0.05) + 's');
  });

  /* === Generic in-view observer for elements that need .in === */
  const observe = (selector, threshold = 0.25, once = true) => {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          if (once) io.unobserve(e.target);
        } else if (!once) {
          e.target.classList.remove('in');
        }
      });
    }, { threshold });
    els.forEach(el => io.observe(el));
  };

  observe('.megastat__number', 0.3);
  observe('.word-reveal-soft', 0.2);

  /* === Journey: per-milestone reveal + scroll-filled center line === */
  document.querySelectorAll('.journey').forEach(journey => {
    const rail = journey.querySelector('.journey__rail');
    const milestones = journey.querySelectorAll('.journey__milestone');
    if (!rail || !milestones.length) return;

    // fill line
    let fill = rail.querySelector('.journey__rail-fill');
    if (!fill) {
      fill = document.createElement('div');
      fill.className = 'journey__rail-fill';
      rail.prepend(fill);
    }

    const mio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          mio.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    milestones.forEach(m => mio.observe(m));

    if (reduce) { fill.style.height = '100%'; return; }

    let raf = null;
    const update = () => {
      raf = null;
      const r = rail.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress = how far the rail has scrolled past the viewport center
      const center = vh * 0.55;
      const start = r.top;            // when rail top hits the center, fill = 0
      const end = r.bottom - center;  // when rail bottom hits center, fill = 100
      let p = (center - start) / (r.height);
      p = Math.max(0, Math.min(1, p));
      fill.style.height = (p * 100) + '%';
    };
    window.addEventListener('scroll', () => { if (raf) return; raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  });

  /* === Sticky-Scroll Story: switch active layer based on chapter in view === */
  document.querySelectorAll('.stickyscroll').forEach(section => {
    const chapters = section.querySelectorAll('.stickyscroll__chapter');
    const layers = section.querySelectorAll('.stickyscroll__layer');
    if (!chapters.length || !layers.length) return;

    const setActive = (idx) => {
      layers.forEach((l, i) => l.classList.toggle('active', i === idx));
    };
    setActive(0);

    const cio = new IntersectionObserver((entries) => {
      // pick the chapter with the largest intersection ratio that's intersecting
      let best = -1, bestRatio = 0;
      entries.forEach(e => {
        const i = parseInt(e.target.dataset.idx, 10);
        if (e.isIntersecting && e.intersectionRatio > bestRatio) {
          bestRatio = e.intersectionRatio; best = i;
        }
      });
      if (best >= 0) setActive(best);
    }, {
      threshold: [0.3, 0.5, 0.7, 0.9],
      rootMargin: '-25% 0px -25% 0px'
    });
    chapters.forEach((c, i) => { c.dataset.idx = i; cio.observe(c); });
  });

  /* === Stat Bar counters (re-use .counter from site.js if available, else animate) === */
  document.querySelectorAll('.statbar .counter').forEach(el => {
    if (el.dataset.animated || el.closest('.counter')?.dataset?.animated) return;
    // site.js already animates .counter via its own observer — we don't double-bind
  });

  /* === Logo marquee: duplicate content for seamless loop === */
  document.querySelectorAll('.marquee__track').forEach(track => {
    if (track.dataset.dupe) return;
    track.dataset.dupe = '1';
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    // wrap the duplicates inside the same wrapper, so they scroll together
    const items = track.innerHTML;
    track.innerHTML = items + items;
  });

})();
