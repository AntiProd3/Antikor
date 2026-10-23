// Écrans de montée de niveau et de boutique (cartes à choisir).

import { Sfx } from '../audio.js';
import { RARITY } from '../data/loot.js';
import { PASSIVES, PCOL } from '../data/passives.js';
import { WEAPONS } from '../data/weapons.js';
import { svg } from '../icons.js';
import { G, ME } from '../sim/state.js';
import { levelData, shopData } from '../sim/views.js';
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
  }
}

export function toastFor(pl, a, b, c) {
  if (pl.i === ME) toastRaw(a, b, c);
}

export function shakeCard(idx) {
  const card = idx == null ? null : $('#shop-cards').children[idx];
  if (card) {
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  }
}

// Ré-affiche l'écran de niveau ou de boutique du joueur local (en duo, c'est le serveur qui envoie ces données)
export function refreshViews(only) {
  const pl = G.players[ME];
  if (only && pl !== only) return;
  if (G.state === 'level') showLevel(levelData(pl));
  else if (G.state === 'shop') showShop(shopData(pl));
}

export let lastRid = -1,
  waitTO = 0;

export function resetLevelView() {
  lastRid = -1;
}

// v = levelData() (js/sim/views.js)
export function showLevel(v) {
  $('#lv-title').textContent = 'NIVEAU ' + v.level;
  $('#lv-more').textContent = v.more > 0 ? `+${v.more} en attente` : '';
  const el = $('#lv-cards');
  el.innerHTML = v.wait
    ? '<p class="wait-msg">Ton partenaire choisit son amélioration…</p>'
    : v.cards.map((c, i) => cardHTML(c, i, `<kbd>${i + 1}</kbd>`)).join('');
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

// v = shopData() (js/sim/views.js)
export function showShop(v) {
  $('#shop-sub').textContent = `Vague ${v.wave} terminée · PV restaurés de 30%` + (v.duo ? ' · ' + v.name : '');
  $('#shop-wallet').innerHTML =
    svg('gold', 2) +
    `<span class="num">${v.coins}</span><span class="cur-lbl" style="align-self:flex-end;margin-bottom:5px">pièces · cette partie</span>`;
  $('#shop-cards').innerHTML = v.offers
    .map((s, idx) => {
      const extra = `<div class="price-row"><span class="price ${!s.sold && s.price > v.coins ? 'poor' : ''}">${s.sold ? 'ACHETÉ' : svg('gold', 2) + s.price}</span>${s.sold ? '' : `<span class="lockbtn ${s.locked ? 'on' : ''}" data-lock="${idx}" role="button" aria-label="Garder pour la prochaine boutique" title="Garder pour la prochaine boutique">${svg('lock')}</span>`}</div>`;
      return cardHTML(s.info, idx, extra).replace(
        'class="card cut',
        'class="card cut' + (s.sold ? ' sold' : '') + (!s.ok && !s.sold ? ' na' : ''),
      );
    })
    .join('');
  const rb = $('#btn-reroll');
  rb.innerHTML =
    v.free > 0
      ? `Relancer · gratuit (${v.free}) <kbd>R</kbd>`
      : `Relancer · ${svg('gold', 2)}${v.rerollCost} <kbd>R</kbd>`;
  rb.disabled = (v.free <= 0 && v.coins < v.rerollCost) || v.ready;
  const nx = v.next;
  const nb = $('#btn-next');
  nb.innerHTML = v.ready
    ? 'En attente du partenaire…'
    : `${nx.boss ? (nx.final ? 'Boss final' : 'Vague ' + nx.wave + ' · Boss') : 'Vague ' + nx.wave}${v.duo ? ' · Prêt' : ''} → <kbd>Entrée</kbd>`;
  nb.disabled = v.ready;
  $('#shop-weapons').innerHTML =
    v.weapons
      .map(w => {
        const d = WEAPONS[w.id];
        const pn = PASSIVES[d.evoWith].name;
        const has = w.hasEvoItem;
        const em = w.evo
          ? `<em class="ok">Évolué</em>`
          : `<em class="${w.lvl >= 5 && has ? 'ok' : ''}">Évo ${d.evoName} : niv 5${w.lvl >= 5 ? ' ✓' : ''} + ${pn}${has ? ' ✓' : ''}</em>`;
        return `<div class="loadrow"><span class="ico" style="--c:${w.evo ? '#ffd23e' : d.col}">${svg(w.id)}</span><div><b>${w.evo ? d.evoName : d.name} <span class="rar" style="--rc:${RARITY[w.r].col}">${RARITY[w.r].name}</span></b>${em}</div>${pips({ from: w.lvl, to: w.lvl, max: 5 }).replace('class="pips"', `class="pips" style="--c:${d.col}"`)}</div>`;
      })
      .join('') +
    (v.weapons.length < v.slots
      ? `<p class="empty">${v.slots - v.weapons.length} emplacement(s) d’arme libre(s)</p>`
      : `<p class="empty">${v.slots} emplacement${v.slots > 1 ? 's' : ''} d’arme · plus au labo (Arsenal)</p>`);
  $('#shop-passives').innerHTML = v.passives.length
    ? v.passives
        .map(([id, lv]) => {
          const d = PASSIVES[id];
          return `<div class="loadrow"><span class="ico" style="--c:${PCOL}">${svg(id)}</span><div><b>${d.name}</b><em>${d.desc}</em></div>${pips({ from: lv, to: lv, max: d.max }).replace('class="pips"', `class="pips" style="--c:${PCOL}"`)}</div>`;
        })
        .join('')
    : '<p class="empty">Aucun équipement. Il s’achète ici ou se gagne en montant de niveau.</p>';
  $('#shop-stats').innerHTML = v.stats.map(([k, x]) => `<dt>${k}</dt><dd>${x}</dd>`).join('');
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
