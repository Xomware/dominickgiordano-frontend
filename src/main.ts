import './styles.css';
import { startField } from './field';
import { initLook, initScrollSpy } from './nav';

initLook();
initScrollSpy();
startField(document.getElementById('field') as HTMLCanvasElement);
