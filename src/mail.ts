import { scramble } from './effects';

// The addresses never appear whole in the page or the bundle, so scrapers matching name@domain find nothing.
// They are stored reversed and in two halves, and only assembled when someone clicks the Email button.
const ADDRESSES = [
  ['Work', 'mod', 'moc.sbaltsimul'],
  ['Personal', 'onadroig.jkcinimod', 'moc.liamg'],
];
const flip = (s: string) => [...s].reverse().join('');

function row([label, user, domain]: string[]): HTMLLIElement {
  const address = `${flip(user)}@${flip(domain)}`;
  const li = document.createElement('li');
  const tag = document.createElement('span');
  tag.textContent = label;
  const link = document.createElement('a');
  link.href = `mailto:${address}`;
  link.textContent = address;
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'linkbtn';
  copy.textContent = 'Copy';
  copy.addEventListener('click', async () => {
    await navigator.clipboard.writeText(address);
    copy.textContent = 'Copied';
    setTimeout(() => (copy.textContent = 'Copy'), 1600);
  });
  li.append(tag, link, copy);
  return li;
}

export function initMail(button: HTMLButtonElement, list: HTMLElement): void {
  button.addEventListener('click', () => {
    const open = list.hidden;
    if (!list.childElementCount) list.append(...ADDRESSES.map(row));
    list.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) list.querySelectorAll<HTMLElement>('a').forEach(scramble);
  });
}
