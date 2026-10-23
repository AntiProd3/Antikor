// Box d’armes : achat, ouverture animée, révélation.

import { Sfx } from '../audio.js';
import { BOXES, RARITY, rarBonus } from '../data/loot.js';
import { WEAPONS } from '../data/weapons.js';
import { boxArt, svg } from '../icons.js';
import { ownedMap } from '../meta.js';
import { persist, save } from '../save.js';
import { $, currentScreen } from './dom.js';
import { renderInv } from './inventory.js';
import { renderLab } from './lab.js';
import { renderMenu } from './menu.js';
import { pick } from '../util.js';

export function renderBox() {
  $('#box-list').innerHTML = Object.entries(BOXES)
    .map(([k, B]) => {
      const n = save.boxes[k];
      const tot = B.odds.reduce((a, b) => a + b, 0);
      return `<div class="card cut box-card" style="--c:${B.col}"><div class="card-top"><span class="tag">${n ? n + ' EN STOCK' : 'BOX'}</span></div><div class="box-art">${boxArt()}</div><div class="card-name">${B.name}</div>
   <dl class="odds">${B.odds.map((o, r) => (o ? `<dt style="--rc:${RARITY[r].col}">${RARITY[r].name}</dt><dd>${((o / tot) * 100).toFixed(o / tot < 0.01 ? 1 : 0)}%</dd>` : '')).join('')}</dl>
   <div class="inv-actions">${n ? `<button class="btn btn-gold cut" data-open="${k}">Ouvrir (${n})</button>` : ''}<button class="btn cut" data-buy="${k}" ${save.cores < B.cost ? 'disabled' : ''}>Acheter · <span class="nk">${svg('core', 2)}${B.cost}</span></button></div></div>`;
    })
    .join('');
}

export function rollBox(k) {
  const B = BOXES[k];
  let x = Math.random() * B.odds.reduce((a, b) => a + b, 0),
    r = 0;
  for (; r < 4; r++) {
    x -= B.odds[r];
    if (x < 0) break;
  }
  return { id: pick(Object.keys(WEAPONS)), r };
}

// Ouverture : la box tremble et change de couleur jusqu'à sa vraie rareté, puis l'arme apparaît
export let boTO = [];

export function openBox(k, buy) {
  if (buy) {
    if (save.cores < BOXES[k].cost) {
      Sfx.deny();
      return;
    }
    save.cores -= BOXES[k].cost;
  } else {
    if (save.boxes[k] <= 0) return;
    save.boxes[k]--;
  }
  const res = rollBox(k);
  const isNew = ownedMap()[res.id] === undefined;
  const it = { u: save.uid++, id: res.id, r: res.r };
  save.inv.push(it);
  persist();
  for (const t of boTO) clearTimeout(t);
  boTO = [];
  const ov = $('#box-open');
  ov.hidden = false;
  ov.dataset.k = k;
  $('#bo-stage').innerHTML =
    `<div class="bo-box shake" id="bo-box" style="--gc:${BOXES[k].col}">${boxArt()}</div><div class="bo-hint">Ouverture…</div>`;
  Sfx.init();
  Sfx.unbox();
  const box = $('#bo-box');
  const steps = [];
  for (let r = 0; r <= res.r; r++) steps.push(r);
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
  const same = save.inv.filter(x => x.id === it.id && x.r === it.r).length;
  const again = title
    ? ''
    : save.boxes[k] > 0
      ? `<button class="btn btn-gold cut" data-again="open">Ouvrir une autre (${save.boxes[k]})</button>`
      : save.cores >= BOXES[k].cost
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
      if (a === 'equip') {
        save.equip = it.u;
        persist();
      }
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
