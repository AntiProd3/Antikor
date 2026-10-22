// Sauvegarde locale (localStorage) : chargement, migration des anciennes versions, écriture.

import { WEAPONS } from './data/weapons.js';

export const SAVE_KEY = 'antikor-v1';

export const OLD_SAVE_KEY = 'neon-horde-v1'; // nom du jeu avant la v0.7 : la progression est reprise

// inv = armes possédées {u: identifiant unique, id: type d'arme, r: rareté 0-4} ; equip = u de l'arme de départ ; boxes = box non ouvertes
export function defaultSave() {
  return {
    cores: 0,
    talents: {},
    inv: [{ u: 1, id: 'blaster', r: 0 }],
    equip: 1,
    uid: 2,
    boxes: { std: 1, prem: 0 },
    career: { max: 1, stars: {} },
    best: {},
    mode: 'career',
    players: 'solo',
    muted: false,
    runs: 0,
    wins: 0,
    totalKills: 0,
  };
}

export let save = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || localStorage.getItem(OLD_SAVE_KEY));
    if (s && typeof s === 'object') {
      const o = Object.assign(defaultSave(), s);
      // sauvegarde d'avant la v0.4 : chaque arme débloquée devient un exemplaire commun
      if (!Array.isArray(s.inv) && Array.isArray(s.unlocked)) {
        o.inv = s.unlocked.map((id, k) => ({ u: k + 1, id, r: 0 }));
        o.uid = o.inv.length + 1;
        o.equip = (o.inv.find(x => x.id === s.start) || o.inv[0] || {}).u;
      }
      delete o.unlocked;
      delete o.start;
      return o;
    }
  } catch (e) {}
  return defaultSave();
})();

export function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) {}
}

// Nettoie la sauvegarde : armes inconnues retirées, au moins un Blaster, arme équipée valide
(() => {
  save.inv = (Array.isArray(save.inv) ? save.inv : [])
    .filter(x => x && WEAPONS[x.id] && x.r >= 0 && x.r <= 4)
    .map(x => ({ u: x.u | 0, id: x.id, r: x.r | 0 }));
  if (!save.inv.length) save.inv.push({ u: save.uid++, id: 'blaster', r: 0 });
  save.uid = Math.max(save.uid | 0, ...save.inv.map(x => x.u + 1));
  if (!save.inv.some(x => x.u === save.equip)) save.equip = save.inv[0].u;
  save.boxes = Object.assign({ std: 0, prem: 0 }, save.boxes);
  // v0.8 : Sprint et Marathon remplacés par la Carrière
  save.career = Object.assign({ max: 1, stars: {} }, save.career);
  if (save.mode !== 'career' && save.mode !== 'endless') save.mode = 'career';
  persist();
})();
