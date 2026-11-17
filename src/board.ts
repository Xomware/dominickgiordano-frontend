import { glyph } from './font';

// The intro: a split-flap departures board flips through the career while a loading strip under it counts up to
// 100%. At 100% the padlock pops open and the board reads UNLOCKED, then it lands on the name and both panels
// switch off into the monogram. Times are seconds from the start of the intro.

type Row = { t: string; level: number };

// Career stops dim the year; the last frame dims the title instead.
const FRAMES: { at: number; rows: [string, number][] }[] = [
  { at: 0.75, rows: [['2016', 0.42], ['UNC CHAPEL HILL', 1]] },
  { at: 1.17, rows: [['2020', 0.42], ['UNIF.IO', 1]] },
  { at: 1.59, rows: [['2021', 0.42], ['PAYZER', 1]] },
  { at: 2.01, rows: [['2023', 0.42], ['DUKE ENERGY', 1]] },
  { at: 2.43, rows: [['2026', 0.42], ['LUMIST LABS', 1]] },
  { at: 2.9, rows: [['STATUS', 0.42], ['UNLOCKED', 1]] },
  { at: 3.9, rows: [['DOMINICK GIORDANO', 1], ['SOFTWARE ENGINEER', 0.42]] },
];
const LOAD_START = 0.75;
const LOAD_END = 2.85;
export const UNLOCK = 2.9;
const CLOSE = 5;
/** The panels are shut and the monogram starts to fill in. */
export const OFF = CLOSE + 0.2;
export const INTRO_END = 5.95;

