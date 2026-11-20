// The Xomware grid shows a few apps at a time and dissolves one slot to its next app every few seconds, in LED
// dots. Every card stays in index.html for crawlers; this only regroups them into stacked slots. Each
// slot is sized by the tallest card in its stack, so a flip never moves the page.

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 560px)');
const TICK = 1500;
// Longer than dots-on's delay plus duration in styles.css.
const SWAP = 1100;

export function startShuffle(grid: HTMLElement): void {
  const cards = [...grid.querySelectorAll<HTMLElement>('.app')];
  const slots = () => (narrow.matches ? 3 : 4);
  if (reduced.matches || cards.length <= slots()) return;
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  const note = document.createElement('span');
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Pause';
  const bar = document.createElement('div');
  bar.className = 'shuffle';
  bar.append(note, button);
  grid.after(bar);
  grid.classList.add('shuffling');

  let stacks: HTMLElement[][] = [];
  let turn = 0;
  const show = (card: HTMLElement, on: boolean) => {
    card.classList.toggle('on', on);
    card.inert = !on;
  };
  const layout = () => {
    const n = slots();
    stacks = Array.from({ length: n }, (_, i) => cards.filter((_, j) => j % n === i));
    grid.replaceChildren(
      ...stacks.map((stack, i) => {
        const slot = document.createElement('div');
        slot.className = 'slot';
        stack.forEach((card, j) => {
          card.style.setProperty('--i', String(i));
          show(card, j === 0);
          slot.append(card);
        });
        return slot;
      }),
    );
    note.textContent = `${n} of ${cards.length} at a time`;
  };

  const pauses = new Set<string>();
  const hold = (why: string, on: boolean) => (on ? pauses.add(why) : pauses.delete(why));
  grid.addEventListener('pointerenter', () => hold('pointer', true));
  grid.addEventListener('pointerleave', () => hold('pointer', false));
  grid.addEventListener('focusin', () => hold('focus', true));
  grid.addEventListener('focusout', (e) => hold('focus', grid.contains(e.relatedTarget as Node | null)));
  document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));
  new IntersectionObserver(([entry]) => hold('away', !entry.isIntersecting)).observe(grid);
  button.addEventListener('click', () => {
    const paused = !pauses.has('user');
    hold('user', paused);
    button.textContent = paused ? 'Resume' : 'Pause';
  });

  layout();
  narrow.addEventListener('change', layout);
  setInterval(() => {
    if (pauses.size) return;
    const stack = stacks[turn++ % stacks.length];
    if (stack.length < 2) return;
    const [out, next] = stack;
    stack.push(stack.shift() as HTMLElement);
    show(out, false);
    show(next, true);
    out.classList.replace('settled', 'leaving') || out.classList.add('leaving');
    next.classList.replace('settled', 'entering') || next.classList.add('entering');
    setTimeout(() => {
      out.classList.replace('leaving', 'settled');
      next.classList.replace('entering', 'settled');
    }, SWAP);
  }, TICK);
}
