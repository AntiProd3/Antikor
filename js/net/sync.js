// Duo en ligne (suspendu) : instantanés de l’hôte et affichage chez l’invité.

import { Sfx } from '../audio.js';
import { MODES } from '../data/career.js';
import { ETYPES } from '../data/enemies.js';
import { clearInput, inputVec } from '../input.js';
import { netOpen, netSend } from './net.js';
import { persist, save } from '../save.js';
import {
  EV,
  addShake,
  addText,
  banner,
  burst,
  decal,
  enemyFx,
  flashFx,
  fxPush,
  hurtFx,
  muzzleAt,
  ring,
  rocketTrail,
  spark,
  textFx,
  toast,
  weaponFx,
  white,
  zoneFx,
} from '../sim/fx.js';
import { PCOLS, xpFor } from '../sim/player.js';
import { G, ME, P, setG, setME, setP } from '../sim/state.js';
import { updateCosmetics } from '../sim/update.js';
import { resetLevelView } from '../ui/cards.js';
import { $, currentScreen, show } from '../ui/dom.js';
import { resetHud } from '../ui/hud.js';
import { TAU, clamp, lerp, rand } from '../util.js';

/* ---------- Hôte : instantanés ---------- */

export const ETI = Object.keys(ETYPES),
  PKI = ['gem', 'coin', 'heart', 'magnet', 'bomb', 'chest', 'box'];

export const r1 = v => Math.round(v * 10) / 10,
  r2 = v => Math.round(v * 100) / 100,
  R0 = Math.round;

export function plSnap(pl) {
  const o = {
    x: r1(pl.x),
    y: r1(pl.y),
    a: r2(pl.aim),
    hp: R0(pl.hp),
    mh: pl.maxHp,
    iv: pl.inv > 0 ? 1 : 0,
    mv: pl.moving ? 1 : 0,
    dn: pl.down ? 1 : 0,
    rv: r2(pl.rev),
    sp: R0(pl.speed),
    c: Math.floor(pl.coins),
    w: pl.weapons.map(w => {
      const a = [w.id, w.lvl, w.evo ? 1 : 0, w.r || 0];
      if (w.id === 'flamer') a.push(r2(w.ang || 0), w.on ? 1 : 0, R0(w.len || 0), r2(w.wd || 0));
      else if (w.id === 'cryo') a.push(w.pts || []);
      else if (w.id === 'aura') a.push(R0(w.R || 0));
      else if (w.id === 'drones') a.push(r2(w.ang || 0), r2(w.rot || 0), w.n || 0, R0(w.R || 0), r1(w.br || 0));
      else if (w.id === 'laser') a.push(r2(w.ang || 0), r2(w.rot || 0), w.n || 0, R0(w.len || 0));
      return a;
    }),
    ps: pl.passives,
  };
  return o;
}

