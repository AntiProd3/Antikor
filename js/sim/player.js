// Joueurs : création, armes et statistiques.

import { RARITY } from '../data/loot.js';
import { G, P, withP } from './state.js';
import { pick } from '../util.js';

export const PCOLS = ['#3ef2ff', '#ff6ad5'];

// XP nécessaire pour passer le niveau l (+15 % depuis la v0.8.3 : un peu moins de montées de niveau)
export function xpFor(l) {
  return Math.round((5 + l * 5 + l * l * 0.35) * 1.15);
}

// spec = {ts: talents, owned: {arme: meilleure rareté possédée}, start: {id, r} arme équipée}
export function mkPlayer(i, spec) {
  const ts = spec.ts;
  const p = {
    i,
    col: PCOLS[i] || PCOLS[0],
    x: spec.x || 0,
    y: 0,
    vx: 0,
    vy: 0,
    r: 14,
    hp: 100,
    maxHp: 100,
    weapons: [],
    passives: {},
    aim: 0,
    aimT: 0,
    aimHold: 0,
    inv: 0,
    moving: false,
    step: 0,
    ts,
    owned: { ...spec.owned },
    coins: ts.startGold,
    revive: ts.revive,
    choices: 3 + ts.choice,
    freeRerolls: ts.freeRerolls,
    shop: { offers: [], rerolls: 0, free: 0, bought: [] },
    pend: 0,
    rid: 0,
    curOpts: null,
    ready: false,
    down: false,
    rev: 0,
  };
  withP(p, () => {
    addWeapon(spec.start.id, spec.start.r);
    recalc();
  });
  p.hp = p.maxHp;
  return p;
}

export function getW(id) {
  return P.weapons.find(w => w.id === id);
}

export function addWeapon(id, r = P.owned[id] || 0) {
  P.weapons.push({ id, r, lvl: RARITY[r].lvl, evo: false, cd: 0.3 });
}

export function recalc() {
  const L = id => P.passives[id] || 0;
  const TS = P.ts;
  P.maxHp = 100 + TS.hp + 20 * L('heart');
  P.speed = 205 * (1 + 0.1 * L('boots') + TS.spd);
  P.dmg = 1 + 0.1 * L('powder') + TS.dmg;
  P.cd = Math.pow(0.92, L('trigger'));
  P.area = 1 + 0.1 * L('amp');
  P.dur = 1 + 0.12 * L('hourglass');
  P.proj = L('dup');
  P.crit = 0.05 + 0.06 * L('lens');
  P.critMul = 2 + 0.15 * L('lens');
  P.armor = 1 - Math.min(0.6, 0.07 * L('armor') + TS.armor);
  P.magnet = 85 * (1 + 0.3 * L('magnet') + TS.mag);
  P.regen = 0.6 * L('regen');
  P.luck = 1 + 0.12 * L('clover');
  P.gold = (1 + TS.gold) * (1 + 0.08 * L('clover'));
  P.speed *= 1 + 0.05 * L('servo');
  P.cd *= Math.pow(0.95, L('servo'));
  P.range = 1 + 0.12 * L('fuel');
  P.bossDmg = 1 + 0.1 * L('chip');
  P.hp = Math.min(P.hp, P.maxHp);
}

export function alive() {
  return G.players.filter(p => !p.down);
}

export function nearestPl(x, y) {
  let best = null,
    bd = Infinity;
  for (const p of G.players) {
    if (p.down) continue;
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  return best;
}

export function focusPl() {
  const a = alive();
  return a.length ? pick(a) : G.players[0];
}

export function plName(pl) {
  return 'J' + (pl.i + 1);
}

export function owner(o) {
  return G.players[o] || G.players[0];
}
