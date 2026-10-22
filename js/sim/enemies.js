// Déplacement des ennemis, séparation, brûlure et contact.

import { bossAI } from './boss.js';
import { addEB, dmgEnemy, hurtPlayer } from './combat.js';
import { burst, enemyFx, sfx } from './fx.js';
import { CELL, gk, grid } from './grid.js';
import { nearestPl, owner } from './player.js';
import { spawnPos } from './spawn.js';
import { G, setP, view } from './state.js';
import { TAU, compact } from '../util.js';

export function updateEnemies(dt) {
  const E = G.enemies;
  const farR = Math.max(view.hw, view.hh) * 2.3 + 200;
  for (let i = 0; i < E.length; i++) {
    const e = E[i];
    if (e.dead) continue;
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    const tp = nearestPl(e.x, e.y) || G.players[0];
    let dx = tp.x - e.x,
      dy = tp.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    if (G.state === 'dying') {
      dx *= 0.2;
      dy *= 0.2;
    }
    e.kx -= e.kx * Math.min(1, dt * 7);
    e.ky -= e.ky * Math.min(1, dt * 7);
    if (e.type === 'boss') {
      if (e.stun > 0) e.stun -= dt;
      bossAI(e, dt, dx, dy);
    } else {
      let sp = e.spd;
      if (e.slowT > 0) {
        e.slowT -= dt;
        sp *= 1 - e.slowV;
      } else e.slowV = 0;
      if (e.stun > 0) {
        e.stun -= dt;
        sp = 0;
      }
      let mx = dx,
        my = dy;
      if (e.type === 'spitter') {
        if (d < 230) {
          mx = -dx * 0.5 - dy * 0.85;
          my = -dy * 0.5 + dx * 0.85;
        } else if (d < 300) {
          mx = -dy;
          my = dx;
        }
        e.shootT -= dt;
        if (e.shootT <= 0 && d < 440 && G.state === 'play' && e.stun <= 0) {
          e.shootT = 2.6;
          addEB({
            x: e.x + dx * e.r,
            y: e.y + dy * e.r,
            vx: dx * 230,
            vy: dy * 230,
            r: 6,
            dmg: e.dmg,
            life: 4,
            col: '#f2ff4a',
          });
          sfx('spit');
        }
      } else if (e.type === 'bomber') {
        if (e.fuse > 0) {
          e.fuse -= dt;
          sp = 0;
          if (e.fuse <= 0) {
            e.dead = true;
            G.booms.push({ x: e.x, y: e.y, t: 0, R: 78, dmg: 30 + 10 * G.wave, hurt: e.dmg });
            burst(e.x, e.y, e.col, 10, 200, 3);
          }
        } else if (d < 62 && G.state === 'play') e.fuse = 0.6;
      }
      e.x += (mx * sp + e.kx) * dt;
      e.y += (my * sp + e.ky) * dt;
      e.ang += (((Math.atan2(dy, dx) - e.ang + Math.PI * 3) % TAU) - Math.PI) * Math.min(1, dt * 8);
    }
    // separation
    const cx = Math.floor(e.x / CELL),
      cy = Math.floor(e.y / CELL);
    for (let ox = -1; ox <= 1; ox++)
      for (let oy = -1; oy <= 1; oy++) {
        const a = grid.get(gk(cx + ox, cy + oy));
        if (!a) continue;
        for (let j = 0; j < a.length; j++) {
          const o = a[j];
          if (o === e || o.dead) continue;
          const sx = e.x - o.x,
            sy = e.y - o.y,
            rr = (e.r + o.r) * 0.9,
            dd = sx * sx + sy * sy;
          if (dd < rr * rr && dd > 0.01) {
            const l = Math.sqrt(dd);
            const push = ((rr - l) / l) * (e.type === 'boss' ? 0.05 : o.type === 'boss' ? 0.9 : 0.35);
            e.x += sx * push;
            e.y += sy * push;
          }
        }
      }
    // brûlure / gel
    if (e.frozen > 0) e.frozen -= dt;
    if (e.burnT > 0) {
      e.burnT -= dt;
      e.burnK -= dt;
      enemyFx(e, dt);
      if (e.burnK <= 0) {
        e.burnK = 0.3;
        setP(owner(e.burnO));
        dmgEnemy(e, e.burnD, { raw: true, quiet: true });
        setP(G.players[0]);
        if (e.dead) continue;
      }
    }
    // contact
    if (G.state === 'play')
      for (const pl of G.players) {
        if (pl.down) continue;
        if (Math.hypot(pl.x - e.x, pl.y - e.y) < e.r + pl.r - 2) hurtPlayer(pl, e.dmg);
      }
    if (d > farR && e.type !== 'boss') {
      const [x, y] = spawnPos();
      e.x = x;
      e.y = y;
    }
  }
  compact(E);
}
