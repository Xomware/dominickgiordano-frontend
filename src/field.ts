import { bitmap } from './font';

// A full-screen dot matrix behind the page. Each section names a pattern with data-pat, and the field blends
// between the pattern under the middle of the viewport and the next one. Anything marked data-quiet dims the dots
// beneath it by that factor so text never sits on full-brightness animation.

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const TICKERS: Record<string, number[]> = {
  lumist: bitmap('LUMIST LABS · LUMIOS · VECTOR · BEACON · LUMILEARN · BD PULSE · '),
  apps: bitmap('XOMIFY · XOMPER · XOMFIT · XOMCLOUD · XOM APPETIT · XOM FORMS · ARMCHAIR JUDGE · CLT DYNASTY · '),
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (lo: number, hi: number, x: number) => {
  const t = clamp((x - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
};
const token = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();

const pointer = { x: 0, y: 0, on: false };
const clicks: { x: number; y: number; t: number }[] = [];
let glow: Element | null = null;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let W = 0;
let H = 0;
let sp = 14;
let cols = 0;
let rows = 0;
let wide = false;
let sections: { pat: string; top: number }[] = [];
let quiet: HTMLElement[] = [];
let heat: Float32Array = new Float32Array(0);
let mask: Float32Array = new Float32Array(0);
let base = document.createElement('canvas');
let lit = '';
let k = 0;
let tick = 0;
let lastT = 0;
let lastY = 0;

// Fractional index of the section under the middle of the viewport; the last section wins at the bottom.
function where(): number {
  if (!sections.length) return 0;
  if (scrollY >= root.scrollHeight - H - 2) return sections.length - 1;
  const mid = scrollY + H * 0.5;
  let i = 0;
  sections.forEach((s, j) => {
    if (s.top <= mid) i = j;
  });
  const next = sections[i + 1];
  return next ? i + clamp((mid - sections[i].top) / (next.top - sections[i].top), 0, 1) : i;
}

// The monogram is rasterised at one pixel per dot, so anti-aliased edges become half-lit dots.
function monogram(): Float32Array {
  const g = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!g) throw new Error('2D canvas unavailable');
  g.canvas.width = cols;
  g.canvas.height = rows;
  const font = (px: number) => `800 ${px}px Geist, system-ui, sans-serif`;
  let px = rows * (wide ? 0.6 : 0.34);
  g.font = font(px);
  const maxW = cols * (wide ? 0.44 : 0.8);
  const w = g.measureText('DG').width;
  if (w > maxW) {
    px *= maxW / w;
    g.font = font(px);
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#fff';
  g.fillText('DG', cols * (wide ? 0.73 : 0.5), rows * (wide ? 0.54 : 0.72));
  const data = g.getImageData(0, 0, cols, rows).data;
  const m = new Float32Array(cols * rows);
  for (let i = 0; i < m.length; i++) m[i] = data[i * 4 + 3] / 255;
  return m;
}

// Unlit dots never change, so they are drawn once to an offscreen canvas and blitted each frame.
function paint(): void {
  lit = token('--lit');
  const d = Math.min(devicePixelRatio || 1, 2);
  base = document.createElement('canvas');
  base.width = Math.round(W * d);
  base.height = Math.round(H * d);
  const g = base.getContext('2d');
  if (!g) throw new Error('2D canvas unavailable');
  g.scale(d, d);
  g.fillStyle = token('--dot');
  const o = sp / 2;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) g.fillRect(c * sp + o - 0.8, r * sp + o - 0.8, 1.6, 1.6);
}

function measure(): void {
  const d = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  canvas.width = Math.round(W * d);
  canvas.height = Math.round(H * d);
  ctx.setTransform(d, 0, 0, d, 0, 0);
  sp = W < 600 ? 12 : 14;
  cols = Math.ceil(W / sp);
  rows = Math.ceil(H / sp);
  wide = W > 900;
  sections = [...document.querySelectorAll<HTMLElement>('[data-pat]')].map((el) => ({
    pat: el.dataset.pat ?? '',
    top: el.getBoundingClientRect().top + scrollY,
  }));
  quiet = [...document.querySelectorAll<HTMLElement>('[data-quiet]')];
  heat = new Float32Array(cols * rows);
  mask = monogram();
  paint();
}

function pattern(p: string, c: number, r: number, x: number, y: number, t: number, i: number): number {
  if (p === 'mono') return mask[i] * (0.72 + 0.28 * Math.sin(t * 1.8 - c * 0.22 + r * 0.09));
  if (p === 'ripple') {
    const d = Math.hypot(x - W * (wide ? 0.7 : 0.5), y - H * 0.55);
    return Math.pow(0.5 + 0.5 * Math.sin(d * 0.045 - t * 2.2), 6) * Math.max(0, 1 - d / (Math.max(W, H) * 0.8));
  }
  if (p === 'bands') return Math.pow(0.5 + 0.5 * Math.sin((x * 0.7 + y) * 0.016 - t * 1.3), 12);
  if (p === 'bars') {
    const bar = Math.floor(c / 4);
    if (c % 4 === 3) return 0;
    const h = 0.16 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.8 + bar * 1.9)) * (0.55 + 0.45 * Math.abs(Math.sin(bar * 2.7)));
    const top = 1 - h;
    const ry = r / rows;
    if (ry < top) return 0;
    return ry < top + 1.2 / rows ? 1 : 0.42;
  }
  if (p.startsWith('ticker:')) {
    const tk = TICKERS[p.slice(7)];
    if (!tk) return 0;
    const z = wide ? 2 : 1;
    const h = 7 * z;
    const rr = r - Math.floor(rows * 0.5 - h / 2);
    if (rr === -3 || rr === h + 2) return 0.22;
    if (rr < 0 || rr >= h) return 0;
    return (tk[Math.floor((c + tick) / z) % tk.length] >> Math.floor(rr / z)) & 1 ? 1 : 0.04;
  }
  return 0;
}

