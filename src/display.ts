// The About screen: a photo (the <img> inside .scr, once there is one) or the DG monogram, drawn as an LED
// halftone. Hovering the screen fades the real photo in over it (CSS).

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export function startDisplay(scr: HTMLElement): void {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  canvas.setAttribute('aria-hidden', 'true');
  scr.querySelector('.scr-mark')?.remove();
  scr.prepend(canvas);
  const photo = scr.querySelector('img');

  let w = 0;
  let h = 0;
  let pitch = 7;
  let cols = 0;
  let rows = 0;
  let lum: Float32Array = new Float32Array(0);
  const pointer = { x: 0, y: 0, on: false };

  const sample = () => {
    const g = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!g || !cols || !rows) return;
    g.canvas.width = cols;
    g.canvas.height = rows;
    g.fillStyle = '#000';
    g.fillRect(0, 0, cols, rows);
    if (photo?.complete && photo.naturalWidth) {
      const s = Math.max(cols / photo.naturalWidth, rows / photo.naturalHeight);
      const pw = photo.naturalWidth * s;
      const ph = photo.naturalHeight * s;
      g.drawImage(photo, (cols - pw) / 2, (rows - ph) / 2, pw, ph);
    } else {
      let px = rows * 0.46;
      g.font = `800 ${px}px Geist, system-ui, sans-serif`;
      const tw = g.measureText('DG').width;
      if (tw > cols * 0.8) {
        px *= (cols * 0.8) / tw;
        g.font = `800 ${px}px Geist, system-ui, sans-serif`;
      }
      g.fillStyle = '#fff';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('DG', cols / 2, rows * 0.47);
    }
    const data = g.getImageData(0, 0, cols, rows).data;
    lum = new Float32Array(cols * rows);
    for (let i = 0; i < lum.length; i++) lum[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
  };

  const size = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    const r = scr.getBoundingClientRect();
    w = r.width;
    h = r.height;
    pitch = w < 320 ? 6 : 7;
    cols = Math.floor(w / pitch);
    rows = Math.floor(h / pitch);
    canvas.width = Math.round(w * d);
    canvas.height = Math.round(h * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    sample();
  };

  const frame = (now: number) => {
    const r = scr.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const t = reduced.matches ? 0 : now / 1000;
      const led = getComputedStyle(scr).getPropertyValue('--screen-led').trim();
      const N = 6;
      const levels = Array.from({ length: N }, () => new Path2D());
      const off = new Path2D();
      const scan = (((t * 0.3) % 1.4) - 0.2) * h;
      const ox = (w - cols * pitch) / 2 + pitch / 2;
      const oy = (h - rows * pitch) / 2 + pitch / 2;
      ctx.clearRect(0, 0, w, h);
      for (let row = 0; row < rows; row++) {
        const y = oy + row * pitch;
        const ds = Math.abs(y - scan);
        const sweep = ds < 16 ? (1 - ds / 16) * 0.35 : 0;
        for (let c = 0; c < cols; c++) {
          const x = ox + c * pitch;
          let v = lum[row * cols + c] * (0.86 + 0.14 * Math.sin(t * 2 + row * 0.35 + c * 0.12)) + sweep;
          if (pointer.on) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            v += Math.exp(-(dx * dx + dy * dy) / 1800) * 0.6;
          }
          off.moveTo(x + 0.9, y);
          off.arc(x, y, 0.9, 0, Math.PI * 2);
          if (v < 0.05) continue;
          const level = Math.min(N - 1, (Math.min(1, v) * N) | 0);
          const rad = pitch * 0.5 * Math.sqrt((level + 1) / N);
          levels[level].moveTo(x + rad, y);
          levels[level].arc(x, y, rad, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = led;
      ctx.globalAlpha = 0.12;
      ctx.fill(off);
      levels.forEach((p, level) => {
        ctx.globalAlpha = 0.35 + (0.65 * (level + 1)) / N;
        ctx.fill(p);
      });
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  };

  scr.addEventListener('pointermove', (e) => {
    const r = scr.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.on = e.pointerType === 'mouse';
  });
  scr.addEventListener('pointerleave', () => {
    pointer.on = false;
  });
  photo?.addEventListener('load', sample);
  document.fonts.ready.then(sample);
  new ResizeObserver(size).observe(scr);
  size();
  requestAnimationFrame(frame);
}
