// Saisie : clavier (touches enfoncées) et joystick tactile.

import { Sfx } from './audio.js';
import { cvs } from './render/canvas.js';
import { G } from './sim/state.js';

export const keys = new Set();
export let joy = null;

export function inputVec() {
  let x = 0,
    y = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  const l = Math.hypot(x, y);
  if (l > 0) {
    x /= l;
    y /= l;
  }
  if (joy) {
    const dx = joy.x - joy.ox,
      dy = joy.y - joy.oy,
      d = Math.hypot(dx, dy);
    if (d > 6) {
      const m = Math.min(1, d / 55);
      x = (dx / d) * m;
      y = (dy / d) * m;
    }
  }
  return [x, y];
}

export function clearInput(all) {
  joy = null;
  if (all) keys.clear();
}

export function initInput() {
  cvs.addEventListener('pointerdown', e => {
    Sfx.init();
    Sfx.resume();
    if (!G || G.state !== 'play') return;
    e.preventDefault();
    joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
    try {
      cvs.setPointerCapture(e.pointerId);
    } catch (_) {}
  });
  // le centre du joystick reste fixe : le doigt peut sortir du cercle, la direction reste celle du centre vers le doigt
  cvs.addEventListener('pointermove', e => {
    if (!joy || e.pointerId !== joy.id) return;
    joy.x = e.clientX;
    joy.y = e.clientY;
  });
  const endJoy = e => {
    if (joy && e.pointerId === joy.id) joy = null;
  };
  cvs.addEventListener('pointerup', endJoy);
  cvs.addEventListener('pointercancel', endJoy);
}
