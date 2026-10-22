// Grille spatiale : retrouver vite les ennemis proches d’un point.

import { G } from './state.js';

export const CELL = 64;

export const grid = new Map();

export const gpool = [];

export const gused = [];

export function gk(cx, cy) {
  return (cx + 32768) * 65536 + (cy + 32768);
}

export function buildGrid() {
  for (const a of gused) {
    a.length = 0;
    gpool.push(a);
  }
  gused.length = 0;
  grid.clear();
  for (const e of G.enemies) {
    if (e.dead) continue;
    const k = gk(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
    let a = grid.get(k);
    if (!a) {
      a = gpool.pop() || [];
      grid.set(k, a);
      gused.push(a);
    }
    a.push(e);
  }
}

export function forNear(x, y, R, cb) {
  const m = 52;
  const x0 = Math.floor((x - R - m) / CELL),
    x1 = Math.floor((x + R + m) / CELL),
    y0 = Math.floor((y - R - m) / CELL),
    y1 = Math.floor((y + R + m) / CELL);
  for (let cx = x0; cx <= x1; cx++)
    for (let cy = y0; cy <= y1; cy++) {
      const a = grid.get(gk(cx, cy));
      if (!a) continue;
      for (let i = 0; i < a.length; i++) {
        const e = a[i];
        if (e.dead) continue;
        const dx = e.x - x,
          dy = e.y - y,
          rr = R + e.r;
        if (dx * dx + dy * dy <= rr * rr) {
          if (cb(e) === true) return;
        }
      }
    }
}

export function nearest(x, y, maxR) {
  let best = null,
    bd = maxR * maxR;
  for (const e of G.enemies) {
    if (e.dead) continue;
    const dx = e.x - x,
      dy = e.y - y,
      d = dx * dx + dy * dy;
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}
