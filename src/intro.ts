import { scramble } from './effects';
import { endIntro, playIntro } from './field';

// The <head> script adds intro-on before first paint when the intro should play (first visit this session, motion
// allowed), so the page never flashes in before it. This module runs the intro and hands the page back.

const root = document.documentElement;
const ui = document.getElementById('intro') as HTMLElement;
const phases = [...ui.querySelectorAll('li')];
const skipKeys = ['Escape', 'Enter', ' '];

const onKey = (e: KeyboardEvent) => {
  if (skipKeys.includes(e.key)) endIntro();
};
const revealHero = () => document.querySelectorAll<HTMLElement>('[data-hero]').forEach(scramble);

async function runIntro(): Promise<void> {
  scrollTo(0, 0);
  root.classList.add('intro-on');
  ui.hidden = false;
  addEventListener('keydown', onKey);
  addEventListener('wheel', endIntro, { passive: true });
  addEventListener('touchstart', endIntro, { passive: true });

  await playIntro((phase) => phases.forEach((li, i) => li.classList.toggle('on', i === phase)));

  removeEventListener('keydown', onKey);
  removeEventListener('wheel', endIntro);
  removeEventListener('touchstart', endIntro);
  root.classList.remove('intro-on');
  ui.hidden = true;
  sessionStorage.setItem('intro-seen', '1');
  revealHero();
}

export function initIntro(): void {
  ui.querySelector('button')?.addEventListener('click', endIntro);
  document.querySelectorAll('[data-replay]').forEach((b) => b.addEventListener('click', () => void runIntro()));
  if (root.classList.contains('intro-on')) void runIntro();
  else revealHero();
}
