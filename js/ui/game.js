// Lancement et sortie des parties, branchement de la simulation sur l’interface.

import { Sfx } from '../audio.js';
import { CAREER_LEVELS } from '../data/career.js';
import { clearInput } from '../input.js';
import { mySpec } from '../meta.js';
import { NET, netOpen, netSend } from '../net/net.js';
import { persist, save } from '../save.js';
import { doAct } from '../sim/flow.js';
import { EV, setRec } from '../sim/fx.js';
import { hooks } from '../sim/hooks.js';
import { G, ME, setG, setME, setP } from '../sim/state.js';
import { newRun } from '../sim/waves.js';
import { refreshViews, resetLevelView, say, toastFor } from './cards.js';
import { $, bannerRaw, show, toastRaw, toggleMute } from './dom.js';
import { resetHud } from './hud.js';
import { renderLab } from './lab.js';
import { openMap } from './map.js';
import { renderMenu } from './menu.js';
import { showOver } from './over.js';
import { clamp } from '../util.js';

// Toute action d'un joueur passe par act() : en local elle s'applique, chez l'invité elle part vers l'hôte.
export function act(a, i) {
  if (!G) return;
  if (NET.role === 'guest' && G.guest) {
    netSend({ t: 'act', a, i });
    return;
  }
  doAct(G.players[ME], a, i);
}

// curLevel = niveau de carrière joué (choisi sur la carte)
export let curLevel = 1,
  overMode = 'career';

export function setOverMode(v) {
  overMode = v;
}

export function playPressed() {
  if (save.mode === 'career') openMap();
  else startGame();
}

export function startGame(lv) {
  Sfx.init();
  Sfx.resume();
  if (save.mode === 'career') {
    if (typeof lv === 'number') curLevel = lv;
    curLevel = clamp(curLevel || save.career.max, 1, save.career.max);
  }
  const duo = save.players === 'duo';
  if (duo && NET.role === 'guest') return;
  if (duo && !(NET.role === 'host' && netOpen() && NET.peerInfo)) {
    openMenu();
    return;
  }
  const specs = [mySpec()];
  if (duo) specs.push(NET.peerInfo);
  setME(0);
  resetLevelView();
  show(null);
  $('#hud').hidden = false;
  $('#toasts').innerHTML = '';
  EV.length = 0;
  setRec(duo);
  if (duo) netSend({ t: 'start', mode: save.mode });
  save.runs++;
  persist();
  newRun(save.mode, specs, curLevel);
  resetHud();
}

export function openMenu() {
  setG(null);
  setP(null);
  setRec(false);
  $('#hud').hidden = true;
  if (NET.role === 'host') netSend({ t: 'menu' });
  renderMenu();
  show('scr-menu');
}

export function initGame() {
  // la simulation passe par ces fonctions pour tout ce qui touche à l'écran, au son et au réseau
  Object.assign(hooks, {
    sound: (n, ...a) => {
      if (Sfx[n]) Sfx[n](...a);
    },
    banner: bannerRaw,
    toast: toastRaw,
    say,
    toastFor,
    refreshViews,
    show,
    clearInput,
    gameOver: d => {
      netSend({ t: 'over', d });
      showOver(d);
    },
  });
  $('#btn-pause').addEventListener('click', () => {
    Sfx.init();
    act('pause');
  });
  $('#btn-resume').addEventListener('click', () => act('resume'));
  $('#btn-mute-menu').addEventListener('click', toggleMute);
  $('#btn-mute-pause').addEventListener('click', toggleMute);
  $('#btn-quit').addEventListener('click', () => act('quit'));
  $('#btn-again').addEventListener('click', () => startGame());
  $('#btn-nextlv').addEventListener('click', () => startGame(Math.min(CAREER_LEVELS, curLevel + 1)));
  $('#btn-menu').addEventListener('click', () => {
    if (overMode === 'career') {
      setG(null);
      setP(null);
      $('#hud').hidden = true;
      openMap(curLevel);
    } else openMenu();
  });
  $('#btn-map-back').addEventListener('click', openMenu);
  $('#btn-over-lab').addEventListener('click', () => {
    renderLab();
    show('scr-lab');
  });
}
