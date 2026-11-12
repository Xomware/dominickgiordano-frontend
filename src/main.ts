import './styles.css';
import { startDisplay } from './display';
import { initReveal } from './effects';
import { startField } from './field';
import { initIntro } from './intro';
import { initLook, initScrollSpy } from './nav';
import { startTicker } from './ticker';

initLook();
initScrollSpy();
startField(document.getElementById('field') as HTMLCanvasElement);
initIntro();
initReveal();
startTicker(document.querySelector('.ticker') as HTMLElement);
startDisplay(document.querySelector('.scr') as HTMLElement);
