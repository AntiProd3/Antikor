// Écrans de montée de niveau et de boutique (cartes à choisir).

import { Sfx } from '../audio.js';
import { RARITY } from '../data/loot.js';
import { PASSIVES, PCOL } from '../data/passives.js';
import { WEAPONS } from '../data/weapons.js';
import { svg } from '../icons.js';
import { netSend } from '../net/net.js';
import { optInfo, priceOf, rerollCost, validOpt } from '../sim/options.js';
import { plName } from '../sim/player.js';
import { G, ME, P, withP } from '../sim/state.js';
import { isBossWave, isFinal } from '../sim/waves.js';
import { $, currentScreen, show, toastRaw } from './dom.js';
import { act } from './game.js';

export function pips(i) {
  if (!i.max) return '';
  let s = '<div class="pips">';
  for (let k = 0; k < i.max; k++) s += `<span class="pip ${k < i.from ? 'on' : k < i.to ? 'nw' : ''}"></span>`;
  return s + '</div>';
}

export function cardHTML(i, idx, extra = '') {
  return `<button class="card cut ${i.evo ? 'evo' : ''}" style="--c:${i.col}" data-i="${idx}">
 <div class="card-top"><span class="ico">${svg(i.icon)}</span><span class="tag">${i.tag}</span></div>
 <div class="card-name">${i.name}</div>${i.rar != null ? `<span class="rar" style="--rc:${RARITY[i.rar].col}">${RARITY[i.rar].name}</span>` : ''}${pips(i)}<p class="card-desc">${i.desc}</p>${i.hint ? `<p class="card-hint">${i.hint}</p>` : ''}${extra}</button>`;
}

// Son / toast destinés à un seul joueur
export function say(pl, n, arg) {
  if (pl.i === ME) {
    if (Sfx[n]) Sfx[n]();
    if (n === 'deny') shakeCard(arg);
  } else netSend({ t: 'say', n, arg });
}

export function toastFor(pl, a, b, c) {
  if (pl.i === ME) toastRaw(a, b, c);
  else netSend({ t: 'toast', a: [a, b, c] });
}

export function shakeCard(idx) {
  const card = idx == null ? null : $('#shop-cards').children[idx];
  if (card) {
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  }
}

// Ré-affiche l'écran de niveau ou de boutique de chaque joueur (le sien en local, celui de l'invité par le réseau)
export function refreshViews(only) {
  for (const pl of G.players) {
    if (only && pl !== only) continue;
    const k = G.state === 'level' ? 'level' : G.state === 'shop' ? 'shop' : null;
    if (!k) return;
    const v = k === 'level' ? levelView(pl) : shopView(pl);
    if (pl.i === ME) (k === 'level' ? applyLevelView : applyShopView)(v);
    else netSend({ t: 'view', k, v });
  }
}

export function levelView(pl) {
  return withP(pl, () => {
    if (pl.pend <= 0)
      return {
        title: 'NIVEAU ' + G.level,
        more: '',
        wait: 1,
        rid: pl.rid,
        cards: '<p class="wait-msg">Ton partenaire choisit son amélioration…</p>',
      };
    return {
      title: 'NIVEAU ' + (G.level - pl.pend + 1),
      more: pl.pend > 1 ? `+${pl.pend - 1} en attente` : '',
      rid: pl.rid,
      cards: pl.curOpts.map((o, i) => cardHTML(optInfo(o), i, `<kbd>${i + 1}</kbd>`)).join(''),
    };
  });
}

export let lastRid = -1,
  waitTO = 0;

export function resetLevelView() {
  lastRid = -1;
}

export function applyLevelView(v) {
  $('#lv-title').textContent = v.title;
  $('#lv-more').textContent = v.more;
  const el = $('#lv-cards');
  el.innerHTML = v.cards;
  if (!v.wait && v.rid !== lastRid) {
    el.classList.add('wait');
    clearTimeout(waitTO);
    waitTO = setTimeout(() => el.classList.remove('wait'), 420);
  }
  lastRid = v.rid;
  show('scr-level');
}

export function chooseLevel(i) {
  if (!G || currentScreen() !== 'scr-level' || $('#lv-cards').classList.contains('wait')) return;
  act('pick', i);
}

