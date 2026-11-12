const root = document.documentElement;

export function initLook(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('button[data-look]');
  const apply = (look: string) => {
    root.dataset.look = look;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.look === look)));
  };
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const look = b.dataset.look ?? 'dark';
      localStorage.setItem('look', look);
      apply(look);
    }),
  );
  apply(root.dataset.look ?? 'dark');
}

// The active section is whichever one crosses a thin band 40% down the viewport. Contact is too short to
// reach that band, so the bottom of the page forces it.
export function initScrollSpy(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.nav a, .rail-r a')];
  const sections = [...document.querySelectorAll<HTMLElement>('main > section[id]')];
  const last = sections[sections.length - 1];
  const setActive = (id: string) => links.forEach((a) => a.classList.toggle('on', a.hash === `#${id}`));

  const spy = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
    { rootMargin: '-40% 0px -59% 0px' },
  );
  sections.forEach((s) => spy.observe(s));

  addEventListener(
    'scroll',
    () => {
      if (last && innerHeight + scrollY >= root.scrollHeight - 2) setActive(last.id);
    },
    { passive: true },
  );
}
