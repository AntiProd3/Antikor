// Contenu des écrans de montée de niveau et de boutique d'un joueur, sous forme de données simples.
// En solo, le jeu les met en forme (js/ui/cards.js) ; en duo, le serveur les calcule et les envoie au joueur.

import { WEAPONS } from '../data/weapons.js';
import { optInfo, priceOf, rerollCost, validOpt } from './options.js';
import { plName } from './player.js';
import { G, P, withP } from './state.js';
import { isBossWave, isFinal } from './waves.js';

export function levelData(pl) {
  return withP(pl, () => {
    if (pl.pend <= 0) return { wait: 1, level: G.level, rid: pl.rid };
    return { level: G.level - pl.pend + 1, more: pl.pend - 1, rid: pl.rid, cards: pl.curOpts.map(optInfo) };
  });
}

export function shopData(pl) {
  return withP(pl, () => {
    const nx = G.wave + 1;
    return {
      wave: G.wave,
      duo: G.players.length > 1,
      name: plName(P),
      coins: Math.floor(P.coins),
      offers: P.shop.offers.map(s => ({
        info: optInfo(s.o),
        price: priceOf(s.o),
        ok: validOpt(s.o),
        sold: s.sold,
        locked: s.locked,
      })),
      free: P.shop.free,
      rerollCost: rerollCost(P),
      ready: P.ready,
      next: { wave: nx, boss: isBossWave(nx), final: isFinal(nx) },
      weapons: P.weapons.map(w => ({
        id: w.id,
        lvl: w.lvl,
        evo: w.evo,
        r: w.r || 0,
        hasEvoItem: !!P.passives[WEAPONS[w.id].evoWith],
      })),
      slots: P.ts.slots,
      passives: Object.entries(P.passives),
      stats: [
        ['PV', `${Math.ceil(P.hp)} / ${P.maxHp}`],
        ['Dégâts', `+${Math.round((P.dmg - 1) * 100)}%`],
        ['Recharge', `-${Math.round((1 - P.cd) * 100)}%`],
        ['Critique', `${Math.round(P.crit * 100)}% · ×${P.critMul.toFixed(2)}`],
        ['Vitesse', `${Math.round(P.speed)}`],
        ['Zone', `+${Math.round((P.area - 1) * 100)}%`],
        ['Portée', `+${Math.round((P.range - 1) * 100)}%`],
        ['Projectiles', `+${P.proj}`],
        ['Armure', `-${Math.round((1 - P.armor) * 100)}%`],
        ['Régénération', `${P.regen.toFixed(1)} PV/s`],
        ['Collecte', `${Math.round(P.magnet)}`],
      ],
    };
  });
}
