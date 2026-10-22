// Méta-progression lue dans la sauvegarde : talents achetés, armes possédées, joueur local.

import { worldOf } from './data/career.js';
import { save } from './save.js';

export function T(id) {
  return save.talents[id] || 0;
}

// Arsenal : le niveau n s'achète une fois le monde n atteint en carrière (0 = pas de restriction)
export function talentGate(t, l) {
  if (t.id !== 'slot' || l >= t.max) return 0;
  const need = l + 1;
  return worldOf(save.career.max) + 1 >= need ? 0 : need;
}

export function talentCost(t, l) {
  return t.costs ? t.costs[l] : t.cost * (l + 1);
}

export function talentStats() {
  return {
    slots: 1 + T('slot'),
    hp: 10 * T('hp'),
    dmg: 0.05 * T('dmg'),
    spd: 0.04 * T('spd'),
    mag: 0.15 * T('mag'),
    gold: 0.1 * T('gold'),
    startGold: 20 * T('start'),
    armor: 0.04 * T('armor'),
    freeRerolls: T('reroll'),
    choice: T('choice'),
    revive: T('revive'),
  };
}

// Spécification du joueur local : talents, armes possédées (meilleure rareté) et arme équipée
export function ownedMap() {
  const o = {};
  for (const it of save.inv) o[it.id] = Math.max(o[it.id] ?? -1, it.r);
  return o;
}

export function equipped() {
  return save.inv.find(x => x.u === save.equip) || save.inv[0];
}

export function mySpec() {
  const it = equipped();
  return { ts: talentStats(), owned: ownedMap(), start: { id: it.id, r: it.r } };
}
