// Sols des 5 mondes (motif du monde 1, sols procéduraux des mondes 2 à 5).

import { WORLDS, worldOf } from '../data/career.js';
import { HH, HW, ctx, makeVign } from './canvas.js';
import { save } from '../save.js';
import { G } from '../sim/state.js';
import { TAU, hexA } from '../util.js';

export const FLOOR = {
  bg: '#070b16',
  chk: 'rgba(40,70,140,0.045)',
  grid: '#0f1a33',
  main: '#18305e',
  cross: '#26447f',
  d1: '#101d3a',
  d2: '#142650',
  d3: '#132852',
};

export const FLOOR_LIT = {
  bg: '#0f1832',
  chk: 'rgba(70,110,200,0.09)',
  grid: '#1f3668',
  main: '#3a62b4',
  cross: '#5a8ff0',
  d1: '#21397a',
  d2: '#284a94',
  d3: '#27488c',
};

export function makeFloor(pal = FLOOR) {
  const T = 320,
    S = 2;
  const c = document.createElement('canvas');
  c.width = c.height = T * S;
  const g = c.getContext('2d');
  g.scale(S, S);
  g.fillStyle = pal.bg;
  g.fillRect(0, 0, T, T);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      if ((i + j) % 2) {
        g.fillStyle = pal.chk;
        g.fillRect(i * 80, j * 80, 80, 80);
      }
  g.strokeStyle = pal.grid;
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 1; i < 4; i++) {
    g.moveTo(i * 80 + 0.5, 0);
    g.lineTo(i * 80 + 0.5, T);
    g.moveTo(0, i * 80 + 0.5);
    g.lineTo(T, i * 80 + 0.5);
  }
  g.stroke();
  g.strokeStyle = pal.main;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(0.75, 0);
  g.lineTo(0.75, T);
  g.moveTo(0, 0.75);
  g.lineTo(T, 0.75);
  g.stroke();
  g.strokeStyle = pal.cross;
  g.lineWidth = 1.2;
  g.beginPath();
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const x = i * 80,
        y = j * 80;
      g.moveTo(x - 4, y);
      g.lineTo(x + 4, y);
      g.moveTo(x, y - 4);
      g.lineTo(x, y + 4);
    }
  g.stroke();
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.strokeStyle = pal.d1;
  g.lineWidth = 1;
  for (let k = 0; k < 6; k++) {
    let x = rnd() * T,
      y = rnd() * T;
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      x += rnd() * 24 - 12;
      y += rnd() * 24 - 12;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.strokeStyle = pal.d2;
  for (let k = 0; k < 4; k++) {
    g.beginPath();
    g.arc(rnd() * T, rnd() * T, 3 + rnd() * 6, 0, TAU);
    g.stroke();
  }
  g.strokeStyle = pal.d3;
  g.lineWidth = 1.5;
  for (let k = 0; k < 2; k++) {
    const x = rnd() * (T - 60) + 20,
      y = rnd() * (T - 30) + 10;
    g.beginPath();
    for (let s = 0; s < 3; s++) {
      g.moveTo(x + s * 10, y);
      g.lineTo(x + s * 10 + 6, y + 6);
      g.lineTo(x + s * 10, y + 12);
    }
    g.stroke();
  }
  return c;
}

// Thème du sol : monde du niveau joué (ou, au menu, monde atteint en carrière)
export function curTheme() {
  return (G && G.theme) || WORLDS[worldOf(save.career ? save.career.max : 1)];
}

