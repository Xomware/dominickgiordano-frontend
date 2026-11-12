const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const GLYPHS = '#%&*+-/<=>?[]_01';

// Effects run on elapsed time and a timeout writes the last frame, because rAF pauses in background tabs and
// would otherwise leave text half-scrambled.
function animate(ms: number, draw: (p: number) => void): void {
  const t0 = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / ms);
    draw(p);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  setTimeout(() => draw(1), ms + 100);
}

// The original text is kept in data-text so a replayed scramble lands on the real words, not the last frame.
export function scramble(el: HTMLElement): void {
  const text = (el.dataset.text ??= el.textContent ?? '');
  if (reduced.matches) return;
  animate(600, (p) => {
    el.textContent =
      p >= 1
        ? text
        : [...text].map((ch, i) => (ch === ' ' || i / text.length < p ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
  });
}

function countUp(el: HTMLElement): void {
  const text = (el.dataset.text ??= el.textContent ?? '');
  const n = parseInt(text, 10);
  const suffix = text.slice(String(n).length);
  if (reduced.matches || Number.isNaN(n)) return;
  animate(1100, (p) => {
    el.textContent = p >= 1 ? text : `${Math.round(n * (1 - (1 - p) ** 3))}${suffix}`;
  });
}

export function initReveal(): void {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting || !(e.target instanceof HTMLElement)) return;
        io.unobserve(e.target);
        e.target.classList.add('in');
        if (e.target.hasAttribute('data-scramble')) scramble(e.target);
        if (e.target.hasAttribute('data-count')) countUp(e.target);
      }),
    { threshold: 0.2 },
  );
  document.querySelectorAll('[data-in]').forEach((el) => io.observe(el));
}
