// Effets visuels et sonores déclenchés par la simulation.
// En duo, l’hôte enregistre chaque effet (rec) pour le rejouer chez l’invité.

import { hooks } from './hooks.js';
import { G, ME, P, settings } from './state.js';
import { TAU, rand } from '../util.js';

// Chez l'hôte d'une partie en duo, chaque effet est aussi enregistré (rec) puis rejoué chez l'invité.
export let REC = false;

export const EV = [];

export function rec(a) {
  if (REC && EV.length < 2000) EV.push(a);
}

export function shakeLocal(v) {
  G.shake = Math.max(G.shake, v * (settings.reduced ? 0.3 : 1));
}

export function addShake(v) {
  rec(['shake', v]);
  shakeLocal(v);
}

export function part(x, y, vx, vy, life, size, col, kind = 0, drag = 3) {
  if (G.parts.length >= 900) return;
  G.parts.push({ x, y, vx, vy, life, max: life, size, col, kind, drag });
}

export function burst(x, y, col, n, spd = 200, size = 3) {
  rec(['burst', Math.round(x), Math.round(y), col, n, spd, size]);
  for (let i = 0; i < n; i++) {
    const a = rand(TAU),
      s = rand(0.25, 1) * spd;
    part(
      x,
      y,
      Math.cos(a) * s,
      Math.sin(a) * s,
      rand(0.25, 0.6),
      size * rand(0.6, 1.3),
      col,
      Math.random() < 0.5 ? 1 : 0,
      4,
    );
  }
}

export function spark(x, y, col, n) {
  rec(['spark', Math.round(x), Math.round(y), col, n]);
  for (let i = 0; i < n; i++) {
    const a = rand(TAU),
      s = rand(80, 240);
    part(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(0.12, 0.25), 2, col, 1, 6);
  }
}

export function ring(x, y, r0, r1, life, col) {
  rec(['ring', Math.round(x), Math.round(y), r0, Math.round(r1), life, col]);
  G.fx.push({ k: 'ring', x, y, r0, r1, life, max: life, col });
}

export function muzzle(a, col, n = 4) {
  muzzleAt(P.x, P.y, a, col, n);
}

export function muzzleAt(px, py, a, col, n) {
  rec(['muzzle', Math.round(px), Math.round(py), Math.round(a * 100) / 100, col, n]);
  const x = px + Math.cos(a) * 20,
    y = py + Math.sin(a) * 20;
  for (let i = 0; i < n; i++) {
    const aa = a + rand(-0.4, 0.4),
      s = rand(120, 320);
    part(x, y, Math.cos(aa) * s, Math.sin(aa) * s, 0.1, 2.5, col, 1, 8);
  }
}

export function addText(x, y, v, crit, col) {
  if (G.texts.length > 110 && !crit) return;
  rec(['text', Math.round(x), Math.round(y), v, crit ? 1 : 0, col]);
  G.texts.push({
    x: x + rand(-6, 6),
    y,
    v,
    crit,
    col,
    life: crit ? 0.85 : 0.6,
    max: crit ? 0.85 : 0.6,
    vy: crit ? -70 : -50,
  });
}

export function textFx(x, y, v, col) {
  rec(['textfx', Math.round(x), Math.round(y), v, col]);
  G.texts.push({ x, y, v, crit: false, col, life: 0.7, max: 0.7, vy: -60 });
}

export function decal(x, y, col, r) {
  rec(['decal', Math.round(x), Math.round(y), col, r]);
  if (G.decals.length > 140) G.decals.shift();
  G.decals.push({ x, y, col, v: Math.floor(Math.random() * 3), s: r * 2.6, rot: rand(TAU), life: 6, max: 6 });
}

export function fxPush(o) {
  rec(['fx', o]);
  G.fx.push(o);
}

export function flashFx(x, y, R, col) {
  rec(['flash', Math.round(x), Math.round(y), Math.round(R), col]);
  G.flashes.push({ x, y, R, life: 0.14, max: 0.14, col });
}

export function white(v) {
  rec(['white', v]);
  G.whiteFlash = Math.max(G.whiteFlash, v);
}

