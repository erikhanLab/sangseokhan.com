/* Archive — lightweight section navigation and accessible image enlargement. */
(() => {
  const langs = new Set(['en', 'ja']);
  const sections = [...document.querySelectorAll('main section[id^="section-"]')];
  const sectionLinks = [...document.querySelectorAll('.archive-side-nav a[href^="#"]')];
  let scrollScheduled = false;
  let openOverlay = null;
  let lastFocus = null;

  function setLang(lang) {
    const safe = langs.has(lang) ? lang : 'en';
    document.documentElement.lang = safe;
    document.documentElement.dataset.lang = safe;
    document.querySelectorAll('[data-en]').forEach(element => {
      const translation = element.getAttribute(`data-${safe}`);
      if (translation !== null) element.textContent = translation;
    });
    document.querySelectorAll('.lang-switch a[data-lang]').forEach(link => {
      link.classList.toggle('active', link.dataset.lang === safe);
    });
  }

  function updateNav() {
    scrollScheduled = false;
    const boundary = Math.max(90, window.innerHeight * 0.33);
    let activeId = sections[0]?.id;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= boundary) activeId = section.id;
    }
    sectionLinks.forEach(link => {
      const selected = link.hash === `#${activeId}`;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function requestNavUpdate() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(updateNav);
  }

  function closeImage() {
    if (!openOverlay) return;
    const overlay = openOverlay;
    openOverlay = null;
    overlay.remove();
    document.body.style.removeProperty('overflow');
    lastFocus?.focus({ preventScroll: true });
    lastFocus = null;
  }

  function showImage(image) {
    closeImage();
    lastFocus = image;
    const overlay = document.createElement('div');
    overlay.className = 'zoom-overlay active';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', image.dataset.title || 'Image preview');
    overlay.tabIndex = -1;

    const content = document.createElement('div');
    content.className = 'zoom-overlay-content';
    const copy = document.createElement('img');
    copy.src = image.currentSrc || image.src;
    copy.alt = image.alt;
    copy.decoding = 'async';
    content.appendChild(copy);
    const meta = document.createElement('div');
    meta.className = 'zoom-meta';
    for (const [className, value] of [
      ['zoom-title', image.dataset.title],
      ['zoom-meta-line', image.dataset.meta],
      ['zoom-desc', image.dataset.desc]
    ]) {
      if (!value) continue;
      const line = document.createElement('div');
      line.className = className;
      line.textContent = value;
      meta.appendChild(line);
    }
    content.appendChild(meta);
    overlay.appendChild(content);
    overlay.addEventListener('click', closeImage);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    openOverlay = overlay;
    overlay.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && openOverlay) {
      event.preventDefault();
      closeImage();
    }
    const image = event.target.closest?.('.zoomable-drawing');
    if (image && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      showImage(image);
    }
  });
  document.querySelectorAll('.zoomable-drawing').forEach(image => {
    image.addEventListener('click', () => showImage(image));
  });
  document.querySelectorAll('.lang-switch a[data-lang]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const lang = langs.has(link.dataset.lang) ? link.dataset.lang : 'en';
      try { sessionStorage.setItem('lang', lang); } catch (_) { /* private mode */ }
      setLang(lang);
    });
  });
  window.addEventListener('scroll', requestNavUpdate, { passive: true });
  window.addEventListener('resize', requestNavUpdate, { passive: true });
  let initialLang = 'en';
  try { initialLang = sessionStorage.getItem('lang') || 'en'; } catch (_) { /* private mode */ }
  setLang(initialLang);
  requestNavUpdate();
})();
