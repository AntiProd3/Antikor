// Lancement et sortie des parties, branchement de la simulation sur l’interface.

import { Sfx } from '../audio.js';
import { CAREER_LEVELS } from '../data/career.js';
import { clearInput } from '../input.js';
import { prog, request } from '../online/client.js';
import { duo, duoAct, startDuo } from '../online/duo.js';
import { save } from '../save.js';
import { doAct } from '../sim/flow.js';
import { EV, setRec } from '../sim/fx.js';
import { hooks } from '../sim/hooks.js';
import { G, ME, setG, setME, setP } from '../sim/state.js';
import { newRun } from '../sim/waves.js';
import { refreshViews, resetLevelView, say, toastFor } from './cards.js';
import { $, bannerRaw, notice, show, toastRaw, toggleMute } from './dom.js';
import { duoPause, duoResume } from './duo.js';
import { resetHud } from './hud.js';
import { renderLab } from './lab.js';
import { openMap } from './map.js';
import { renderMenu } from './menu.js';
import { showOver } from './over.js';
import { clamp } from '../util.js';

// Toute action du joueur passe par act() : appliquée ici en solo, envoyée au serveur en duo.
// En duo, la pause n'arrête pas la partie : seul le menu s'affiche.
export function act(a, i) {
  if (!G) return;
  if (!G.online) return doAct(G.players[ME], a, i);
  if (a === 'pause') {
    if (G.state !== 'over') duoPause();
  } else if (a === 'resume') duoResume();
  else {
    if (a === 'quit') show(null);
    duoAct(a, i);
  }
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

// Une partie commence par un ticket du serveur : il note le début de la partie (pour vérifier le résultat
// à la fin) et renvoie le joueur à créer (talents, armes possédées, arme équipée) d'après le compte.
let starting = false;

export async function startGame(lv) {
  if (starting) return;
  Sfx.init();
  Sfx.resume();
  if (duo.on) return startDuoGame(lv);
  if (save.mode === 'career') {
    if (typeof lv === 'number') curLevel = lv;
    curLevel = clamp(curLevel || prog.career.max, 1, prog.career.max);
  }
  starting = true;
  const r = await request('run_start', { mode: save.mode, level: save.mode === 'career' ? curLevel : 0 });
  starting = false;
  if (!r.ok) {
    notice(r.msg || 'Impossible de lancer la partie.');
    return;
  }
  setME(0);
  resetLevelView();
  show(null);
  $('#hud').hidden = false;
  $('#toasts').innerHTML = '';
  EV.length = 0;
  setRec(false);
  newRun(save.mode, [r.spec], curLevel);
  G.run = r.run;
  resetHud();
}

// Duo : l'hôte lance la partie de la salle (le serveur la fait tourner), le partenaire attend
async function startDuoGame(lv) {
  const r = duo.room;
  if (!r || r.members.length < 2) return notice('Le duo se joue à deux : crée une salle ou rejoins-en une.', 'warn');
  if (!r.host) return notice('C’est l’hôte de la salle qui lance la partie.', 'warn');
  if (save.mode === 'career') {
    if (typeof lv === 'number') curLevel = lv;
    curLevel = clamp(curLevel || prog.career.max, 1, prog.career.max);
  }
  starting = true;
  const res = await startDuo(save.mode, save.mode === 'career' ? curLevel : 0);
  starting = false;
  if (!res.ok) notice(res.msg || 'Impossible de lancer la partie.');
}

export function openMenu() {
  setG(null);
  setP(null);
  setRec(false);
  $('#hud').hidden = true;
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
    gameOver: d => showOver({ ...d, run: G.run }),
  });
  $('#btn-pause').addEventListener('click', () => {
    Sfx.init();
    act('pause');
  });
  $('#btn-resume').addEventListener('click', () => act('resume'));
  $('#btn-mute-menu').addEventListener('click', toggleMute);
  $('#btn-mute-pause').addEventListener('click', toggleMute);
  $('#btn-quit').addEventListener('click', () => act('quit'));
  $('#btn-again').addEventListener('click', () => (duo.on ? openMenu() : startGame()));
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
