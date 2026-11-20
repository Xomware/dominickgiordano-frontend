import './styles.css';
import { startDisplay } from './display';
import { initReveal } from './effects';
import { startField } from './field';
import { initIntro } from './intro';
import { initMail } from './mail';
import { initLook, initScrollSpy } from './nav';
import { startShuffle } from './shuffle';
import { startTicker } from './ticker';

initLook();
initScrollSpy();
startField(document.getElementById('field') as HTMLCanvasElement);
initIntro();
initReveal();
startTicker(document.querySelector('.ticker') as HTMLElement);
startDisplay(document.querySelector('.scr') as HTMLElement);
startShuffle(document.querySelector('#apps .grid') as HTMLElement);
initMail(document.querySelector('[data-mail]') as HTMLButtonElement, document.getElementById('mail') as HTMLElement);
