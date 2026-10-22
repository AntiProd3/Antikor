// Point d’entrée : initialisation et boucle principale.

import { DUO_ENABLED, VERSION } from './config.js';
import { initInput, inputVec, keys } from './input.js';
import { NET, joinGame } from './net/net.js';
import { guestUpdate, netTick } from './net/sync.js';
import { resize } from './render/canvas.js';
import { initFloor } from './render/floor.js';
import { initDemo, render, updateDemo } from './render/render.js';
import { initSprites } from './render/sprites.js';
import { persist, save } from './save.js';
import { REC } from './sim/fx.js';
import { G, ME, P, settings } from './sim/state.js';
import { update } from './sim/update.js';
import { initBoxes } from './ui/boxes.js';
import { chooseLevel, initCards } from './ui/cards.js';
import { $, show } from './ui/dom.js';
import { initDuo } from './ui/duo.js';
import { act, initGame, startGame } from './ui/game.js';
import { initHud, updateHUD } from './ui/hud.js';
import { initInventory } from './ui/inventory.js';
import { initKeyboard } from './ui/keyboard.js';
import { initLab } from './ui/lab.js';
import { initMap } from './ui/map.js';
import { initMenu, renderMenu } from './ui/menu.js';
import { initTooltips } from './ui/tooltips.js';

// Une étape de simulation (aussi utilisée par les tests) : la commande du joueur local, puis la partie avance.
function stepGame(rdt) {
  if (G && (G.state === 'play' || G.state === 'clear' || G.state === 'dying')) {
    G.players[ME].in = inputVec();
    if (G.hitstop > 0) {
      G.hitstop -= rdt;
    } else {
      let dt = rdt;
      if (G.slowT > 0) {
        G.slowT -= rdt;
        dt *= 0.3;
      }
      update(dt, rdt);
    }
  }
}

let last = performance.now();

function frame(now) {
  let rdt = Math.min(0.05, (now - last) / 1000);
  last = now;
  try {
    if (G && G.guest) guestUpdate(rdt, now);
    else if (G) stepGame(rdt);
    else updateDemo(rdt);
    if (G && !G.guest && REC) netTick(rdt);
    render(rdt);
    updateHUD();
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(frame);
}

settings.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
initSprites();
initGame();
initMenu();
initDuo();
initLab();
initInventory();
initBoxes();
initMap();
initCards();
initHud();
initKeyboard();
initInput();
initTooltips();
addEventListener('resize', resize);
resize();
initFloor();
initDemo();

// Lien d'invitation : ?join=CODE
{
  const q = new URLSearchParams(location.search);
  const j = (q.get('join') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!DUO_ENABLED) {
    save.players = 'solo';
    if (j) {
      q.delete('join');
      const rest = q.toString();
      history.replaceState(null, '', location.pathname + (rest ? '?' + rest : ''));
    }
  } else if (j) {
    save.players = 'duo';
    persist();
    q.delete('join');
    const rest = q.toString();
    history.replaceState(null, '', location.pathname + (rest ? '?' + rest : ''));
    joinGame(j);
  }
}
$('#ver').textContent = 'v' + VERSION;
renderMenu();
show('scr-menu');
requestAnimationFrame(frame);

// Débogage et tests : window.__AK depuis la console du navigateur
window.__AK = {
  get G() {
    return G;
  },
  get P() {
    return P;
  },
  get NET() {
    return NET;
  },
  startGame,
  act,
  chooseLevel,
  keys,
  tick: stepGame,
};
