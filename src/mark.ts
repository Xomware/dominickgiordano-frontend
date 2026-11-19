import raw from './assets/dg.svg?raw';

// dg.svg is the one copy of the logo: CSS masks it, and the canvas pieces (dot field, About screen) stroke its path.
const svg = new DOMParser().parseFromString(raw, 'image/svg+xml').documentElement;
const path = svg.querySelector('path')!;
const [, , W, H] = svg.getAttribute('viewBox')!.split(' ').map(Number);
const shape = new Path2D(path.getAttribute('d')!);
const stroke = Number(path.getAttribute('stroke-width'));

export const MARK_ASPECT = W / H;

/** Draws the DG mark in white, `w` wide and centred on (x, y). */
export function drawMark(g: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  const s = w / W;
  g.save();
  g.translate(x - w / 2, y - (H * s) / 2);
  g.scale(s, s);
  g.lineWidth = stroke;
  g.miterLimit = 10;
  g.strokeStyle = '#fff';
  g.stroke(shape);
  g.restore();
}