export function shopView(pl) {
  return withP(pl, () => {
    const coins = Math.floor(P.coins);
    const sh = P.shop;
    const duo = G.players.length > 1;
    const v = {};
    v.sub = `Vague ${G.wave} terminée · PV restaurés de 30%` + (duo ? ' · ' + plName(P) : '');
    v.wallet =
      svg('gold', 2) +
      `<span class="num">${coins}</span><span class="cur-lbl" style="align-self:flex-end;margin-bottom:5px">pièces · cette partie</span>`;
    v.cards = sh.offers
      .map((s, idx) => {
        const i = optInfo(s.o);
        const pr = priceOf(s.o);
        const ok = validOpt(s.o);
        const extra = `<div class="price-row"><span class="price ${!s.sold && pr > coins ? 'poor' : ''}">${s.sold ? 'ACHETÉ' : svg('gold', 2) + pr}</span>${s.sold ? '' : `<span class="lockbtn ${s.locked ? 'on' : ''}" data-lock="${idx}" role="button" aria-label="Garder pour la prochaine boutique" title="Garder pour la prochaine boutique">${svg('lock')}</span>`}</div>`;
        return cardHTML(i, idx, extra).replace(
          'class="card cut',
          'class="card cut' + (s.sold ? ' sold' : '') + (!ok && !s.sold ? ' na' : ''),
        );
      })
      .join('');
    v.reroll =
      sh.free > 0
        ? `Relancer · gratuit (${sh.free}) <kbd>R</kbd>`
        : `Relancer · ${svg('gold', 2)}${rerollCost(P)} <kbd>R</kbd>`;
    v.rerollDis = (sh.free <= 0 && coins < rerollCost(P)) || P.ready;
    const nx = G.wave + 1;
    v.next = P.ready
      ? 'En attente du partenaire…'
      : `${isBossWave(nx) ? (isFinal(nx) ? 'Boss final' : 'Vague ' + nx + ' · Boss') : 'Vague ' + nx}${duo ? ' · Prêt' : ''} → <kbd>Entrée</kbd>`;
    v.nextDis = P.ready;
    v.weapons =
      P.weapons
        .map(w => {
          const d = WEAPONS[w.id];
          const pn = PASSIVES[d.evoWith].name;
          const has = !!P.passives[d.evoWith];
          const em = w.evo
            ? `<em class="ok">Évolué</em>`
            : `<em class="${w.lvl >= 5 && has ? 'ok' : ''}">Évo ${d.evoName} : niv 5${w.lvl >= 5 ? ' ✓' : ''} + ${pn}${has ? ' ✓' : ''}</em>`;
          return `<div class="loadrow"><span class="ico" style="--c:${w.evo ? '#ffd23e' : d.col}">${svg(w.id)}</span><div><b>${w.evo ? d.evoName : d.name} <span class="rar" style="--rc:${RARITY[w.r || 0].col}">${RARITY[w.r || 0].name}</span></b>${em}</div>${pips({ from: w.lvl, to: w.lvl, max: 5 }).replace('class="pips"', `class="pips" style="--c:${d.col}"`)}</div>`;
        })
        .join('') +
      (P.weapons.length < P.ts.slots
        ? `<p class="empty">${P.ts.slots - P.weapons.length} emplacement(s) d’arme libre(s)</p>`
        : `<p class="empty">${P.ts.slots} emplacement${P.ts.slots > 1 ? 's' : ''} d’arme · plus au labo (Arsenal)</p>`);
    const pk = Object.keys(P.passives);
    v.passives = pk.length
      ? pk
          .map(id => {
            const d = PASSIVES[id];
            return `<div class="loadrow"><span class="ico" style="--c:${PCOL}">${svg(id)}</span><div><b>${d.name}</b><em>${d.desc}</em></div>${pips({ from: P.passives[id], to: P.passives[id], max: d.max }).replace('class="pips"', `class="pips" style="--c:${PCOL}"`)}</div>`;
          })
          .join('')
      : '<p class="empty">Aucun équipement. Il s’achète ici ou se gagne en montant de niveau.</p>';
    const st = [
      ['PV', `${Math.ceil(P.hp)} / ${P.maxHp}`],
      ['Dégâts', `+${Math.round((P.dmg - 1) * 100)}%`],
      ['Recharge', `-${Math.round((1 - P.cd) * 100)}%`],
      ['Critique', `${Math.round(P.crit * 100)}% · ×${P.critMul.toFixed(2)}`],
      ['Vitesse', `${Math.round(P.speed)}`],
      ['Zone', `+${Math.round((P.area - 1) * 100)}%`],
      ['Portée', `+${Math.round((P.range - 1) * 100)}%`],
      ['Projectiles', `+${P.proj}`],
      ['Armure', `-${Math.round((1 - P.armor) * 100)}%`],
      ['Régénération', `${P.regen.toFixed(1)} PV/s`],
      ['Collecte', `${Math.round(P.magnet)}`],
    ];
    v.stats = st.map(([k, x]) => `<dt>${k}</dt><dd>${x}</dd>`).join('');
    return v;
  });
}

export function applyShopView(v) {
  $('#shop-sub').textContent = v.sub;
  $('#shop-wallet').innerHTML = v.wallet;
  $('#shop-cards').innerHTML = v.cards;
  const rb = $('#btn-reroll');
  rb.innerHTML = v.reroll;
  rb.disabled = v.rerollDis;
  const nb = $('#btn-next');
  nb.innerHTML = v.next;
  nb.disabled = v.nextDis;
  $('#shop-weapons').innerHTML = v.weapons;
  $('#shop-passives').innerHTML = v.passives;
  $('#shop-stats').innerHTML = v.stats;
  show('scr-shop');
}

export function initCards() {
  $('#lv-cards').addEventListener('click', e => {
    const b = e.target.closest('[data-i]');
    if (b) chooseLevel(+b.dataset.i);
  });
  $('#shop-cards').addEventListener('click', e => {
    const l = e.target.closest('[data-lock]');
    if (l) {
      e.stopPropagation();
      act('lock', +l.dataset.lock);
      return;
    }
    const b = e.target.closest('[data-i]');
    if (b) act('buy', +b.dataset.i);
  });
  $('#btn-reroll').addEventListener('click', () => act('reroll'));
  $('#btn-next').addEventListener('click', () => act('ready'));
}
