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
    const close = make('button', 'v4-viewer-close', '×');
    close.type = 'button';
    localize(close, 'Close figure', '図を閉じる', 'aria-label');
    controls.append(close);
    toolbar.append(title, controls);
    const stage = make('div', 'v4-viewer-stage');
    localize(stage, 'Research figure', '研究図', 'aria-label');
    stage.tabIndex = 0;
    const image = make('img', '');
    image.alt = '';
    stage.append(image);
    const captionBox = make('div', 'v4-viewer-caption');
    const caption = make('div', 'v4-caption-text');
    const links = make('div', 'v4-source-links');
    captionBox.append(caption, links);
    shell.append(toolbar, stage, captionBox);
    dialog.append(shell);
    document.body.append(dialog);

    let opener = null;
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

    const created = [];
    images.forEach((img) => {
      const figure = img.parentElement;
      if (!figure) return;
      const button = make('button', 'v4-figure-trigger');
      const text = make('span');
      localize(text, 'View figure', '図を表示');
      const glyph = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      glyph.setAttribute('viewBox', '0 0 16 16');
      glyph.setAttribute('aria-hidden', 'true');
      glyph.innerHTML = '<path d="M6 3H3v3M10 3h3v3M3 10v3h3M13 10v3h-3"/>';
      button.append(text, glyph);
      button.type = 'button';
      const originalCaption = figure.querySelector('.caption, .current-project-caption');
      const captionText = (originalCaption?.textContent || img.alt || 'Research figure').replace(/\s+/g, ' ').trim();
      const figureNumber = captionText.match(/^(Figure\s+\d+|Fig\.?\s*\d+)/i)?.[0];
      localize(button, `View ${figureNumber || img.alt || 'research figure'}`, '研究図を表示', 'aria-label');
      img.insertAdjacentElement('afterend', button);
      created.push(button);
      button.addEventListener('click', () => {
        opener = button;
        image.src = img.currentSrc || img.src;
        image.alt = img.alt || 'Research figure';
        title.textContent = figureNumber || img.alt || 'Research figure';
        caption.textContent = (originalCaption?.textContent || img.alt || captionText).replace(/\s+/g, ' ').trim();
        links.replaceChildren();
        const appendMark = (anchor, kind) => {
          const mark = make('span', `editorial-mark editorial-mark--${kind}`);
          mark.setAttribute('aria-hidden', 'true');
          anchor.append(mark);
        };
        const assetLink = make('a', '', translated('Open source image', '元画像を開く'));
        assetLink.href = img.getAttribute('src');
        assetLink.target = '_blank'; assetLink.rel = 'noopener noreferrer';
        appendMark(assetLink, 'external'); // Image opens in a separate tab.
        links.append(assetLink);
        // Citation information is drawn only from links already on this page.
        const publishedSource = figure.querySelector('.current-project-caption-source');
        const doiLink = document.querySelector('.pub-meta a[href^="https://doi.org/"]');
        const cited = publishedSource || doiLink;
        if (cited) {
          const cite = make('a', '', publishedSource ? translated('Publication details', '論文詳細') : translated('Publication DOI', '論文 DOI'));
          cite.href = cited.href;
          // The publication link is often a same-site relative URL. Keep its
          // ordinary forward mark; only DOI/off-site sources use external marks.
          const sourceHref = cited.getAttribute('href') || '';
          const isExternal = /^https?:\/\//i.test(sourceHref) && new URL(sourceHref, document.baseURI).origin !== window.location.origin;
          if (isExternal) { cite.target = '_blank'; cite.rel = 'noopener noreferrer'; }
          appendMark(cite, isExternal ? 'external' : 'forward');
          links.append(cite);
        }
        stage.scrollTop = 0; stage.scrollLeft = 0;
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
