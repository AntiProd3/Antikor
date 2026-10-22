// Canvas du jeu : taille, échelle et vignettes.

import { setView } from '../sim/state.js';
import { clamp } from '../util.js';

export const cvs = document.getElementById('game');

export const ctx = cvs.getContext('2d');

export let VW = 800,
  VH = 600,
  DPR = 1,
  ZOOM = 1,
  HW = 400,
  HH = 300,
  vign = null,
  vignRed = null;

export function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  VW = window.innerWidth;
  VH = window.innerHeight;
  cvs.width = Math.round(VW * DPR);
  cvs.height = Math.round(VH * DPR);
  ZOOM = clamp(Math.min(VW, VH) / 600, 0.72, 1.3);
  HW = VW / 2 / ZOOM;
  HH = VH / 2 / ZOOM;
  setView(HW, HH);
  vign = makeVign('rgba(0,0,0,0.78)');
  vignRed = makeVign('rgba(255,30,70,0.85)');
}

export function makeVign(col) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 60, 128, 128, 182);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(1, col);
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return c;
}
