/* HAN v4.2 — subtle desktop-only reading-location cue for publication details. */
(() => {
  const nav = document.querySelector('.paper-margin-nav');
  if (!nav) return;

  const media = window.matchMedia('(min-width: 1280px)');
  const links = [...nav.querySelectorAll('a[href^="#paper-"]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  if (sections.some(section => !section)) return;

  let raf = 0;
  let activeIndex = -1;
  const update = () => {
    raf = 0;
    if (!media.matches) return;
    const threshold = Math.min(190, window.innerHeight * 0.26);
    let current = 0;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= threshold) current = index;
    });
    if (activeIndex === current) return;
    activeIndex = current;
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const schedule = () => {
    if (!raf && media.matches) raf = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  media.addEventListener?.('change', () => {
    activeIndex = -1;
    schedule();
  });
  links.forEach(link => link.addEventListener('click', () => {
    if (media.matches) requestAnimationFrame(schedule);
  }));
  schedule();
})();
