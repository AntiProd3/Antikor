// Butin au sol : gemmes, pièces, bonus, coffres et box.

import { BOXES } from '../data/loot.js';
import { nova } from './combat.js';
import { burst, ring, sfx, textFx, toast } from './fx.js';
import { hooks } from './hooks.js';
import { applyOpt, optLabel, rollOptions } from './options.js';
import { nearestPl, plName, xpFor } from './player.js';
import { G, setP, withP } from './state.js';
import { compact } from '../util.js';

export function updatePickups(dt) {
  const clear = G.state === 'clear';
  for (const k of G.pickups) {
    if (k.dead) continue;
    k.t += dt;
    const tp = nearestPl(k.x, k.y) || G.players[0];
    const dx = tp.x - k.x,
      dy = tp.y - k.y,
      d = Math.hypot(dx, dy) || 1;
    if (k.vx || k.vy) {
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      const f = Math.exp(-5 * dt);
      k.vx *= f;
      k.vy *= f;
      if (Math.abs(k.vx) + Math.abs(k.vy) < 4) k.vx = k.vy = 0;
    }
    if (!k.mag && (clear || d < tp.magnet * (k.type === 'gem' || k.type === 'coin' ? 1 : 0.55))) k.mag = true;
    if (k.mag && G.state !== 'dying' && !tp.down) {
      k.sp = Math.min(clear ? 1400 : 1100, (k.sp || 40) + (clear ? 2600 : 1700) * dt);
      k.x += (dx / d) * k.sp * dt;
      k.y += (dy / d) * k.sp * dt;
      if (d < tp.r + 8) collect(tp, k);
    }
  }
  compact(G.pickups);
  const gems = G.pickups.filter(k => k.type === 'gem' && !k.mag);
  if (gems.length > 380) {
    let acc = null;
    for (const g of gems) {
      if (G.players.some(pl => Math.hypot(g.x - pl.x, g.y - pl.y) < 700)) continue;
      if (!acc) {
        acc = g;
        continue;
      }
      acc.v += g.v;
      g.dead = true;
    }
    compact(G.pickups);
  }
}

export function collect(pl, k) {
  k.dead = true;
  setP(pl);
  switch (k.type) {
    case 'gem': {
      G.xp += k.v;
      G.gemCombo++;
      G.gemComboT = 0.45;
      sfx('gem', G.gemCombo);
      while (G.xp >= G.xpNext) {
        G.xp -= G.xpNext;
        G.level++;
        G.xpNext = xpFor(G.level);
        G.pendingLevels++;
        for (const p of G.players) {
          ring(p.x, p.y, 10, 120, 0.5, '#62ff9a');
          burst(p.x, p.y, '#62ff9a', 20, 300, 3);
        }
      }
      break;
    }
    case 'coin': {
      const v = k.v * pl.gold;
      pl.coins += v;
      G.coinsEarned += v;
      hooks.say(pl, 'coin');
      break;
    }
    case 'heart': {
      pl.hp = Math.min(pl.maxHp, pl.hp + 30);
      textFx(pl.x, pl.y - 24, '+30', '#62ff9a');
      sfx('heal');
      burst(pl.x, pl.y, '#62ff9a', 12, 200, 3);
      break;
    }
    case 'magnet': {
      for (const q of G.pickups) if (q.type === 'gem' || q.type === 'coin') q.mag = true;
      ring(pl.x, pl.y, 10, 300, 0.5, '#3ea8ff');
      sfx('heal');
      toast('AIMANT', 'Tout le butin arrive.', '#3ea8ff');
      break;
    }
    case 'bomb': {
      nova(pl, false);
      toast('NOVA', 'L’écran est nettoyé.', '#ffffff');
      break;
    }
    case 'chest': {
      openChest(pl);
      break;
    }
    case 'box': {
      const k2 = k.v === 2 ? 'prem' : 'std';
      G.boxes[k2]++;
      toast(
        'BOX !',
        BOXES[k2].name + (G.players.length > 1 ? ' pour chaque joueur' : '') + ' · à ouvrir au menu',
        '#ff3d8b',
      );
      burst(pl.x, pl.y, BOXES[k2].col, 30, 380, 4);
      ring(pl.x, pl.y, 10, 180, 0.6, BOXES[k2].col);
      sfx('chest');
      break;
    }
  }
  setP(G.players[0]);
}

export function openChest(pl) {
  const many = Math.random() < 0.18 * pl.luck;
  const names = withP(pl, () => {
    const opts = rollOptions(many ? 3 : 1, 'chest');
    return opts.map(o => {
      const n = optLabel(o);
      applyOpt(o);
      return n;
    });
  });
  const t = many ? 'COFFRE ×3' : 'COFFRE';
  toast(G.players.length > 1 ? t + ' · ' + plName(pl) : t, names.join(' · '), '#ffd23e');
  burst(pl.x, pl.y, '#ffd23e', 30, 380, 4);
  ring(pl.x, pl.y, 10, 160, 0.5, '#ffd23e');
  G.hitstop = Math.max(G.hitstop, 0.05);
  sfx('chest');
}
