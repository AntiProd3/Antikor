// Projectiles des joueurs et des ennemis, zones au sol et mines.

import { dmgEnemy, explode, hurtPlayer, rocketBoom, shot } from './combat.js';
import { addShake, burst, rocketTrail, sfx, spark, zoneFx } from './fx.js';
import { forNear, nearest } from './grid.js';
import { owner } from './player.js';
import { G, P, setP, setWM } from './state.js';
import { TAU, clamp, compact, lerp, rand } from '../util.js';

export function updateBullets(dt) {
  const B = G.bullets;
  for (let i = 0; i < B.length; i++) {
    const b = B[i];
    if (b.dead) continue;
    setP(owner(b.o));
    setWM(b.wm || 1);
    switch (b.k) {
      case 'shot': {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (b.life <= 0) {
          b.dead = true;
          break;
        }
        forNear(b.x, b.y, b.r, e => {
          if (b.hit.includes(e.id)) return;
          b.hit.push(e.id);
          dmgEnemy(e, b.dmg, { kb: b.kb, kx: b.dx, ky: b.dy });
          spark(b.x, b.y, b.col, 3);
          if (--b.pierce < 0) {
            b.dead = true;
            return true;
          }
        });
        break;
      }
      case 'disc': {
        b.spin += dt * 18;
        b.life -= dt;
        if (b.out) {
          const sp = b.spd * (1 - 0.75 * (b.d / b.max));
          b.x += Math.cos(b.a) * sp * dt;
          b.y += Math.sin(b.a) * sp * dt;
          b.d += sp * dt;
          if (b.d >= b.max * 0.97) b.out = false;
        } else {
          const dx = P.x - b.x,
            dy = P.y - b.y,
            d = Math.hypot(dx, dy) || 1;
          b.ret = (b.ret || 150) + 1000 * dt;
          const sp = Math.min(b.ret, 950);
          b.x += (dx / d) * sp * dt;
          b.y += (dy / d) * sp * dt;
          if (d < 22 || b.life <= 0) {
            b.dead = true;
            break;
          }
        }
        forNear(b.x, b.y, b.r, e => {
          if ((b.hc[e.id] || 0) <= G.t) {
            b.hc[e.id] = G.t + 0.28;
            dmgEnemy(e, b.dmg, { kb: 130, sx: b.x, sy: b.y });
            spark(b.x, b.y, b.col, 3);
          }
        });
        break;
      }
      case 'lob': {
        b.t += dt;
        const f = Math.min(1, b.t / b.T);
        b.x = lerp(b.x0, b.x1, f);
        b.y = lerp(b.y0, b.y1, f);
        b.h = Math.sin(f * Math.PI) * 70;
        b.rot += dt * 12;
        if (f >= 1) {
          b.dead = true;
          G.zones.push({
            o: b.o,
            wm: b.wm,
            x: b.x1,
            y: b.y1,
            R: b.R,
            dmg: b.dmg,
            life: b.dur,
            max: b.dur,
            tick: 0,
            evo: b.evo,
          });
          burst(b.x1, b.y1, '#ff7a2a', 14, 240, 4);
          burst(b.x1, b.y1, '#ffe14a', 6, 160, 3);
          addShake(2);
          sfx('fire');
        }
        break;
      }
      case 'rocket': {
        b.life -= dt;
        if (b.life <= 0) {
          rocketBoom(b);
          break;
        }
        if (!b.tg || b.tg.dead) b.tg = nearest(b.x, b.y, 520);
        if (b.tg) {
          const ta = Math.atan2(b.tg.y - b.y, b.tg.x - b.x);
          const da = ((ta - b.a + Math.PI * 3) % TAU) - Math.PI;
          b.a += clamp(da, -7 * dt, 7 * dt);
        }
        b.spd = Math.min(b.small ? 620 : 560, b.spd + 950 * dt);
        b.x += Math.cos(b.a) * b.spd * dt;
        b.y += Math.sin(b.a) * b.spd * dt;
        rocketTrail(b);
        let hit = false;
        forNear(b.x, b.y, 6, () => {
          hit = true;
          return true;
        });
        if (hit) rocketBoom(b);
        break;
      }
    }
  }
  setP(G.players[0]);
  setWM(1);
  compact(B);
}

export function updateEBullets(dt) {
  for (const b of G.ebullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0) {
      b.dead = true;
      continue;
    }
    if (G.state === 'play')
      for (const pl of G.players) {
        if (pl.down) continue;
        if (Math.hypot(pl.x - b.x, pl.y - b.y) < pl.r + b.r - 2) {
          b.dead = true;
          hurtPlayer(pl, b.dmg);
          burst(b.x, b.y, b.col, 6, 150, 2);
          break;
        }
      }
  }
  compact(G.ebullets);
}

export function updateZones(dt) {
  for (const z of G.zones) {
    z.life -= dt;
    setP(owner(z.o));
    setWM(z.wm || 1);
    if (z.k === 'hole') {
      // trou noir : aspire, blesse, puis explose
      forNear(z.x, z.y, z.R, e => {
        if (e.type === 'boss') return;
        const dx = z.x - e.x,
          dy = z.y - e.y,
          d = Math.hypot(dx, dy) || 1;
        const f = Math.min(d, (z.evo ? 260 : 190) * dt);
        e.x += (dx / d) * f;
        e.y += (dy / d) * f;
      });
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = 0.3;
        forNear(z.x, z.y, z.R * 0.6, e => dmgEnemy(e, z.dmg, { quiet: true }));
      }
      if (z.life <= 0) {
        z.dead = true;
        explode(z.x, z.y, z.R * 0.9, z.boom, { kb: 300, col: '#9d7bff' });
      }
      zoneFx(z, dt);
      continue;
    }
    if (z.life <= 0) {
      z.dead = true;
      continue;
    }
    z.tick -= dt;
    if (z.tick <= 0) {
      z.tick = 0.25;
      forNear(z.x, z.y, z.R, e => dmgEnemy(e, z.dmg, { quiet: true, slow: z.evo ? 0.3 : 0 }));
    }
    zoneFx(z, dt);
  }
  compact(G.zones);
  for (const m of G.mines) {
    m.t += dt;
    m.arm -= dt;
    m.life -= dt;
    if (m.life <= 0) {
      m.dead = true;
      continue;
    }
    if (m.arm <= 0 && G.state === 'play') {
      let trig = false;
      forNear(m.x, m.y, 24, () => {
        trig = true;
        return true;
      });
      if (trig) {
        m.dead = true;
        setP(owner(m.o));
        setWM(m.wm || 1);
        explode(m.x, m.y, m.R, m.dmg, { kb: 300, col: m.evo ? '#ffd23e' : '#ffe14a' });
        if (m.evo)
          for (let k = 0; k < 8; k++) shot(m.x, m.y, (k / 8) * TAU + rand(0.2), 520, 30, 1, 0.6, '#ffd23e', 4, 120);
      }
    }
  }
  setP(G.players[0]);
  setWM(1);
  compact(G.mines);
}
