// Rendu d’une image : sol, monde, vignettes, joystick, écran de démo du menu.

import { ETYPES } from '../data/enemies.js';
import { joy } from '../input.js';
import { DPR, HH, HW, VH, VW, ZOOM, ctx, cvs, vign, vignRed } from './canvas.js';
import { bossPat, bossVign, curTheme, drawProcFloor, floorPat } from './floor.js';
import { SPR, glow } from './sprites.js';
import { drawWorld } from './world.js';
import { plName } from '../sim/player.js';
import { G, ME, P } from '../sim/state.js';
import { TAU, mixHex, pick, rand } from '../util.js';

export const demo = { cam: { x: 0, y: 0 }, ens: [] };

export function setWorld(cam, shx, shy) {
  const s = DPR * ZOOM;
  ctx.setTransform(s, 0, 0, s, DPR * (VW / 2 + shx) - s * cam.x, DPR * (VH / 2 + shy) - s * cam.y);
}

export function inView(cam, x, y, m) {
  return Math.abs(x - cam.x) < HW + m && Math.abs(y - cam.y) < HH + m;
}

export function drawSprite(spr, x, y, ang, sx, sy, flash) {
  const h = spr.half;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(sx, sy);
  ctx.drawImage(flash ? spr.f : spr.n, -h, -h, h * 2, h * 2);
  ctx.restore();
}

export function drawGlow(col, x, y, size, a = 1) {
  ctx.globalAlpha = a;
  ctx.drawImage(glow(col), x - size / 2, y - size / 2, size, size);
  ctx.globalAlpha = 1;
}

