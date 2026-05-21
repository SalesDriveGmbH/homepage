/* =========================================================================
   SalesDrive Legal/Team Pages — Shared JS
   Apple-Style Word-by-Word Animation für h-legal und Section-Headlines
   ========================================================================= */

(function() {
  function wrapWords(el) {
    if (el.dataset.wrapped === 'true') return;
    el.dataset.wrapped = 'true';
    const html = el.innerHTML;
    const lines = html.split(/<br\s*\/?>/i);
    const newHtml = lines.map(line => {
      const parser = new DOMParser();
      const doc = parser.parseFromString('<div>' + line + '</div>', 'text/html');
      const root = doc.body.firstChild;

      function processNode(node) {
        if (node.nodeType === 3) {
          const text = node.textContent;
          const words = text.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          words.forEach(w => {
            if (/^\s+$/.test(w)) {
              frag.appendChild(document.createTextNode(w));
            } else if (w.length > 0) {
              const span = document.createElement('span');
              span.className = 'aw';
              span.textContent = w;
              frag.appendChild(span);
            }
          });
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === 1) {
          Array.from(node.childNodes).forEach(processNode);
        }
      }
      Array.from(root.childNodes).forEach(processNode);
      return '<span class="aw-line">' + root.innerHTML + '</span>';
    }).join('');
    el.innerHTML = newHtml;
  }

  const targets = document.querySelectorAll('.h-legal, .team-section-head h2, .office-headline, .team-cta h2');
  targets.forEach(wrapWords);

  const awIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const words = e.target.querySelectorAll('.aw');
      words.forEach((w, i) => {
        w.style.transitionDelay = (i * 50) + 'ms';
        requestAnimationFrame(() => w.classList.add('in'));
      });
      awIO.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  targets.forEach(t => awIO.observe(t));
})();
