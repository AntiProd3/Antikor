// Raccourcis clavier et mise en pause automatique.

import { Sfx } from '../audio.js';
import { clearInput, keys } from '../input.js';
import { pause } from '../sim/flow.js';
import { G } from '../sim/state.js';
import { chooseLevel } from './cards.js';
import { $, currentScreen, toggleMute } from './dom.js';
import { act, curLevel, openMenu, playPressed, startGame } from './game.js';

export function initKeyboard() {
  addEventListener('keydown', e => {
    Sfx.init();
    Sfx.resume();
    if (e.target.tagName === 'INPUT') return;
    keys.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'KeyM') {
      toggleMute();
      return;
    }
    const cur = currentScreen();
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (G && G.state === 'play') act('pause');
      else if (cur === 'scr-pause') act('resume');
      else if (cur === 'scr-map') {
        if (!$('#map-pop').hidden) $('#map-pop').hidden = true;
        else openMenu();
      } else if (cur === 'scr-lab' || cur === 'scr-inv') {
        if (!$('#box-open').hidden) return;
        openMenu();
      }
      return;
    }
    if (cur === 'scr-level' && /^Digit[1-4]$/.test(e.code)) {
      chooseLevel(+e.code.slice(5) - 1);
      return;
    }
    if (cur === 'scr-shop') {
      if (e.code === 'KeyR') act('reroll');
      else if (e.code === 'Enter') act('ready');
      else if (/^Digit[1-4]$/.test(e.code)) act('buy', +e.code.slice(5) - 1);
      return;
    }
    if (cur === 'scr-menu' && e.code === 'Enter' && e.target.tagName !== 'INPUT') {
      playPressed();
      return;
    }
    if (cur === 'scr-map' && e.code === 'Enter') {
      const L = +($('#map-pop').dataset.lv || 0);
      if (!$('#map-pop').hidden && L) startGame(L);
      return;
    }
    if (cur === 'scr-over' && e.code === 'Enter') {
      if (!$('#btn-nextlv').hidden) startGame(curLevel + 1);
      else startGame();
      return;
    }
  });
  addEventListener('keyup', e => keys.delete(e.code));
  // En duo, perdre le focus ne met pas en pause (le partenaire continue) ; l'hôte qui change d'onglet met la partie en pause car elle s'arrête chez lui
  addEventListener('blur', () => {
    clearInput(true);
    if (G && G.state === 'play') pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G && G.state === 'play') pause();
  });
}
