// Déroulement de la partie : actions des joueurs, choix de niveau, boutique, pause, fin.

import { shockwave } from './combat.js';
import { sfx, textFx } from './fx.js';
import { hooks } from './hooks.js';
import { applyOpt, candidates, optLabel, priceOf, rerollCost, rollOptions, rollShop, validOpt } from './options.js';
import { G, P, withP } from './state.js';
import { startWave } from './waves.js';
import { clamp } from '../util.js';

export function doAct(pl, a, i) {
  if (!G || !pl) return;
  switch (a) {
    case 'pick':
      pickFor(pl, i);
      break;
    case 'buy':
      buyFor(pl, i);
      break;
    case 'reroll':
      rerollFor(pl);
      break;
    case 'lock':
      lockFor(pl, i);
      break;
    case 'ready':
      readyFor(pl);
      break;
    case 'pause':
      pause();
      break;
    case 'resume':
      resume();
      break;
    case 'quit':
      if (G.state !== 'over') {
        hooks.show(null);
        gameOver(false, true);
      }
      break;
  }
}

export function openLevel() {
  G.state = 'level';
  for (const pl of G.players) {
    pl.pend += G.pendingLevels;
    autoLevels(pl);
    if (pl.pend > 0) rollLevel(pl);
  }
  G.pendingLevels = 0;
  // Personne n'a de carte à choisir : pas d'écran, la partie continue
  if (!G.players.some(p => p.pend > 0)) {
    if (G.afterLevel === 'shop') openShop();
    else G.state = 'play';
    return;
  }
  hooks.clearInput();
  sfx('level');
  hooks.refreshViews();
}

// PV regagnés à une montée de niveau quand tout est déjà au maximum
export function maxedHeal() {
  return 2 * G.level;
}

// Tout est au maximum (armes, équipements, évolutions) : pas de choix, le joueur regagne des PV
function autoLevels(pl) {
  let healed = 0;
  while (pl.pend > 0 && !withP(pl, () => candidates('level').length)) {
    pl.hp = Math.min(pl.maxHp, pl.hp + maxedHeal());
    healed += maxedHeal();
    pl.pend--;
  }
  if (!healed) return;
  textFx(pl.x, pl.y - 24, '+' + healed, '#62ff9a');
  hooks.say(pl, 'heal');
  hooks.toastFor(pl, 'NIVEAU ' + G.level, `Tout est au maximum : +${healed} PV`, '#62ff9a');
}

export function rollLevel(pl) {
  withP(pl, () => {
    pl.curOpts = rollOptions(pl.choices, 'level');
  });
  pl.rid++;
}

export function pickFor(pl, i) {
  if (!G || G.state !== 'level' || pl.pend <= 0) return;
  const o = pl.curOpts && pl.curOpts[i];
  if (!o) return;
  const name = withP(pl, () => {
    const n = optLabel(o);
    applyOpt(o);
    return n;
  });
  pl.pend--;
  hooks.say(pl, 'buy');
  autoLevels(pl);
  if (pl.pend > 0) rollLevel(pl);
  else if (o.kind !== 'evo') hooks.toastFor(pl, 'PRIS', name, '#62ff9a');
  if (G.players.some(p => p.pend > 0)) {
    hooks.refreshViews();
    return;
  }
  levelDone();
}

export function levelDone() {
  hooks.show(null);
  if (G.afterLevel === 'shop') openShop();
  else {
    G.state = 'play';
    for (const p of G.players) {
      if (!p.down) shockwave(p);
      p.inv = Math.max(p.inv, 0.8);
    }
  }
}

export function openShop() {
  G.state = 'shop';
  hooks.clearInput();
  for (const pl of G.players) {
    if (pl.down) {
      pl.down = false;
      pl.rev = 0;
      pl.inv = 1;
    }
    const heal = Math.round(pl.maxHp * 0.3);
    pl.hp = Math.min(pl.maxHp, pl.hp + heal);
    pl.shop.rerolls = 0;
    pl.shop.bought = [];
    pl.shop.free = pl.freeRerolls;
    pl.ready = false;
    withP(pl, rollShop);
  }
  hooks.refreshViews();
}

export function buyFor(pl, idx) {
  if (G.state !== 'shop' || pl.ready) return;
  const s = pl.shop.offers[idx];
  if (!s || s.sold) return;
  const ok = withP(pl, () => {
    const pr = priceOf(s.o);
    if (!validOpt(s.o) || pl.coins < pr) return false;
    pl.coins -= pr;
    applyOpt(s.o);
    return true;
  });
  if (!ok) {
    hooks.say(pl, 'deny', idx);
    return;
  }
  s.sold = true;
  s.locked = false;
  pl.shop.bought.push(s.o.id);
  hooks.say(pl, 'buy');
  hooks.refreshViews(pl);
}

export function rerollFor(pl) {
  if (G.state !== 'shop' || pl.ready) return;
  const sh = pl.shop;
  if (sh.free > 0) sh.free--;
  else {
    const c = rerollCost(pl);
    if (pl.coins < c) {
      hooks.say(pl, 'deny');
      return;
    }
    pl.coins -= c;
    sh.rerolls++;
  }
  sh.offers = sh.offers.filter(s => s.locked && !s.sold);
  withP(pl, rollShop);
  hooks.say(pl, 'click');
  hooks.refreshViews(pl);
}

export function lockFor(pl, idx) {
  if (G.state !== 'shop') return;
  const s = pl.shop.offers[idx];
  if (!s || s.sold) return;
  s.locked = !s.locked;
  hooks.say(pl, 'click');
  hooks.refreshViews(pl);
}

export function readyFor(pl) {
  if (G.state !== 'shop') return;
  pl.ready = true;
  if (G.players.every(p => p.ready)) nextWave();
  else hooks.refreshViews(pl);
}

export function nextWave() {
  if (G.state !== 'shop') return;
  hooks.show(null);
  for (const p of G.players) p.inv = 1.2;
  G.ebullets.length = 0;
  startWave(G.wave + 1);
}

export function gameOver(win, quit) {
  G.state = 'over';
  hooks.clearInput();
  const d = {
    win,
    mode: G.mode,
    cl: G.M.level || 0,
    hp: P ? clamp(P.hp / P.maxHp, 0, 1) : 0,
    wave: G.wave,
    kills: G.kills,
    bossKills: G.bossKills,
    time: G.time,
    maxCombo: G.maxCombo,
    dmg: Math.round(G.dmgDone),
    level: G.level,
    coins: Math.floor(G.coinsEarned),
    duo: G.players.length > 1,
    boxes: G.boxes,
    quit: !!quit,
  };
  hooks.gameOver(d);
}

export function pause() {
  if (!G || G.state !== 'play') return;
  G.state = 'pause';
  hooks.clearInput(true);
  hooks.show('scr-pause');
}

export function resume() {
  if (!G || G.state !== 'pause') return;
  hooks.show(null);
  G.state = 'play';
  for (const p of G.players) p.inv = Math.max(p.inv, 0.4);
}