function frame(now: number): void {
  const t = reduced.matches ? 0 : now / 1000;
  const sec = now / 1000;
  const dt = Math.min(0.05, (now - lastT) / 1000);
  const dy = scrollY - lastY;
  lastT = now;
  lastY = scrollY;
  k += (where() - k) * 0.07;
  if (!reduced.matches) tick += (11 + Math.min(180, Math.abs(dy) * 1.5)) * dt;

  const i0 = Math.floor(k);
  const f = k - i0;
  const a = sections[i0]?.pat ?? 'mono';
  const b = sections[i0 + 1]?.pat ?? a;
  const w = smooth(0.45, 1, f);
  const zones = quiet
    .map((el) => ({ r: el.getBoundingClientRect(), f: Number(el.dataset.quiet) }))
    .filter(({ r }) => r.bottom > 0 && r.top < H);
  const g = glow?.isConnected ? glow.getBoundingClientRect() : null;
  const live = clicks.filter((p) => sec - p.t < 1.6);

  const N = 7;
  const paths = Array.from({ length: N }, () => new Path2D());
  const o = sp / 2;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(base, 0, 0, W, H);
  for (let r = 0; r < rows; r++) {
    const y = r * sp + o;
    const rowZones = zones.filter((z) => y > z.r.top && y < z.r.bottom);
    for (let c = 0; c < cols; c++) {
      const x = c * sp + o;
      const i = r * cols + c;
      let v = w < 1 ? pattern(a, c, r, x, y, t, i) * (1 - w) : 0;
      if (w > 0) v += pattern(b, c, r, x, y, t, i) * w;
      if (pointer.on) {
        const mx = x - pointer.x;
        const my = y - pointer.y;
        v += Math.exp(-(mx * mx + my * my) / 3200) * 0.9;
      }
      for (const p of live) {
        const age = sec - p.t;
        const e = Math.abs(Math.hypot(x - p.x, y - (p.y - scrollY)) - age * 620);
        if (e < 26) v += (1 - e / 26) * (1 - age / 1.6);
      }
      if (g) {
        const ex = Math.max(g.left - x, 0, x - g.right);
        const ey = Math.max(g.top - y, 0, y - g.bottom);
        const e = ex === 0 && ey === 0 ? Math.min(x - g.left, g.right - x, y - g.top, g.bottom - y) : Math.hypot(ex, ey);
        if (e < 28) v += Math.exp(-(e * e) / 90) * 0.9;
      }
      for (const z of rowZones) {
        if (x > z.r.left && x < z.r.right) {
          v *= z.f;
          break;
        }
      }
      // Phosphor persistence: lit dots fade instead of switching off, so anything moving leaves a trail.
      const hv = (heat[i] = Math.max(v, heat[i] * 0.9));
      if (hv < 0.06) continue;
      const level = Math.min(N - 1, (hv * N) | 0);
      const s = 1.6 + ((level + 1) / N) * 3.6;
      paths[level].rect(x - s / 2, y - s / 2, s, s);
    }
  }
  ctx.fillStyle = lit;
  paths.forEach((p, level) => {
    ctx.globalAlpha = 0.22 + (0.78 * (level + 1)) / N;
    ctx.fill(p);
  });
  ctx.globalAlpha = 1;
  requestAnimationFrame(frame);
}

export function startField(el: HTMLCanvasElement): void {
  const c = el.getContext('2d');
  if (!c) throw new Error('2D canvas unavailable');
  canvas = el;
  ctx = c;

  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.on = true;
    },
    { passive: true },
  );
  root.addEventListener('pointerleave', () => {
    pointer.on = false;
  });
  addEventListener('pointerdown', (e) => {
    clicks.push({ x: e.clientX, y: e.clientY + scrollY, t: performance.now() / 1000 });
    if (clicks.length > 8) clicks.shift();
  });
  document.addEventListener('pointerover', (e) => {
    glow = e.target instanceof Element ? e.target.closest('[data-glow]') : null;
  });

  addEventListener('resize', measure);
  new ResizeObserver(measure).observe(document.body);
  new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ['data-look'] });
  document.fonts.ready.then(measure);

  measure();
  requestAnimationFrame(frame);
}
