// Affichage tête haute pendant la partie (PV, XP, vague, boss, armes).

import { BOSSV } from '../data/enemies.js';
import { RARITY } from '../data/loot.js';
import { PCOL } from '../data/passives.js';
import { WEAPONS } from '../data/weapons.js';
import { svg } from '../icons.js';
import { plName } from '../sim/player.js';
import { G, ME, P } from '../sim/state.js';
import { $ } from './dom.js';
import { clamp, fmtTime } from '../util.js';

export let hudCache = {};

export function resetHud() {
  hudCache = {};
}

export function hs(id, v, prop = 'textContent') {
  if (hudCache[id] === v) return;
  hudCache[id] = v;
  const el = document.getElementById(id);
  if (prop === 'sx') el.style.transform = `scaleX(${v})`;
  else el[prop] = v;
}

export function updateHUD() {
  if (!G || !P) return;
  hs('h-hpf', clamp(P.hp / P.maxHp, 0, 1).toFixed(3), 'sx');
  hs('h-hp', P.down ? 'À TERRE' : `${Math.ceil(Math.max(0, P.hp))} / ${P.maxHp}`);
  hs('h-xp', clamp(G.xp / G.xpNext, 0, 1).toFixed(3), 'sx');
  hs('h-lvl', 'NIV ' + G.level);
  hs('h-coins', String(Math.floor(P.coins)));
  hs('h-kills', String(G.kills));
  hs(
    'h-wave',
    (G.M.career ? 'NIV ' + G.M.level + ' · ' : '') + 'VAGUE ' + G.wave + (G.M.endless ? '' : ' / ' + G.M.waves),
  );
  const tleft = G.waveDur - G.waveT;
  hs('h-timer', G.isBoss ? 'BOSS' : fmtTime(tleft));
  const hot = !G.isBoss && tleft <= 5;
  if (hudCache.hot !== hot) {
    hudCache.hot = hot;
    $('#h-timer').classList.toggle('hot', hot);
  }
  if (G.isBoss && G.boss) hs('h-bossf', (Math.max(0, G.boss.hp) / G.boss.maxHp).toFixed(3), 'sx');
  hs('h-boss', !G.isBoss, 'hidden');
  // nom et couleur du boss sous sa barre de vie
  const bv = G.isBoss && G.boss && G.boss.bv;
  if (bv && hudCache.bv !== bv) {
    hudCache.bv = bv;
    const V = BOSSV[bv];
    const bn = $('#h-bossn');
    bn.textContent = V.name.toUpperCase();
    bn.style.color = V.col;
    $('#h-bossf').style.background = `linear-gradient(90deg,${V.col},#ffd23e)`;
  }
  const cb = G.combo >= 10 ? '×' + G.combo : '';
  if (hudCache.combo !== cb) {
    const el = $('#h-combo');
    el.textContent = cb;
    if (cb && G.combo % 10 === 0) {
      el.classList.add('pop');
      setTimeout(() => el.classList.remove('pop'), 90);
    }
    hudCache.combo = cb;
  }
  // partenaire
  const mate = G.players.length > 1 ? G.players[1 - ME] : null;
  hs('h-mate', !mate, 'hidden');
  if (mate) {
    hs('h-matel', plName(mate));
    hs('h-matef', clamp(mate.hp / mate.maxHp, 0, 1).toFixed(3), 'sx');
    hs('h-mates', mate.down ? 'À TERRE' : '');
    const mc = 'mate' + (mate.i === 0 ? ' p1' : '');
    if (hudCache.mc !== mc) {
      hudCache.mc = mc;
      $('#h-mate').className = mc;
    }
  }
  const lk =
    P.weapons.map(w => w.id + w.lvl + (w.r || 0) + (w.evo ? '*' : '')).join() + '|' + Object.entries(P.passives).join();
  if (hudCache.lk !== lk) {
    hudCache.lk = lk;
    $('#h-w').innerHTML = P.weapons
      .map(w => {
        const d = WEAPONS[w.id];
        return `<span class="slot ${w.evo ? 'evo' : ''}" style="--c:${w.evo ? '#ffd23e' : d.col};--rc:${RARITY[w.r || 0].col}">${svg(w.id)}<i>${w.evo ? '★' : w.lvl}</i></span>`;
      })
      .join('');
    $('#h-p').innerHTML = Object.keys(P.passives)
      .map(id => `<span class="slot p" style="--c:${PCOL}">${svg(id)}<i>${P.passives[id]}</i></span>`)
      .join('');
  }
}

export function initHud() {
  document.querySelector('.hud-coins').insertAdjacentHTML('afterbegin', svg('gold', 2));
}
