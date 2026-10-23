// Box d’armes : achat, ouverture animée, révélation.

import { Sfx } from '../audio.js';
import { BOXES, RARITY, rarBonus } from '../data/loot.js';
import { WEAPONS } from '../data/weapons.js';
import { boxArt, svg } from '../icons.js';
import { prog, request } from '../online/client.js';
import { $, currentScreen, notice } from './dom.js';
import { renderInv } from './inventory.js';
import { renderLab } from './lab.js';
import { renderMap } from './map.js';
import { renderMenu } from './menu.js';

export function renderBox() {
  $('#box-list').innerHTML = Object.entries(BOXES)
    .map(([k, B]) => {
      const n = prog.boxes[k];
      const tot = B.odds.reduce((a, b) => a + b, 0);
      return `<div class="card cut box-card" style="--c:${B.col}"><div class="card-top"><span class="tag">${n ? n + ' EN STOCK' : 'BOX'}</span></div><div class="box-art">${boxArt()}</div><div class="card-name">${B.name}</div>
   <dl class="odds">${B.odds.map((o, r) => (o ? `<dt style="--rc:${RARITY[r].col}">${RARITY[r].name}</dt><dd>${((o / tot) * 100).toFixed(o / tot < 0.01 ? 1 : 0)}%</dd>` : '')).join('')}</dl>
   <div class="inv-actions">${n ? `<button class="btn btn-gold cut" data-open="${k}">Ouvrir (${n})</button>` : ''}<button class="btn cut" data-buy="${k}" ${prog.cores < B.cost ? 'disabled' : ''}>Acheter · <span class="nk">${svg('core', 2)}${B.cost}</span></button></div></div>`;
    })
    .join('');
}

// Ouverture : la box tremble et change de couleur jusqu'à sa vraie rareté, puis l'arme apparaît
export let boTO = [];

let opening = false;

export async function openBox(k, buy) {
  if (opening) return;
  if (buy ? prog.cores < BOXES[k].cost : !(prog.boxes[k] > 0)) {
    Sfx.deny();
    return;
  }
  // le serveur tire l'arme ; la box tremble pendant ce temps
  opening = true;
  for (const t of boTO) clearTimeout(t);
  boTO = [];
  const ov = $('#box-open');
  ov.hidden = false;
  ov.dataset.k = k;
  ov.onclick = null;
  $('#bo-stage').innerHTML =
    `<div class="bo-box shake" id="bo-box" style="--gc:${BOXES[k].col}">${boxArt()}</div><div class="bo-hint">Ouverture…</div>`;
  Sfx.init();
  Sfx.unbox();
  const r = await request('box_open', { kind: k, buy });
  opening = false;
  if (!r.ok) {
    ov.hidden = true;
    notice(r.msg);
    return;
  }
  const it = r.item,
    isNew = r.isNew;
  const box = $('#bo-box');
  const steps = [];
  for (let r = 0; r <= it.r; r++) steps.push(r);
  const dt = Math.max(260, 1100 / steps.length);
  steps.forEach((r, i) =>
    boTO.push(
      setTimeout(
        () => {
          box.style.setProperty('--gc', RARITY[r].col);
          Sfx.click();
        },
        300 + i * dt,
      ),
    ),
  );
  boTO.push(
    setTimeout(
      () => {
        box.classList.remove('shake');
        box.classList.add('pop');
      },
      400 + steps.length * dt,
    ),
  );
  boTO.push(setTimeout(() => showReveal(it, isNew), 700 + steps.length * dt));
  ov.onclick = e => {
    if (e.target.closest('button')) return;
    if ($('#bo-box') && !$('.bo-card')) {
      for (const t of boTO) clearTimeout(t);
      showReveal(it, isNew);
    }
  };
}

export function showReveal(it, isNew, title) {
  const ov = $('#box-open');
  ov.hidden = false;
  const d = WEAPONS[it.id],
    R = RARITY[it.r];
  const k = ov.dataset.k || 'std';
  const same = prog.inv.filter(x => x.id === it.id && x.r === it.r).length;
  const again = title
    ? ''
    : prog.boxes[k] > 0
      ? `<button class="btn btn-gold cut" data-again="open">Ouvrir une autre (${prog.boxes[k]})</button>`
      : prog.cores >= BOXES[k].cost
        ? `<button class="btn btn-gold cut" data-again="buy">Racheter · ${svg('core', 2)}${BOXES[k].cost} noyaux</button>`
        : '';
  $('#bo-stage').innerHTML =
    `${title ? `<div class="bo-new">${title}</div>` : isNew ? '<div class="bo-new">NOUVELLE ARME !</div>' : ''}
  <div class="bo-card" style="--rc:${R.col}"><div class="card cut inv-card" style="--c:${d.col};--rc:${R.col}"><div class="card-top"><span class="ico">${svg(it.id)}</span><span class="tag" style="background:${R.col}">${R.name.toUpperCase()}</span></div>
  <div class="card-name">${d.name}</div><p class="card-desc">${d.up[0]}</p><p class="card-hint">${rarBonus(it.r)}</p>${same >= 3 && it.r < 4 ? `<p class="card-hint">Tu en as ${same} : fusion possible dans l’inventaire !</p>` : ''}</div></div>
  <div class="bo-btns">${again}<button class="btn cut" data-again="equip">Équiper</button><button class="btn cut" data-again="close">Continuer</button></div>`;
  Sfx.reveal(it.r);
  ov.onclick = e => {
    const b = e.target.closest('[data-again]');
    if (!b) return;
    const a = b.dataset.again;
    if (a === 'open') openBox(k, false);
    else if (a === 'buy') openBox(k, true);
    else {
      if (a === 'equip') request('equip', { u: it.u });
      ov.hidden = true;
      refreshMeta();
    }
  };
}

export function refreshMeta() {
  const c = currentScreen();
  if (c === 'scr-lab') renderLab();
  else if (c === 'scr-inv') renderInv();
  else if (c === 'scr-menu') renderMenu();
  else if (c === 'scr-map') renderMap();
}

export function initBoxes() {
  $('#box-list').addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o) {
      openBox(o.dataset.open, false);
      return;
    }
    const b = e.target.closest('[data-buy]');
    if (b && !b.disabled) openBox(b.dataset.buy, true);
  });
}