export function hsh(i, j) {
  let h = (i * 374761393 + j * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

export const rgba = (c, k) => `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, c[3] * k)})`;

// Sols des mondes 2 à 5, dessinés directement dans le monde (pas de motif répété visible). lit = 0..1 pendant les boss
export function drawProcFloor(th, cam, lit) {
  const k = 1 + lit * 1.2;
  const x0 = cam.x - HW - 80,
    x1 = cam.x + HW + 80,
    y0 = cam.y - HH - 80,
    y1 = cam.y + HH + 80;
  ctx.lineWidth = 1.2;
  if (th.style === 'hex') {
    const S = 46,
      w = Math.sqrt(3) * S,
      h = 1.5 * S;
    ctx.strokeStyle = rgba(th.line, k);
    ctx.beginPath();
    const fills = [];
    for (let r = Math.floor(y0 / h); r <= Math.ceil(y1 / h); r++)
      for (let c = Math.floor(x0 / w) - 1; c <= Math.ceil(x1 / w); c++) {
        const cx = c * w + ((r & 1) * w) / 2,
          cy = r * h;
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 6 + (i * Math.PI) / 3;
          const px = cx + Math.cos(a) * S,
            py = cy + Math.sin(a) * S;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath();
        const hh = hsh(c, r);
        if (hh % 11 === 0) fills.push([cx, cy, hh]);
      }
    ctx.stroke();
    for (const [cx, cy, hh] of fills) {
      ctx.fillStyle = rgba(th.acc, k * 0.28);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + (i * Math.PI) / 3;
        const px = cx + Math.cos(a) * (S - 5),
          py = cy + Math.sin(a) * (S - 5);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(th.acc, k);
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, TAU);
      ctx.fill();
    }
  } else if (th.style === 'dots') {
    const S = 34;
    ctx.fillStyle = rgba(th.line, k);
    const big = [];
    for (let j = Math.floor(y0 / S); j <= Math.ceil(y1 / S); j++)
      for (let i = Math.floor(x0 / S); i <= Math.ceil(x1 / S); i++) {
        const hh = hsh(i, j);
        if (hh % 29 === 0) big.push([i * S, j * S]);
        else ctx.fillRect(i * S - 1.2, j * S - 1.2, 2.4, 2.4);
      }
    ctx.strokeStyle = rgba(th.acc, k);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const [x, y] of big) {
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x + 5, y);
      ctx.moveTo(x, y - 5);
      ctx.lineTo(x, y + 5);
    }
    ctx.stroke();
    const R = 340;
    ctx.strokeStyle = rgba(th.line, k * 0.7);
    ctx.lineWidth = 1;
    for (let j = Math.floor(y0 / R) - 1; j <= Math.ceil(y1 / R); j++)
      for (let i = Math.floor(x0 / R) - 1; i <= Math.ceil(x1 / R); i++) {
        const hh = hsh(i + 99, j - 7);
        if (hh % 3) continue;
        const cx = i * R + (hh % 200),
          cy = j * R + ((hh >> 8) % 200);
        for (let q = 1; q <= 3; q++) {
          ctx.beginPath();
          ctx.arc(cx, cy, 30 + q * 26 + ((hh >> 16) % 20), 0, TAU);
          ctx.stroke();
        }
      }
  } else if (th.style === 'tri') {
    const S = 64,
      diag = Math.hypot(x1 - x0, y1 - y0);
    for (const ang of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
      const nx = Math.cos(ang + Math.PI / 2),
        ny = Math.sin(ang + Math.PI / 2),
        dx = Math.cos(ang),
        dy = Math.sin(ang);
      const ds = [x0 * nx + y0 * ny, x1 * nx + y0 * ny, x0 * nx + y1 * ny, x1 * nx + y1 * ny];
      const a0 = Math.floor(Math.min(...ds) / S),
        a1 = Math.ceil(Math.max(...ds) / S);
      const mx = (x0 + x1) / 2,
        my = (y0 + y1) / 2,
        mp = mx * nx + my * ny;
      for (let a = a0; a <= a1; a++) {
        const off = a * S - mp;
        const px = mx + nx * off,
          py = my + ny * off;
        ctx.strokeStyle = rgba(a % 4 === 0 ? th.acc : th.line, a % 4 === 0 ? k * 0.45 : k);
        ctx.beginPath();
        ctx.moveTo(px - dx * diag, py - dy * diag);
        ctx.lineTo(px + dx * diag, py + dy * diag);
        ctx.stroke();
      }
    }
  } else if (th.style === 'circuit') {
    const S = 48;
    ctx.strokeStyle = rgba(th.line, k);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    const pads = [];
    for (let j = Math.floor(y0 / S) - 1; j <= Math.ceil(y1 / S); j++)
      for (let i = Math.floor(x0 / S) - 1; i <= Math.ceil(x1 / S); i++) {
        const hh = hsh(i, j),
          x = i * S,
          y = j * S;
        if (hh % 3 === 0) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + S, y);
        }
        if (hh % 5 === 0) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + S);
        }
        if (hh % 13 === 0) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + S * 0.5, y + S * 0.5);
        }
        if ((hh >> 4) % 9 === 0 && (hh % 3 === 0 || hh % 5 === 0)) pads.push([x, y]);
      }
    ctx.stroke();
    ctx.strokeStyle = rgba(th.acc, k);
    ctx.lineWidth = 1.5;
    for (const [x, y] of pads) {
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, TAU);
      ctx.stroke();
    }
  }
}

export let floorPat = null,
  bossPat = null;
const BVIGN = {};

export function bossVign(col) {
  return BVIGN[col] || (BVIGN[col] = makeVign(hexA(col, 0.75)));
}

export function initFloor() {
  floorPat = ctx.createPattern(makeFloor(), 'repeat');
  bossPat = ctx.createPattern(makeFloor(FLOOR_LIT), 'repeat');
  try {
    floorPat.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0]));
    bossPat.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0]));
  } catch (e) {}
}