// Effet « je suis touché » : seulement pour le joueur concerné
export function hurtFx(i) {
  rec(['hurt', i]);
  if (i === ME) {
    shakeLocal(9);
    G.hurtFlash = 0.4;
    hooks.sound('hurt');
  }
}

export function setRec(v) {
  REC = v;
}

// Son joué par la simulation (enregistré pour le duo)
export function sfx(name, ...args) {
  hooks.sound(name, ...args);
  rec(['$', name, ...args]);
}

export function banner(main, sub, col) {
  rec(['banner', main, sub, col]);
  hooks.banner(main, sub, col);
}

export function toast(title, text, col) {
  rec(['toast', title, text, col]);
  hooks.toast(title, text, col);
}

// Effets purement visuels, calculés aussi chez l'invité
export function zoneFx(z, dt) {
  if (z.k === 'hole') {
    if (Math.random() < dt * 40) {
      const a = rand(TAU),
        r = z.R * rand(0.7, 1.05);
      part(
        z.x + Math.cos(a) * r,
        z.y + Math.sin(a) * r,
        -Math.cos(a) * r * 2.2 + Math.sin(a) * 90,
        -Math.sin(a) * r * 2.2 - Math.cos(a) * 90,
        0.4,
        rand(2.5, 4),
        Math.random() < 0.5 ? '#9d7bff' : '#d8c8ff',
        1,
        1,
      );
    }
    return;
  }
  if (Math.random() < dt * z.R * 0.35) {
    const a = rand(TAU),
      r = Math.sqrt(Math.random()) * z.R * 0.9;
    part(
      z.x + Math.cos(a) * r,
      z.y + Math.sin(a) * r,
      rand(-15, 15),
      rand(-70, -30),
      rand(0.3, 0.6),
      rand(3, 6),
      Math.random() < 0.6 ? '#ff7a2a' : '#ffd23e',
      0,
      1,
    );
  }
}

export function enemyFx(e, dt) {
  if (e.burnT > 0 && Math.random() < dt * 14)
    part(
      e.x + rand(-0.6, 0.6) * e.r,
      e.y + rand(-0.6, 0.6) * e.r,
      rand(-15, 15),
      rand(-90, -40),
      rand(0.25, 0.45),
      rand(3, 5),
      Math.random() < 0.5 ? '#ff7a2a' : '#ffd23e',
      0,
      1,
    );
}

export function weaponFx(pl, dt) {
  if (pl.down) return;
  for (const w of pl.weapons) {
    if (w.id === 'turret' && w.evo && w.tur)
      for (const t of w.tur)
        if (Math.random() < dt * 20)
          part(t.x, t.y + 6, rand(-15, 15), rand(30, 70), 0.3, rand(2, 3.5), '#3effd2', 0, 3);
    if (w.id === 'flamer' && w.on && G.state === 'play') {
      const dirs = w.evo ? [w.ang, w.ang + Math.PI] : [w.ang];
      const n = Math.ceil(dt * 60);
      for (const d of dirs)
        for (let i = 0; i < n; i++) {
          const a = d + rand(-w.wd, w.wd) * 0.8,
            sp = w.len * rand(3.2, 4.1);
          part(
            pl.x + Math.cos(d) * 16,
            pl.y + Math.sin(d) * 16,
            Math.cos(a) * sp,
            Math.sin(a) * sp,
            rand(0.3, 0.42),
            rand(4, 7),
            w.evo ? (Math.random() < 0.5 ? '#5ad1ff' : '#bff9ff') : Math.random() < 0.55 ? '#ff7a2a' : '#ffd23e',
            0,
            2.4,
          );
        }
    }
  }
}

export function rocketTrail(b) {
  if (Math.random() < 0.85)
    part(
      b.x - Math.cos(b.a) * 8,
      b.y - Math.sin(b.a) * 8,
      -Math.cos(b.a) * 70 + rand(-30, 30),
      -Math.sin(b.a) * 70 + rand(-30, 30),
      0.32,
      b.small ? 2.5 : 3.5,
      Math.random() < 0.5 ? '#ffb03e' : '#ff6a2a',
      0,
      3,
    );
}