export function snap() {
  const g = [
    G.state,
    G.wave,
    r1(G.waveT),
    G.waveDur,
    G.isBoss ? 1 : 0,
    G.boss && !G.boss.dead ? r2(Math.max(0, G.boss.hp) / G.boss.maxHp) : 0,
    G.kills,
    G.combo,
    G.level,
    r1(G.xp),
    G.xpNext,
  ];
  const e = [];
  for (const x of G.enemies)
    if (!x.dead)
      e.push([
        x.id,
        ETI.indexOf(x.type),
        R0(x.x),
        R0(x.y),
        r2(x.ang),
        (x.elite ? 1 : 0) |
          (x.flash > 0 ? 2 : 0) |
          (x.fuse > 0 ? 4 : 0) |
          (x.type === 'boss' && x.ai.ph === 'tele' ? 8 : 0) |
          (x.frozen > 0 ? 16 : 0) |
          (x.burnT > 0 ? 32 : 0),
        x.type === 'boss' || x.elite || x.type === 'tank' ? r2(Math.max(0, x.hp) / x.maxHp) : 1,
        x.type === 'boss' ? r2(x.ai.ang || 0) : 0,
      ]);
  const b = [];
  for (const x of G.bullets) {
    if (x.dead) continue;
    if (x.k === 'shot') b.push([x.id, 0, R0(x.x), R0(x.y), r2(x.dx), r2(x.dy), x.r, x.col]);
    else if (x.k === 'disc') b.push([x.id, 1, R0(x.x), R0(x.y), R0(x.r), x.col]);
    else if (x.k === 'lob') b.push([x.id, 2, R0(x.x), R0(x.y), R0(x.h)]);
    else if (x.k === 'rocket') b.push([x.id, 3, R0(x.x), R0(x.y), r2(x.a), x.small ? 1 : 0, x.col]);
  }
  const q = [];
  for (const x of G.ebullets) if (!x.dead) q.push([x.id, R0(x.x), R0(x.y), x.r, x.col]);
  const k = [];
  for (const x of G.pickups) if (!x.dead) k.push([x.id, PKI.indexOf(x.type), R0(x.x), R0(x.y), x.v]);
  const z = G.zones
    .filter(x => !x.dead)
    .map(x => [R0(x.x), R0(x.y), R0(x.R), r2(x.life), r2(x.max), x.evo ? 1 : 0, x.k === 'hole' ? 1 : 0]);
  const mi = G.mines.filter(x => !x.dead).map(x => [R0(x.x), R0(x.y), x.arm > 0 ? 1 : 0, x.evo ? 1 : 0]);
  const ev = EV.splice(0);
  return { t: 's', g, p: G.players.map(plSnap), e, b, q, k, z, m: mi, ev };
}

export function netTick(rdt) {
  if (!netOpen()) return;
  G.netT -= rdt;
  if (G.netT > 0) return;
  G.netT = 0.05;
  netSend(snap());
}

/* ---------- Invité : réception et affichage ---------- */

export function guestStart(mode) {
  Sfx.init();
  Sfx.resume();
  setME(1);
  resetLevelView();
  const M = MODES[mode] || MODES.endless;
  setG({
    guest: true,
    mode,
    M,
    state: 'play',
    t: 0,
    wave: 1,
    waveT: 0,
    waveDur: M.dur,
    isBoss: false,
    boss: null,
    kills: 0,
    combo: 0,
    level: 1,
    xp: 0,
    xpNext: xpFor(1),
    enemies: [],
    bullets: [],
    ebullets: [],
    pickups: [],
    zones: [],
    mines: [],
    parts: [],
    texts: [],
    fx: [],
    flashes: [],
    decals: [],
    players: [],
    cam: { x: 0, y: 0 },
    shake: 0,
    hurtFlash: 0,
    whiteFlash: 0,
    snapAt: 0,
    snapDt: 50,
    sendT: 0,
    started: false,
  });
  setP(null);
  save.runs++;
  persist();
  show(null);
  $('#hud').hidden = false;
  $('#toasts').innerHTML = '';
  resetHud();
}

export function syncList(old, arr, make, set) {
  const map = new Map();
  for (const o of old) map.set(o.id, o);
  const out = [];
  for (const a of arr) {
    let o = map.get(a[0]);
    const fresh = !o;
    if (fresh) o = make(a);
    const x = a[2],
      y = a[3];
    if (fresh) {
      o.x = o.px = o.tx = x;
      o.y = o.py = o.ty = y;
    } else {
      o.px = o.x;
      o.py = o.y;
      o.tx = x;
      o.ty = y;
    }
    set(o, a);
    out.push(o);
  }
  return out;
}