const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// The padlock: a 5-row shackle over a 7-row body, 11 dots wide. Open, the shackle rides three rows higher with its
// left leg still in the body and its right leg out, which is what reads as "open" at this size.
const SHACKLE = ['...#####...', '..##...##..', '..#.....#..', '..#.....#..', '..#.....#..'];
const BODY = ['###########', '###########', '####...####', '####...####', '#####.#####', '###########', '###########'];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (lo: number, hi: number, x: number) => {
  const t = clamp((x - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
};
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export interface Board {
  frames: Row[][];
  nRows: number;
  nChars: number;
  ncols: number;
  /** LED pitch shared by the board and the strip. */
  bp: number;
  x: number;
  w: number;
  board: { y: number; h: number };
  strip: { y: number; h: number };
  color: { screen: string; led: string; line: string; dim: string; cell: string };
}

// Both panels share one pitch, sized so the longest row fits. Rows wrap at word boundaries on narrow screens, and
// every frame is padded to the same row count so the board never changes size between frames.
export function layoutBoard(W: number, H: number): Board {
  const bw = Math.min(W - 32, 940);
  const fit = Math.max(6, Math.floor((bw / 6 - 5) / 6));
  const wrap = (s: string) => {
    if (s.length <= fit) return [s];
    const out: string[] = [];
    let line = '';
    for (const w of s.split(' ')) {
      if (line && `${line} ${w}`.length > fit) {
        out.push(line);
        line = w;
      } else line = line ? `${line} ${w}` : w;
    }
    if (line) out.push(line);
    return out;
  };
  const frames = FRAMES.map((f) => f.rows.flatMap(([t, level]) => wrap(t).map((w) => ({ t: w, level }))));
  const nRows = Math.max(...frames.map((f) => f.length));
  const nChars = Math.max(...frames.flat().map((r) => r.t.length));
  const ncols = nChars * 6 + 5;
  const bp = Math.max(4, Math.min(10, Math.floor(bw / ncols)));
  const w = ncols * bp;
  const bh = (nRows * 10 + 3) * bp;
  const sh = 18 * bp;
  const gap = Math.max(12, bp * 2);
  const top = H * 0.47 - (bh + gap + sh) / 2;
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    frames: frames.map((f) => {
      const pad = Math.floor((nRows - f.length) / 2);
      return Array.from({ length: nRows }, (_, i) => f[i - pad] ?? { t: '', level: 1 });
    }),
    nRows,
    nChars,
    ncols,
    bp,
    x: (W - w) / 2,
    w,
    board: { y: top, h: bh },
    strip: { y: top + bh + gap, h: sh },
    color: {
      screen: token('--screen'),
      led: token('--screen-led'),
      line: token('--screen-line'),
      dim: token('--screen-dim'),
      cell: token('--screen-cell'),
    },
  };
}

export function phaseAt(it: number): number {
  return it < UNLOCK ? 0 : it < FRAMES[FRAMES.length - 1].at ? 1 : it < OFF ? 2 : 3;
}

export function lockCenter(b: Board): { x: number; y: number } {
  return { x: b.x + 7.5 * b.bp, y: b.strip.y + 10 * b.bp };
}

export function panelsCenter(b: Board): { x: number; y: number } {
  return { x: b.x + b.w / 2, y: (b.board.y + b.strip.y + b.strip.h) / 2 };
}

// Lit LEDs go into one path per brightness, so a frame is four fills rather than a thousand.
type Leds = { off: Path2D; 0.42: Path2D; 0.7: Path2D; 1: Path2D };
const leds = (): Leds => ({ off: new Path2D(), 0.42: new Path2D(), 0.7: new Path2D(), 1: new Path2D() });

function dot(b: Board, g: Leds, x: number, y: number, level: number): void {
  const r = b.bp * (level ? 0.38 : 0.26);
  const p = level ? g[level as 0.42 | 0.7 | 1] : g.off;
  p.moveTo(x + r, y);
  p.arc(x, y, r, 0, Math.PI * 2);
}

function text(b: Board, g: Leds, x: number, y: number, s: string, level: number): void {
  [...s].forEach((ch, k) => {
    glyph(ch).forEach((bits, gr) => {
      for (let gc = 0; gc < 5; gc++) {
        dot(b, g, x + (k * 6 + gc) * b.bp + b.bp / 2, y + gr * b.bp + b.bp / 2, (bits >> (4 - gc)) & 1 ? level : 0);
      }
    });
  });
}

function fill(ctx: CanvasRenderingContext2D, b: Board, g: Leds): void {
  ctx.fillStyle = b.color.led;
  ctx.globalAlpha = 0.07;
  ctx.fill(g.off);
  for (const level of [0.42, 0.7, 1] as const) {
    ctx.globalAlpha = level;
    ctx.fill(g[level]);
  }
  ctx.globalAlpha = 1;
}

// Opens and closes from the middle like a CRT; `flash` lights the border for the unlock beat. Leaves a clip set.
function panel(ctx: CanvasRenderingContext2D, b: Board, y: number, h: number, open: number, flash: number): void {
  const hh = h * open;
  ctx.beginPath();
  ctx.roundRect(b.x, y + (h - hh) / 2, b.w, hh, Math.min(12, b.bp * 1.4));
  ctx.fillStyle = b.color.screen;
  ctx.fill();
  ctx.strokeStyle = flash > 0 ? b.color.led : b.color.line;
  ctx.globalAlpha = flash > 0 ? 0.3 + 0.7 * flash : 1;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.clip();
}

function boardChar(b: Board, ri: number, ci: number, it: number, sec: number): Row {
  let k = -1;
  while (k + 1 < FRAMES.length && it >= FRAMES[k + 1].at) k++;
  if (k < 0) return { t: ' ', level: 1 };
  const row = b.frames[k][ri];
  const to = row.t[ci] ?? ' ';
  const from = k > 0 ? (b.frames[k - 1][ri].t[ci] ?? ' ') : ' ';
  if (to === from) return { t: to, level: row.level };
  // Cells flip left to right, each row a beat behind the one above, quick enough that every frame gets a
  // settled moment to be read in.
  const start = FRAMES[k].at + ci * 0.012 + ri * 0.03;
  const dur = 0.06 + hash(k * 977 + ri * 131 + ci) * 0.08;
  if (it < start) return { t: from, level: row.level };
  if (it < start + dur) return { t: FLAP[Math.floor(hash(Math.floor(sec * 24) * 31 + ci * 7 + ri * 13) * FLAP.length)], level: 0.7 };
  return { t: to, level: row.level };
}

function drawDepartures(ctx: CanvasRenderingContext2D, b: Board, it: number, sec: number): void {
  const { bp, x } = b;
  const open = smooth(0.42, 0.7, it) * (1 - smooth(CLOSE, CLOSE + 0.2, it));
  if (open <= 0.001) return;
  const top = b.board.y + (b.board.h * (1 - open)) / 2;
  ctx.save();
  ctx.globalAlpha = open;
  ctx.font = `500 ${bp >= 7 ? 12 : 11}px "Geist Mono", ui-monospace, monospace`;
  ctx.letterSpacing = '0.14em';
  ctx.fillStyle = b.color.dim;
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';
  ctx.fillText('CLT · DEPARTURES', x + 2, top - 10);
  ctx.textAlign = 'right';
  ctx.fillText('2016 → NOW', x + b.w - 2, top - 10);
  ctx.restore();

  ctx.save();
  panel(ctx, b, b.board.y, b.board.h, open, 0);
  const g = leds();
  ctx.fillStyle = b.color.cell;
  for (let ri = 0; ri < b.nRows; ri++) {
    const ty = b.board.y + (3 + ri * 10) * bp;
    for (let ci = 0; ci < b.nChars; ci++) {
      const tx = x + (3 + ci * 6) * bp;
      ctx.fillRect(tx - bp * 0.3, ty - bp * 0.4, bp * 5.6, bp * 7.8);
      const { t, level } = boardChar(b, ri, ci, it, sec);
      text(b, g, tx, ty, t, level);
    }
  }
  fill(ctx, b, g);
  // The seam across each split-flap cell.
  ctx.fillStyle = b.color.screen;
  for (let ri = 0; ri < b.nRows; ri++) ctx.fillRect(x, b.board.y + (6.5 + ri * 10) * bp - 0.5, b.w, 1);
  ctx.restore();
}

// One eased chunk per career stop, so the bar ticks over with the board.
function progress(it: number): number {
  const p = clamp((it - LOAD_START) / (LOAD_END - LOAD_START), 0, 1) * 5;
  if (p >= 5) return 1;
  const k = Math.floor(p);
  return (k + 1 - (1 - (p - k)) ** 3) / 5;
}

// The shackle pops three rows up with a one-row overshoot: the small beat when it unlocks.
function shackleLift(it: number): number {
  const t = it - UNLOCK;
  return t < 0 ? 0 : t < 0.05 ? 2 : t < 0.14 ? 4 : 3;
}

function drawStrip(ctx: CanvasRenderingContext2D, b: Board, it: number, sec: number): void {
  const { bp, x, ncols } = b;
  const y = b.strip.y;
  const open = smooth(0.48, 0.76, it) * (1 - smooth(CLOSE - 0.05, CLOSE + 0.15, it));
  if (open <= 0.001) return;
  const unlocked = it >= UNLOCK;
  ctx.save();
  panel(ctx, b, y, b.strip.h, open, unlocked ? Math.max(0, 1 - (it - UNLOCK) / 0.35) : 0);
  const g = leds();
  const at = (c: number, r: number): [number, number] => [x + (2 + c) * bp + bp / 2, y + r * bp + bp / 2];

  // Padlock on strip rows 2..16: three rows of headroom, the closed shackle on rows 5..9, the body on 10..16.
  const lock = unlocked ? 1 : 0.7;
  const lift = shackleLift(it);
  BODY.forEach((line, r) => [...line].forEach((ch, c) => ch === '#' && dot(b, g, ...at(c, 10 + r), lock)));
  SHACKLE.forEach((line, r) => [...line].forEach((ch, c) => ch === '#' && dot(b, g, ...at(c, 5 + r - lift), lock)));
  for (let k = 0; k < lift; k++) dot(b, g, ...at(2, 9 - k), lock);

  // Percentage right-aligned on rows 5..11; the bar on rows 14..16, level with the bottom of the lock.
  const p = progress(it);
  const pc = ncols - 3 - 23;
  text(b, g, x + pc * bp, y + 5 * bp, `${Math.floor(p * 100)}%`.padStart(4, ' '), unlocked ? 1 : 0.7);
  const c0 = 16;
  const label = unlocked ? 'OPEN' : 'LOADING';
  if (c0 + label.length * 6 < pc - 2) text(b, g, x + c0 * bp, y + 5 * bp, label, 0.42);
  const n = ncols - 3 - c0;
  const head = Math.floor(p * n);
  const blink = Math.floor(sec * 12) % 2 ? 1 : 0.7;
  for (let c = 0; c < n; c++) {
    const level = p >= 1 || c < head - 1 ? 1 : c === head - 1 ? blink : 0;
    for (let r = 0; r < 3; r++) dot(b, g, x + (c0 + c) * bp + bp / 2, y + (14 + r) * bp + bp / 2, level);
  }
  fill(ctx, b, g);
  ctx.restore();
}

/** Draws the board, the loading strip and, once both have shut, the line they collapse into. */
export function drawBoard(ctx: CanvasRenderingContext2D, b: Board, it: number, sec: number): void {
  drawDepartures(ctx, b, it, sec);
  drawStrip(ctx, b, it, sec);
  const q = 1 - (it - OFF) / 0.16;
  if (it <= OFF || q <= 0) return;
  const c = panelsCenter(b);
  ctx.fillStyle = b.color.led;
  ctx.globalAlpha = q;
  ctx.fillRect(c.x - (b.w / 2) * q, c.y - 1, b.w * q, 2);
  ctx.globalAlpha = 1;
}
