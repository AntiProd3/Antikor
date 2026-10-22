// Petits outils mathématiques et de couleur, sans dépendance.

export const TAU = Math.PI * 2;

export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export const lerp = (a, b, t) => a + (b - a) * t;

export const pick = a => a[Math.floor(Math.random() * a.length)];

export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function compact(a) {
  let j = 0;
  for (let i = 0; i < a.length; i++) {
    const o = a[i];
    if (!o.dead) a[j++] = o;
  }
  a.length = j;
}

export function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1,
    dy = y2 - y1;
  const l = dx * dx + dy * dy;
  let t = l ? ((px - x1) * dx + (py - y1) * dy) / l : 0;
  t = clamp(t, 0, 1);
  const cx = x1 + dx * t - px,
    cy = y1 + dy * t - py;
  return Math.sqrt(cx * cx + cy * cy);
}

export function fmtTime(s) {
  s = Math.max(0, Math.ceil(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

export function mixHex(a, b, t) {
  const A = parseInt(a.slice(1), 16),
    B = parseInt(b.slice(1), 16);
  const m = s => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}
