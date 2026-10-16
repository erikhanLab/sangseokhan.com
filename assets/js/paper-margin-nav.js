/* HAN v4.3 — paper-only adaptive margin navigation.
   The rail is shown only when the full paper, including breakout tables and
   figures, leaves enough room for a 32px gap. Never shift the paper itself. */
(() => {
  const nav = document.querySelector('.paper-margin-nav');
  const main = document.querySelector('main#main-content');
  if (!nav || !main) return;

  const media = window.matchMedia('(min-width: 1280px)');
  const links = [...nav.querySelectorAll('a[href^="#paper-"]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  if (sections.some(section => !section)) return;

  const EDGE_PADDING = 16;
  const CONTENT_GAP = 32;
  let frame = 0;
  let activeIndex = -1;

  function contentLeftEdge() {
    // Most papers fit inside <main>. Some tables/figures break out of that
    // width via transforms, so inspect their rendered geometry as well.
    const candidates = main.querySelectorAll(
      ':scope > *, section, figure, img, svg, canvas, ' +
      '[class*="figure"], [class*="Figure"], [class*="table"], ' +
      '[class*="Table"], [class*="wide"], [class*="full-width"]'
    );
    let edge = main.getBoundingClientRect().left;
    candidates.forEach(element => {
      if (!element.getClientRects().length) return;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      // A fixed/sticky overlay does not occupy space in the paper flow.
      const positioning = getComputedStyle(element).position;
      if (positioning === 'fixed' || positioning === 'sticky') return;
      if (rect.left < edge) edge = rect.left;
    });
    return edge;
  }

  function positionRail() {
    if (!media.matches) {
      nav.removeAttribute('data-paper-nav-ready');
      nav.style.removeProperty('--paper-nav-left');
      return;
    }

    const leftEdge = contentLeftEdge();
    const width = nav.getBoundingClientRect().width || 124;
    const left = leftEdge - CONTENT_GAP - width;
    if (left < EDGE_PADDING || !Number.isFinite(left)) {
      nav.removeAttribute('data-paper-nav-ready');
      nav.style.removeProperty('--paper-nav-left');
    } else {
      nav.style.setProperty('--paper-nav-left', `${Math.floor(left)}px`);
      nav.setAttribute('data-paper-nav-ready', '');
    }
  }

  function updateCurrentSection() {
    if (!media.matches) return;
    const threshold = Math.min(190, window.innerHeight * 0.26);
    let current = 0;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= threshold) current = index;
    });
    if (current === activeIndex) return;
    activeIndex = current;
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function update() {
    frame = 0;
    positionRail();
    updateCurrentSection();
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  window.addEventListener('scroll', () => {
    // Scrolling only changes the active item, never the rail position.
    if (media.matches) updateCurrentSection();
  }, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('load', schedule);
  media.addEventListener?.('change', () => { activeIndex = -1; schedule(); });
  document.fonts?.ready.then(schedule);
  // Breakout blocks can change height/width after initial render.
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    observer.observe(main);
    main.querySelectorAll('.tables-section, .figure, .figures, figure, img, svg').forEach(element => observer.observe(element));
  }
  links.forEach(link => link.addEventListener('click', () => {
    if (media.matches) requestAnimationFrame(updateCurrentSection);
  }));
  schedule();
})();
