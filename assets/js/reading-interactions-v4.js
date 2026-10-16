/* HAN v4 — Reader-first interactions, desktop enhancement only.
   Uses existing figure files and captions; no fabricated scientific content.
   Does not replace the site's scrollspy / language code. */
(() => {
  'use strict';
  const desktop = window.matchMedia('(min-width: 1024px)');
  let cleanup = [];
  let initialized = false;
  const localizers = [];
  const isJa = () => document.documentElement.getAttribute('data-lang') === 'ja';
  const translated = (en, ja) => isJa() ? ja : en;
  function localize(el, en, ja, attribute = 'textContent') {
    const update = () => { if (attribute === 'textContent') el.textContent = translated(en, ja); else el.setAttribute(attribute, translated(en, ja)); };
    localizers.push(update);
    update();
  }
  const languageObserver = new MutationObserver(() => localizers.forEach(update => update()));
  languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function installReadingPosition() {
    const sideNav = document.querySelector('.research-side-nav, .publication-side-nav');
    const main = document.querySelector('main#main-content');
    if (!sideNav || !main) return;
    const nav = sideNav.querySelector('nav');
    if (!nav) return;
    const panel = make('div', 'v4-reading-progress');
    panel.setAttribute('role', 'progressbar');
    panel.setAttribute('aria-label', 'Page reading progress');
    panel.setAttribute('aria-valuemin', '0');
    panel.setAttribute('aria-valuemax', '100');
    panel.setAttribute('aria-valuenow', '0');
    const label = make('div', 'v4-reading-progress-label');
    const wording = make('span');
    localize(wording, 'Reading progress', '読了位置');
    localize(panel, 'Page reading progress', 'ページの読了位置', 'aria-label');
    const count = make('span', '', '0%');
    label.append(wording, count);
    const track = make('div', 'v4-reading-progress-track');
    track.setAttribute('aria-hidden', 'true');
    const fill = make('div', 'v4-reading-progress-fill');
    track.append(fill);
    panel.append(label, track);
    nav.after(panel);

    let scheduled = false;
    const update = () => {
      scheduled = false;
      const top = main.getBoundingClientRect().top + window.scrollY;
      const end = main.getBoundingClientRect().bottom + window.scrollY;
      const available = Math.max(1, end - top - window.innerHeight * 0.55);
      const fraction = clamp((window.scrollY - top + window.innerHeight * 0.28) / available, 0, 1);
      const percent = Math.round(fraction * 100);
      fill.style.transform = `scaleX(${fraction})`;
      count.textContent = `${percent}%`;
      panel.setAttribute('aria-valuenow', String(percent));
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    cleanup.push(() => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      panel.remove();
    });
  }

  function figureCandidates() {
    const published = [...document.querySelectorAll('.current-project-figure--published > img')];
    const paperImages = [...document.querySelectorAll('body:has(.top-back) .figure > img')];
    return [...published, ...paperImages].filter(img => {
      const src = img.getAttribute('src') || '';
      return /^\/assets\/(?:publications|research)\//.test(src);
    });
  }

  function installFigureViewer() {
    const images = figureCandidates();
    if (!images.length) return;
    const dialog = make('dialog', 'v4-figure-viewer');
    localize(dialog, 'Research figure inspector', '研究図の拡大表示', 'aria-label');
    const shell = make('div', 'v4-viewer-shell');
    const toolbar = make('div', 'v4-viewer-toolbar');
    const title = make('div', 'v4-viewer-title', 'Research figure');
    const controls = make('div', 'v4-viewer-controls');
    const less = make('button', '', '−'); less.type = 'button'; localize(less, 'Zoom out', '縮小', 'aria-label');
    const zoomText = make('span', 'v4-viewer-zoom-status', '100%');
    const more = make('button', '', '+'); more.type = 'button'; localize(more, 'Zoom in', '拡大', 'aria-label');
    const reset = make('button', '', 'Fit'); reset.type = 'button'; localize(reset, 'Fit', '全体表示'); localize(reset, 'Fit figure to window', '図をウィンドウに合わせる', 'aria-label');
    const close = make('button', '', 'Close'); close.type = 'button'; localize(close, 'Close', '閉じる'); localize(close, 'Close figure inspector', '図の拡大表示を閉じる', 'aria-label');
    controls.append(less, zoomText, more, reset, close);
    toolbar.append(title, controls);
    const stage = make('div', 'v4-viewer-stage');
    localize(stage, 'Scrollable original figure', 'スクロールできる原寸図', 'aria-label');
    stage.tabIndex = 0;
    const image = make('img', '');
    image.alt = '';
    stage.append(image);
    const captionBox = make('div', 'v4-viewer-caption');
    const caption = make('div', 'v4-caption-text');
    const links = make('div', 'v4-source-links');
    const note = make('div', 'v4-viewer-note');
    localize(note, 'Figure displayed from the existing site asset. Scientific content is unchanged.', '既存サイトの図版をそのまま表示しています。科学的内容は変更していません。');
    captionBox.append(caption, links, note);
    shell.append(toolbar, stage, captionBox);
    dialog.append(shell);
    document.body.append(dialog);

    const zooms = [1, 1.5, 2, 3];
    let zoomIndex = 0;
    let opener = null;
    const setZoom = (index) => {
      zoomIndex = clamp(index, 0, zooms.length - 1);
      zoomText.textContent = `${Math.round(zooms[zoomIndex] * 100)}%`;
      image.style.width = `${zooms[zoomIndex] * 100}%`;
      less.disabled = zoomIndex === 0;
      more.disabled = zoomIndex === zooms.length - 1;
    };
    less.addEventListener('click', () => setZoom(zoomIndex - 1));
    more.addEventListener('click', () => setZoom(zoomIndex + 1));
    reset.addEventListener('click', () => { setZoom(0); stage.scrollTop = 0; stage.scrollLeft = 0; });
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

    const created = [];
    images.forEach((img) => {
      const figure = img.parentElement;
      if (!figure) return;
      const button = make('button', 'v4-figure-trigger');
      localize(button, 'Inspect figure', '図を拡大');
      button.type = 'button';
      const originalCaption = figure.querySelector('.caption, .current-project-caption');
      const captionText = (originalCaption?.textContent || img.alt || 'Research figure').replace(/\s+/g, ' ').trim();
      const figureNumber = captionText.match(/^(Figure\s+\d+|Fig\.?\s*\d+)/i)?.[0];
      localize(button, `Inspect ${figureNumber || img.alt || 'research figure'} at full resolution`, '研究図を原寸で表示する', 'aria-label');
      img.insertAdjacentElement('afterend', button);
      created.push(button);
      button.addEventListener('click', () => {
        opener = button;
        image.src = img.currentSrc || img.src;
        image.alt = img.alt || 'Research figure';
        title.textContent = figureNumber || img.alt || 'Research figure';
        caption.textContent = (originalCaption?.textContent || img.alt || captionText).replace(/\s+/g, ' ').trim();
        links.replaceChildren();
        const assetLink = make('a', '', translated('Open source image ↗', '元画像を開く ↗'));
        assetLink.href = img.getAttribute('src');
        assetLink.target = '_blank'; assetLink.rel = 'noopener noreferrer';
        links.append(assetLink);
        // Citation information is drawn only from links already on this page.
        const publishedSource = figure.querySelector('.current-project-caption-source');
        const doiLink = document.querySelector('.pub-meta a[href^="https://doi.org/"]');
        const cited = publishedSource || doiLink;
        if (cited) {
          const cite = make('a', '', publishedSource ? translated('Publication details ↗', '論文詳細 ↗') : translated('Publication DOI ↗', '論文 DOI ↗'));
          cite.href = cited.href;
          if (cited.origin !== location.origin) { cite.target = '_blank'; cite.rel = 'noopener noreferrer'; }
          links.append(cite);
        }
        stage.scrollTop = 0; stage.scrollLeft = 0;
        setZoom(0);
        dialog.showModal();
        close.focus();
      });
    });
    cleanup.push(() => {
      if (dialog.open) dialog.close();
      created.forEach(button => button.remove());
      dialog.remove();
    });
  }

  function start() {
    if (!desktop.matches || initialized) return;
    initialized = true;
    installReadingPosition();
    installFigureViewer();
  }
  function stop() {
    if (!initialized) return;
    const operations = cleanup;
    cleanup = [];
    operations.reverse().forEach(fn => fn());
    localizers.length = 0;
    initialized = false;
  }
  const apply = () => desktop.matches ? start() : stop();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
  desktop.addEventListener('change', apply);
})();