export function applySnap(m) {
  if (!G || !G.guest) return;
  const now = performance.now();
  if (G.snapAt) G.snapDt = clamp(G.snapDt * 0.8 + (now - G.snapAt) * 0.2, 30, 200);
  G.snapAt = now;
  const g = m.g,
    prev = G.state;
  [G.state, G.wave, G.waveT, G.waveDur] = g;
  G.isBoss = !!g[4];
  G.boss = G.isBoss ? { hp: g[5], maxHp: 1 } : null;
  G.kills = g[6];
  G.combo = g[7];
  G.level = g[8];
  G.xp = g[9];
  G.xpNext = g[10];
  m.p.forEach((s, i) => {
    let o = G.players[i];
    if (!o)
      o = G.players[i] = {
        i,
        col: PCOLS[i],
        r: 14,
        vx: 0,
        vy: 0,
        step: 0,
        x: s.x,
        y: s.y,
        px: s.x,
        py: s.y,
        tx: s.x,
        ty: s.y,
        weapons: [],
        passives: {},
      };
    o.aim = s.a;
    o.hp = s.hp;
    o.maxHp = s.mh;
    o.inv = s.iv ? 0.3 : 0;
    o.down = !!s.dn;
    o.rev = s.rv;
    o.speed = s.sp;
    o.coins = s.c;
    o.passives = s.ps || {};
    if (i === ME) {
      if (!G.started || o.down) {
        o.x = s.x;
        o.y = s.y;
      }
    } else {
      o.px = o.x;
      o.py = o.y;
      o.tx = s.x;
      o.ty = s.y;
      o.moving = !!s.mv;
    }
    o.weapons = s.w.map(a0 => {
      const w = { id: a0[0], lvl: a0[1], evo: !!a0[2], r: a0[3] };
      const a = a0.slice(1);
      const old = (G.players[i].weapons || []).find(x => x.id === w.id);
      if (w.id === 'flamer') {
        w.ang = a[3];
        w.on = !!a[4];
        w.len = a[5];
        w.wd = a[6];
      } else if (w.id === 'cryo') w.pts = a[3];
      else if (w.id === 'aura') w.R = a[3];
      else if (w.id === 'drones') {
        w.ang = a[3];
        w.rot = a[4];
        w.n = a[5];
        w.R = a[6];
        w.br = a[7];
      } else if (w.id === 'laser') {
        w.ang = a[3];
        w.rot = a[4];
        w.n = a[5];
        w.len = a[6];
      }
      if (old && old.ang !== undefined && w.ang !== undefined) {
        let d = ((w.ang - old.ang + Math.PI * 3) % TAU) - Math.PI;
        if (Math.abs(d) < 0.6) w.ang = old.ang + d * 0.5;
      }
      return w;
    });
  });
  G.players.length = m.p.length;
  setP(G.players[ME] || G.players[0]);
  if (!G.started && P) {
    G.started = true;
    G.cam.x = P.x;
    G.cam.y = P.y;
  }
  G.enemies = syncList(
    G.enemies,
    m.e,
    a => ({ id: a[0], type: ETI[a[1]], t: rand(10), ai: {} }),
    (o, a) => {
      const T = ETYPES[o.type];
      o.ang = a[4];
      const f = a[5];
      o.elite = !!(f & 1);
      o.flash = f & 2 ? 0.05 : 0;
      o.fuse = f & 4 ? 1 : 0;
      o.frozen = f & 16 ? 1 : 0;
      o.burnT = f & 32 ? 1 : 0;
      o.r = T.r * (o.elite ? 1.5 : 1);
      o.col = T.col;
      o.hp = a[6];
      o.maxHp = 1;
      o.ai.ph = f & 8 ? 'tele' : 'x';
      o.ai.ang = a[7];
    },
  );
  G.bullets = syncList(
    G.bullets,
    m.b,
    a => ({ id: a[0], k: ['shot', 'disc', 'lob', 'rocket'][a[1]], spin: 0, rot: 0 }),
    (o, a) => {
      if (o.k === 'shot') {
        o.dx = a[4];
        o.dy = a[5];
        o.r = a[6];
        o.col = a[7];
      } else if (o.k === 'disc') {
        o.r = a[4];
        o.col = a[5];
      } else if (o.k === 'lob') {
        o.h = a[4];
      } else {
        o.a = a[4];
        o.small = !!a[5];
        o.col = a[6];
      }
    },
  );
  G.ebullets = syncList(
    G.ebullets,
    m.q.map(a => [a[0], 0, a[1], a[2], a[3], a[4]]),
    a => ({ id: a[0] }),
    (o, a) => {
      o.r = a[4];
      o.col = a[5];
    },
  );
  G.pickups = syncList(
    G.pickups,
    m.k.map(a => [a[0], a[1], a[2], a[3], a[4]]),
    a => ({ id: a[0], type: PKI[a[1]], t: rand(3) }),
    (o, a) => {
      o.v = a[4];
    },
  );
  G.zones = m.z.map(a => ({
    x: a[0],
    y: a[1],
    R: a[2],
    life: a[3],
    max: a[4],
    evo: !!a[5],
    k: a[6] ? 'hole' : 'fire',
  }));
  G.mines = m.m.map((a, i) => ({ x: a[0], y: a[1], arm: a[2], evo: !!a[3], t: G.t + i * 0.7 }));
  for (const a of m.ev) {
    const f = FXR[a[0]];
    if (f)
      try {
        f(...a.slice(1));
      } catch (e) {}
  }
  if (G.state !== prev) {
    if (G.state === 'pause') show('scr-pause');
    else if (['play', 'clear', 'dying'].includes(G.state)) {
      if (currentScreen()) show(null);
    }
    if (G.state !== 'play') clearInput();
  }
}

