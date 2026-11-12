import { bitmap } from './font';

// The hero's LED strip. The stack list stays in the DOM for screen readers and no-JS visitors; the canvas
// scrolls the same words and speeds up while the page is scrolling.

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const PITCH = 5;

export function startTicker(box: HTMLElement): void {
  const label = box.querySelector<HTMLElement>('.ticker-text');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!label || !ctx) throw new Error('ticker markup or 2D canvas missing');
  canvas.setAttribute('aria-hidden', 'true');
  label.classList.add('vh');
  box.append(canvas);

  const cols = bitmap(`${label.textContent} · `);
  let width = 0;
  let offset = 0;
  let lastT = performance.now();
  let lastY = scrollY;

  const size = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    width = canvas.getBoundingClientRect().width;
    canvas.width = Math.round(width * d);
    canvas.height = Math.round(7 * PITCH * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    const dy = scrollY - lastY;
    lastT = now;
    lastY = scrollY;
    if (!reduced.matches) offset += (16 + Math.min(140, Math.abs(dy) * 1.4)) * dt;
    const r = canvas.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const led = getComputedStyle(canvas).getPropertyValue('--screen-led').trim();
      const rad = PITCH * 0.36;
      const on = new Path2D();
      const off = new Path2D();
      ctx.clearRect(0, 0, width, 7 * PITCH);
      for (let c = 0; c < Math.floor(width / PITCH); c++) {
        const m = cols[Math.floor(c + offset) % cols.length];
        for (let row = 0; row < 7; row++) {
          const x = c * PITCH + PITCH / 2;
          const y = row * PITCH + PITCH / 2;
          const lit = (m >> row) & 1;
          const p = lit ? on : off;
          p.moveTo(x + rad, y);
          p.arc(x, y, lit ? rad : rad * 0.5, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = led;
      ctx.globalAlpha = 0.14;
      ctx.fill(off);
      ctx.globalAlpha = 1;
      ctx.shadowColor = led;
      ctx.shadowBlur = 6;
      ctx.fill(on);
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(frame);
  };

  new ResizeObserver(size).observe(canvas);
  size();
  requestAnimationFrame(frame);
}