export function render(rdt) {
  if (G) {
    const tgt =
      G.isBoss &&
      !G.bossDead &&
      (G.state === 'play' || G.state === 'pause' || G.state === 'level' || G.state === 'dying')
        ? 1
        : 0;
    G.bossFx = (G.bossFx || 0) + (tgt - (G.bossFx || 0)) * Math.min(1, rdt * 1.4);
  }
  const th = curTheme(),
    lit = G ? G.bossFx || 0 : 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = mixHex(th.bg, th.bgLit, lit);
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  const cam = G ? G.cam : demo.cam;
  const sh = G ? G.shake : 0;
  const shx = (Math.random() * 2 - 1) * sh,
    shy = (Math.random() * 2 - 1) * sh;
  setWorld(cam, shx, shy);
  if (th.style === 'grid') {
    if (floorPat) {
      ctx.fillStyle = floorPat;
      ctx.fillRect(cam.x - HW - 4, cam.y - HH - 4, HW * 2 + 8, HH * 2 + 8);
    }
    if (lit > 0.01 && bossPat) {
      ctx.globalAlpha = lit;
      ctx.fillStyle = bossPat;
      ctx.fillRect(cam.x - HW - 4, cam.y - HH - 4, HW * 2 + 8, HH * 2 + 8);
      ctx.globalAlpha = 1;
    }
  } else drawProcFloor(th, cam, lit);
  if (!G) {
    drawDemo();
  } else drawWorld(cam);
  // screen space
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  if (vign) ctx.drawImage(vign, 0, 0, cvs.width, cvs.height);
  // manche de boss : bords de l'écran teintés à la couleur du boss, qui battent comme un cœur
  if (G && G.bossFx > 0.01) {
    const col = (G.boss && G.boss.col) || '#ff3d8b';
    const beat = Math.pow(Math.max(0, Math.sin(G.t * 2.6)), 10);
    ctx.globalAlpha = G.bossFx * (0.45 + 0.4 * beat);
    ctx.drawImage(bossVign(col), 0, 0, cvs.width, cvs.height);
    ctx.globalAlpha = 1;
  }
  if (G && P) {
    if (G.players.length > 1) drawMateArrow();
    const low = !P.down && P.hp / P.maxHp < 0.3 && G.state === 'play';
    const a = Math.max(G.hurtFlash * 1.6, low ? 0.35 + 0.25 * Math.sin(G.t * 6) : 0);
    if (a > 0) {
      ctx.globalAlpha = Math.min(1, a);
      ctx.drawImage(vignRed, 0, 0, cvs.width, cvs.height);
      ctx.globalAlpha = 1;
    }
    if (G.whiteFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, G.whiteFlash)})`;
      ctx.fillRect(0, 0, cvs.width, cvs.height);
    }
    if (joy && G.state === 'play') {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.strokeStyle = 'rgba(62,242,255,.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(joy.ox, joy.oy, 58, 0, TAU);
      ctx.stroke();
      const dx = joy.x - joy.ox,
        dy = joy.y - joy.oy,
        d = Math.hypot(dx, dy),
        m = Math.min(d, 58);
      const kx = joy.ox + (d ? (dx / d) * m : 0),
        ky = joy.oy + (d ? (dy / d) * m : 0);
      ctx.fillStyle = 'rgba(62,242,255,.28)';
      ctx.beginPath();
      ctx.arc(kx, ky, 24, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(62,242,255,.8)';
      ctx.stroke();
    }
    G.shake = Math.max(0, G.shake - rdt * 40);
    G.hurtFlash = Math.max(0, G.hurtFlash - rdt);
    G.whiteFlash = Math.max(0, G.whiteFlash - rdt * 1.5);
  }
}

export function drawDemo() {
  for (const e of demo.ens) {
    const T = ETYPES[e.type];
    ctx.globalAlpha = 0.6;
    drawSprite(SPR[e.type], e.x, e.y, e.a, 1 + Math.sin(e.t * 8) * 0.06, 1 - Math.sin(e.t * 8) * 0.06, false);
  }
  ctx.globalAlpha = 1;
}

export function updateDemo(dt) {
  demo.cam.x += 22 * dt;
  demo.cam.y += 9 * dt;
  const mx = HW + 90,
    my = HH + 90;
  for (const e of demo.ens) {
    e.t += dt;
    e.a += rand(-1.2, 1.2) * dt;
    e.x += Math.cos(e.a) * e.sp * dt;
    e.y += Math.sin(e.a) * e.sp * dt;
    if (e.x - demo.cam.x > mx) e.x -= 2 * mx;
    if (e.x - demo.cam.x < -mx) e.x += 2 * mx;
    if (e.y - demo.cam.y > my) e.y -= 2 * my;
    if (e.y - demo.cam.y < -my) e.y += 2 * my;
  }
}

export function initDemo() {
  demo.ens = [];
  const types = ['walker', 'walker', 'runner', 'tank', 'spitter', 'bomber', 'splitter', 'runner', 'walker'];
  for (let i = 0; i < 20; i++) {
    const t = pick(types);
    demo.ens.push({
      type: t,
      x: rand(-900, 900),
      y: rand(-600, 600),
      a: rand(TAU),
      t: rand(10),
      sp: ETYPES[t].spd * 0.5,
    });
  }
}

// Flèche au bord de l'écran quand le partenaire est hors champ
export function drawMateArrow() {
  const m = G.players[1 - ME];
  if (!m || m.gone || G.state === 'over') return;
  const cam = G.cam;
  const dx = m.x - cam.x,
    dy = m.y - cam.y;
  if (Math.abs(dx) < HW - 10 && Math.abs(dy) < HH - 10) return;
  const s = Math.min((HW - 34) / Math.abs(dx || 1e-6), (HH - 34) / Math.abs(dy || 1e-6));
  const sx = VW / 2 + dx * s * ZOOM,
    sy = VH / 2 + dy * s * ZOOM;
  const a = Math.atan2(dy, dx);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(a);
  ctx.fillStyle = m.down ? '#62ff9a' : m.col;
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-8, -10);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.font = '700 12px "Chakra Petch",system-ui,sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = m.down ? '#62ff9a' : m.col;
  ctx.fillText(
    plName(m) + ' · ' + Math.round(Math.hypot(dx, dy) / 10) + ' m',
    sx - Math.cos(a) * 30,
    sy - Math.sin(a) * 24,
  );
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