// Rejoue chez l'invité les effets enregistrés par l'hôte
export const FXR = {
  shake: addShake,
  burst,
  spark,
  ring,
  muzzle: muzzleAt,
  decal,
  fx: o => fxPush(o),
  flash: flashFx,
  white,
  hurt: hurtFx,
  banner,
  toast,
  text: (x, y, v, c, col) => addText(x, y, v, !!c, col),
  textfx: textFx,
  $: (k, ...a) => {
    if (k !== 'hurt' && Sfx[k]) Sfx[k](...a);
  },
};

export function guestUpdate(dt, now) {
  G.t += dt;
  const me = P;
  if (me) {
    const can = (G.state === 'play' || G.state === 'clear') && !me.down;
    if (can) {
      const [ix, iy] = inputVec();
      const tx = ix * me.speed,
        ty = iy * me.speed;
      const k = Math.min(1, dt * 14);
      me.vx += (tx - me.vx) * k;
      me.vy += (ty - me.vy) * k;
      me.x += me.vx * dt;
      me.y += me.vy * dt;
      me.moving = Math.hypot(ix, iy) > 0.1;
    } else {
      me.vx = me.vy = 0;
      me.moving = false;
    }
    if (me.moving) me.step += dt * 14;
    G.sendT -= dt;
    if (G.sendT <= 0) {
      G.sendT = 1 / 30;
      netSend({ t: 'in', x: r1(me.x), y: r1(me.y), vx: R0(me.vx), vy: R0(me.vy), m: me.moving ? 1 : 0 });
    }
    G.cam.x += (me.x - G.cam.x) * Math.min(1, dt * 9);
    G.cam.y += (me.y - G.cam.y) * Math.min(1, dt * 9);
  }
  const a = clamp((now - G.snapAt) / G.snapDt, 0, 1);
  for (const L of [G.enemies, G.bullets, G.ebullets, G.pickups])
    for (const o of L) {
      o.x = lerp(o.px, o.tx, a);
      o.y = lerp(o.py, o.ty, a);
    }
  for (const pl of G.players) {
    if (pl.i !== ME) {
      pl.x = lerp(pl.px, pl.tx, a);
      pl.y = lerp(pl.py, pl.ty, a);
      if (pl.moving) pl.step += dt * 14;
    }
    for (const w of pl.weapons) if (w.rot) w.ang += w.rot * dt;
  }
  const run = G.state === 'play' || G.state === 'clear' || G.state === 'dying';
  if (run) {
    for (const e of G.enemies) {
      e.t += dt;
      enemyFx(e, dt);
    }
    for (const k of G.pickups) k.t += dt;
    for (const pl of G.players) weaponFx(pl, dt);
    for (const b of G.bullets) {
      if (b.k === 'disc') b.spin += dt * 18;
      else if (b.k === 'lob') b.rot += dt * 12;
      else if (b.k === 'rocket') rocketTrail(b);
    }
    for (const z of G.zones) {
      z.life = Math.max(0, z.life - dt);
      zoneFx(z, dt);
    }
  }
  updateCosmetics(dt, dt);
}
