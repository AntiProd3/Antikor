// Comportement des armes : appelé à chaque image pour chaque arme du joueur courant P.
// Les statistiques et les textes sont dans js/data/weapons.js (accessibles ici par this).

import { WEAPONS } from '../data/weapons.js';
import { addB, aimAt, burnE, dmgEnemy, railgun, shot } from './combat.js';
import { addShake, fxPush, muzzle, muzzleAt, ring, sfx, spark } from './fx.js';
import { forNear, nearest } from './grid.js';
import { G, P, WM } from './state.js';
import { TAU, pick, rand, segDist } from '../util.js';

export const BEHAVIOR = {
  blaster(w, dt) {
    const s = this.stats(w.lvl);
    w.cd -= dt;
    if (w.cd > 0) return;
    const t = nearest(P.x, P.y, 580);
    if (!t) {
      w.cd = 0.08;
      return;
    }
    const a = Math.atan2(t.y - P.y, t.x - P.x);
    aimAt(a);
    if (w.evo) {
      w.cd = 0.8 * P.cd;
      const n = 1 + P.proj;
      for (let i = 0; i < n; i++) railgun(a + (i - (n - 1) / 2) * 0.16, 55 + s.dmg * 2.2);
      sfx('rail');
      return;
    }
    w.cd = s.cd * P.cd;
    const n = s.n + P.proj;
    for (let i = 0; i < n; i++)
      shot(P.x, P.y, a + (i - (n - 1) / 2) * 0.12, 780, s.dmg, s.pierce, 0.85, this.col, 5, 90);
    muzzle(a, this.col);
    sfx('shoot');
  },
  shotgun(w, dt) {
    const s = this.stats(w.lvl);
    w.cd -= dt;
    if (w.cd > 0) return;
    const t = nearest(P.x, P.y, 330);
    if (!t) {
      w.cd = 0.08;
      return;
    }
    const a = Math.atan2(t.y - P.y, t.x - P.x);
    aimAt(a);
    const evo = w.evo;
    const n = (evo ? 14 : s.n) + 2 * P.proj;
    const sp = evo ? 0.75 : 0.55;
    const col = evo ? '#ff6a2a' : this.col;
    for (let i = 0; i < n; i++) {
      const aa = a + (n > 1 ? (i / (n - 1) - 0.5) * 2 * sp : 0) + rand(-0.05, 0.05);
      shot(
        P.x,
        P.y,
        aa,
        rand(620, 780),
        s.dmg * (evo ? 1.6 : 1),
        evo ? 2 : 0,
        evo ? 0.42 : 0.34,
        col,
        evo ? 5 : 4,
        evo ? 270 : 200,
      );
    }
    w.cd = (evo ? 0.75 : s.cd) * P.cd;
    muzzle(a, col, 9);
    sfx('blast');
    addShake(2);
  },
  drones(w, dt) {
    const s = this.stats(w.lvl);
    const evo = w.evo;
    const n = (evo ? 7 : s.n) + P.proj;
    const R = (evo ? 102 : 72) * P.area;
    const rot = evo ? 4.2 : s.rot;
    const dmg = evo ? 32 : s.dmg;
    const br = (evo ? 15 : 11) * Math.sqrt(P.area);
    w.ang = (w.ang || 0) + rot * dt;
    w.n = n;
    w.rot = rot;
    w.R = R;
    w.br = br;
    for (let i = 0; i < n; i++) {
      const a = w.ang + (i * TAU) / n;
      const x = P.x + Math.cos(a) * R,
        y = P.y + Math.sin(a) * R;
      forNear(x, y, br, e => {
        if ((e.hc.dr || 0) <= G.t) {
          e.hc.dr = G.t + 0.38;
          dmgEnemy(e, dmg, { kb: 150, sx: P.x, sy: P.y });
          spark(x, y, evo ? '#ffd23e' : this.col, 3);
        }
      });
    }
  },
  arc(w, dt) {
    const s = this.stats(w.lvl);
    w.cd -= dt;
    if (w.cd > 0) return;
    const evo = w.evo;
    const cand = [];
    forNear(P.x, P.y, 400, e => {
      cand.push(e);
    });
    if (!cand.length) {
      w.cd = 0.1;
      return;
    }
    const src = evo ? 3 : 1;
    const chains = (evo ? 8 : s.ch) + P.proj;
    const dmg = evo ? 44 : s.dmg;
    const hit = new Set();
    const col = evo ? '#fff1a8' : this.col;
    for (let k = 0; k < src; k++) {
      let cur = null;
      for (let tr = 0; tr < 8; tr++) {
        const c = pick(cand);
        if (!hit.has(c)) {
          cur = c;
          break;
        }
      }
      if (!cur) break;
      const pts = [P.x, P.y];
      for (let j = 0; j <= chains && cur; j++) {
        hit.add(cur);
        const cx = cur.x,
          cy = cur.y;
        pts.push(cx, cy);
        dmgEnemy(cur, dmg, { stun: evo ? 0.5 : 0.12 });
        spark(cx, cy, col, 4);
        let best = null,
          bd = 1e9;
        forNear(cx, cy, 165, e => {
          if (hit.has(e)) return;
          const d = (e.x - cx) ** 2 + (e.y - cy) ** 2;
          if (d < bd) {
            bd = d;
            best = e;
          }
        });
        cur = best;
      }
      fxPush({ k: 'bolt', pts: pts.map(Math.round), life: 0.17, max: 0.17, col });
    }
    w.cd = (evo ? 0.7 : s.cd) * P.cd;
    sfx('zap');
  },
  disc(w, dt) {
    const s = this.stats(w.lvl);
    w.cd -= dt;
    if (w.cd > 0) return;
    const evo = w.evo;
    const t = nearest(P.x, P.y, 480);
    const base = t ? Math.atan2(t.y - P.y, t.x - P.x) : rand(TAU);
    const n = (evo ? 4 : s.n) + P.proj;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * (evo ? 0.9 : 0.55);
      addB({
        k: 'disc',
        x: P.x,
        y: P.y,
        a,
        out: true,
        d: 0,
        max: (evo ? 360 : 290) * Math.sqrt(P.area),
        spd: 620,
        r: (evo ? 28 : 13) * P.area,
        dmg: evo ? 55 : s.dmg,
        hc: {},
        spin: 0,
        col: evo ? '#ffd23e' : this.col,
        life: 6,
      });
    }
    w.cd = (evo ? 1.3 : s.cd) * P.cd;
    sfx('throw');
  },
  molotov(w, dt) {
    const s = this.stats(w.lvl);
    w.cd -= dt;
    if (w.cd > 0) return;
    const evo = w.evo;
    const n = (evo ? 4 : s.n) + P.proj;
    const cand = [];
    forNear(P.x, P.y, 420, e => {
      cand.push(e);
    });
    for (let i = 0; i < n; i++) {
      let tx, ty;
      if (cand.length) {
        const c = pick(cand);
        tx = c.x + rand(-20, 20);
        ty = c.y + rand(-20, 20);
      } else {
        const a = rand(TAU),
          d = rand(90, 220);
        tx = P.x + Math.cos(a) * d;
        ty = P.y + Math.sin(a) * d;
      }
      addB({
        k: 'lob',
        x0: P.x,
        y0: P.y,
        x1: tx,
        y1: ty,
        x: P.x,
        y: P.y,
        t: 0,
        T: 0.55,
        h: 0,
        rot: 0,
        R: (evo ? 100 : s.R) * P.area,
        dmg: evo ? 22 : s.dmg,
        dur: (evo ? 5 : 2.6) * P.dur,
        evo,
      });
    }
    w.cd = (evo ? 2 : s.cd) * P.cd;
    sfx('throw');
  },
  mines(w, dt) {
    const s = this.stats(w.lvl);
    w.cd -= dt;
    if (w.cd > 0) return;
    const evo = w.evo;
    const n = 1 + P.proj;
    for (let i = 0; i < n; i++) {
      if (G.mines.length >= 14) break;
      G.mines.push({
        o: P.i,
        wm: WM,
        x: P.x + rand(-22, 22),
        y: P.y + rand(-22, 22),
        arm: 0.45,
        life: 14,
        R: (evo ? 125 : s.R) * P.area,
        dmg: evo ? 120 : s.dmg,
        evo,
        t: rand(3),
      });
    }
    w.cd = s.cd * P.cd;
    sfx('drop');
  },
  rockets(w, dt) {
    const s = this.stats(w.lvl);
    w.cd -= dt;
    if (w.cd > 0) return;
    const evo = w.evo;
    const cand = [];
    forNear(P.x, P.y, 620, e => {
      cand.push(e);
    });
    if (!cand.length) {
      w.cd = 0.1;
      return;
    }
    const n = (evo ? 8 : s.n) + P.proj;
    const t0 = nearest(P.x, P.y, 620) || cand[0];
    const base = Math.atan2(t0.y - P.y, t0.x - P.x);
    for (let i = 0; i < n; i++) {
      addB({
        k: 'rocket',
        x: P.x,
        y: P.y,
        a: base + rand(-1.3, 1.3),
        spd: 150,
        tg: i === 0 ? t0 : pick(cand),
        dmg: evo ? 40 : s.dmg,
        R: (evo ? 60 : s.R) * P.area,
        life: 3.5,
        col: evo ? '#ffd23e' : this.col,
        small: evo,
      });
    }
    w.cd = (evo ? 1.4 : s.cd) * P.cd;
    sfx('launch');
  },
  aura(w, dt) {
    const s = this.stats(w.lvl);
    const evo = w.evo;
    const R = (evo ? 150 : s.R) * P.area;
    w.R = R;
    w.tick = (w.tick || 0) - dt;
    if (w.tick <= 0) {
      w.tick = 0.45 * P.cd;
      forNear(P.x, P.y, R, e =>
        dmgEnemy(e, evo ? 20 : s.dmg, { kb: evo ? 40 : 70, quiet: true, slow: evo ? 0.45 : 0.15 }),
      );
    }
    if (evo) {
      w.pulse = (w.pulse ?? 2.4) - dt;
      if (w.pulse <= 0) {
        w.pulse = 2.4;
        forNear(P.x, P.y, R * 1.25, e => dmgEnemy(e, 60, { kb: 480 }));
        ring(P.x, P.y, 20, R * 1.25, 0.45, '#ffd23e');
        sfx('boom');
        addShake(5);
      }
    }
  },
  laser(w, dt) {
    const s = this.stats(w.lvl);
    const evo = w.evo;
    const n = (evo ? 4 : s.n) + P.proj;
    const len = (evo ? 300 : s.len) * P.area;
    const rot = evo ? 2.5 : s.rot;
    const dmg = evo ? 18 : s.dmg;
    w.ang = (w.ang || 0) + rot * dt;
    w.n = n;
    w.rot = rot;
    w.len = len;
    forNear(P.x, P.y, len, e => {
      if ((e.hc.lz || 0) > G.t) return;
      for (let i = 0; i < n; i++) {
        const a = w.ang + (i * TAU) / n;
        const x2 = P.x + Math.cos(a) * len,
          y2 = P.y + Math.sin(a) * len;
        if (segDist(e.x, e.y, P.x, P.y, x2, y2) < e.r + 6) {
          e.hc.lz = G.t + 0.18;
          dmgEnemy(e, dmg, { quiet: true, kb: 30 });
          spark(e.x, e.y, evo ? `hsl(${(G.t * 200 + i * 90) % 360},100%,65%)` : this.col, 2);
          break;
        }
      }
    });
  },
  turret(w, dt) {
    const s = this.stats(w.lvl);
    const evo = w.evo;
    const n = (evo ? 3 : s.n) + P.proj;
    w.tur = w.tur || [];
    if (evo) {
      // Sentinelles : elles suivent le joueur en formation
      if (w.tur.some(t => !t.mob)) w.tur = [];
      while (w.tur.length < n) w.tur.push({ x: P.x, y: P.y, cd: rand(0.3), ang: 0, life: 1, max: 1, mob: true });
      w.tur.length = n;
      w.orb = (w.orb || 0) + dt * 1.3;
      w.tur.forEach((t, i) => {
        const a = w.orb + (i * TAU) / n;
        const tx = P.x + Math.cos(a) * 60,
          ty = P.y + Math.sin(a) * 60;
        const k = Math.min(1, dt * 6);
        t.x += (tx - t.x) * k;
        t.y += (ty - t.y) * k;
      });
    } else {
      const life = s.dur * P.dur;
      for (const t of w.tur) t.life -= dt;
      w.tur = w.tur.filter(t => t.life > 0);
      w.drop = (w.drop ?? 0) - dt;
      if (w.drop <= 0) {
        w.tur.push({ x: P.x, y: P.y, cd: 0.25, ang: P.aim, life, max: life });
        while (w.tur.length > n) w.tur.shift();
        w.drop = Math.max(2.5, life / n);
        sfx('drop');
        ring(P.x, P.y, 6, 30, 0.3, this.col);
      }
    }
    for (const t of w.tur) {
      t.cd -= dt;
      if (t.cd > 0) continue;
      const tg = nearest(t.x, t.y, 430 * P.range);
      if (!tg) {
        t.cd = 0.1;
        continue;
      }
      const a = Math.atan2(tg.y - t.y, tg.x - t.x);
      t.ang = a;
      const k = evo ? 2 : 1;
      for (let i = 0; i < k; i++)
        shot(
          t.x,
          t.y,
          a + (i - (k - 1) / 2) * 0.1,
          820,
          s.dmg * (evo ? 1.3 : 1),
          s.pierce + (evo ? 1 : 0),
          0.7,
          this.col,
          4.5,
          60,
        );
      t.cd = s.cd * P.cd * (evo ? 0.7 : 1);
      muzzleAt(t.x, t.y, a, this.col, 3);
      sfx('shoot');
    }
  },
  flamer(w, dt) {
    const s = this.stats(w.lvl);
    const evo = w.evo;
    const len = s.len * P.area * P.range * (evo ? 1.2 : 1);
    const t = nearest(P.x, P.y, len * 1.1);
    w.on = !!t;
    w.len = len;
    w.wd = s.w + P.proj * 0.12;
    if (!t) return;
    const a = Math.atan2(t.y - P.y, t.x - P.x);
    aimAt(a);
    w.ang = a;
    w.cd -= dt;
    if (w.cd > 0) return;
    w.cd = 0.14 * P.cd;
    if (Math.random() < 0.3) sfx('fire');
    const dirs = evo ? [a, a + Math.PI] : [a];
    const dmg = s.dmg * (evo ? 1.8 : 1);
    const bd = Math.max(1, Math.round(s.burn * (evo ? 2 : 1) * P.dmg * WM));
    for (const d of dirs)
      forNear(P.x, P.y, len, e => {
        const dist = Math.hypot(e.x - P.x, e.y - P.y) || 1;
        const da = Math.abs(((Math.atan2(e.y - P.y, e.x - P.x) - d + Math.PI * 3) % TAU) - Math.PI);
        if (da < w.wd + e.r / dist) {
          dmgEnemy(e, dmg, { quiet: true, kb: 25, sx: P.x, sy: P.y });
          burnE(e, bd, 2 * P.dur);
        }
      });
  },
  cryo(w, dt) {
    const s = this.stats(w.lvl);
    const evo = w.evo;
    const R = s.R * P.range;
    const n = (evo ? 4 : s.n) + P.proj;
    w.tgs = (w.tgs || []).filter(e => !e.dead && Math.hypot(e.x - P.x, e.y - P.y) < R * 1.1);
    if (w.tgs.length < n) {
      const c = [];
      forNear(P.x, P.y, R, e => {
        if (!w.tgs.includes(e)) c.push(e);
      });
      c.sort((a, b) => (a.x - P.x) ** 2 + (a.y - P.y) ** 2 - ((b.x - P.x) ** 2 + (b.y - P.y) ** 2));
      while (w.tgs.length < n && c.length) w.tgs.push(c.shift());
    }
    w.pts = [];
    for (const e of w.tgs) w.pts.push(Math.round(e.x), Math.round(e.y));
    if (w.tgs.length) aimAt(Math.atan2(w.tgs[0].y - P.y, w.tgs[0].x - P.x));
    w.cd -= dt;
    if (w.cd > 0) return;
    w.cd = 0.15 * P.cd;
    for (const e of w.tgs) {
      e.chill = (e.chill || 0) + 0.15;
      dmgEnemy(e, s.dmg * (evo ? 1.5 : 1), { quiet: true, slow: 0.55 });
      if (!e.dead && e.type !== 'boss' && e.chill >= (evo ? 0.6 : s.fz)) {
        e.chill = 0;
        e.stun = Math.max(e.stun, 1.3);
        e.frozen = 1.3;
        e.shatter = evo;
        spark(e.x, e.y, '#bff9ff', 6);
        sfx('zap');
      }
    }
  },
  katana(w, dt) {
    const s = this.stats(w.lvl);
    w.cd -= dt;
    if (w.cd > 0) return;
    const evo = w.evo;
    const R = s.R * P.area * P.range * (evo ? 1.35 : 1);
    const t = nearest(P.x, P.y, R * 1.3);
    if (!t) {
      w.cd = 0.08;
      return;
    }
    const a = Math.atan2(t.y - P.y, t.x - P.x);
    aimAt(a);
    const n = evo ? 1 : s.n + P.proj;
    const half = evo ? Math.PI : 1.15;
    let healed = 0;
    for (let i = 0; i < n; i++) {
      const d = a + (i * TAU) / n;
      forNear(P.x, P.y, R, e => {
        const da = Math.abs(((Math.atan2(e.y - P.y, e.x - P.x) - d + Math.PI * 3) % TAU) - Math.PI);
        if (da <= half) {
          dmgEnemy(e, s.dmg * (evo ? 1.6 : 1), { kb: 240, sx: P.x, sy: P.y });
          if (evo && healed < 8) healed++;
        }
      });
      fxPush({
        k: 'slash',
        x: Math.round(P.x),
        y: Math.round(P.y),
        a: Math.round(d * 100) / 100,
        R: Math.round(R),
        h: Math.round(half * 100) / 100,
        life: 0.22,
        max: 0.22,
        col: evo ? '#ff3d8b' : this.col,
      });
    }
    if (healed) {
      P.hp = Math.min(P.maxHp, P.hp + healed);
    }
    w.cd = (evo ? 0.75 : s.cd) * P.cd;
    sfx('slash');
  },
  singular(w, dt) {
    const s = this.stats(w.lvl);
    w.cd -= dt;
    if (w.cd > 0) return;
    const evo = w.evo;
    const cand = [];
    forNear(P.x, P.y, 420, e => {
      cand.push(e);
    });
    if (!cand.length) {
      w.cd = 0.15;
      return;
    }
    const n = (evo ? 2 : s.n) + P.proj;
    for (let i = 0; i < n; i++) {
      const c = pick(cand);
      const dur = s.dur * P.dur;
      G.zones.push({
        k: 'hole',
        o: P.i,
        wm: WM,
        x: c.x,
        y: c.y,
        R: (evo ? 190 : s.R) * P.area,
        dmg: s.dmg * (evo ? 1.6 : 1),
        boom: s.boom * (evo ? 2.2 : 1),
        life: dur,
        max: dur,
        tick: 0,
        evo,
      });
    }
    w.cd = (evo ? 3 : s.cd) * P.cd;
    sfx('launch');
  },
};

export function updateWeapon(w, dt) {
  BEHAVIOR[w.id].call(WEAPONS[w.id], w, dt);
}
