// Menu principal.

import { Sfx } from '../audio.js';
import { CAREER_LEVELS } from '../data/career.js';
import { RARITY, rarBonus } from '../data/loot.js';
import { WEAPONS } from '../data/weapons.js';
import { boxArt, svg } from '../icons.js';
import { equipped, ownedMap } from '../meta.js';
import { account, logout, prog } from '../online/client.js';
import { persist, save } from '../save.js';
import { $, show, updateMuteLabels } from './dom.js';
import { playPressed } from './game.js';
import { renderInv } from './inventory.js';
import { renderLab } from './lab.js';
import { showLogin } from './login.js';

export function renderMenu() {
  // le duo reviendra par le serveur (phase 3) ; en attendant, seul le solo est jouable
  $('#players-seg').innerHTML = [
    ['solo', 'Solo', 'Sur cet appareil', true],
    ['duo', 'Duo en ligne', 'Bientôt, via le serveur', false],
  ]
    .map(
      ([id, n, sub, ok]) =>
        `<button class="cut ${ok ? 'on' : ''}" data-players="${id}" ${ok ? '' : 'disabled'}><b>${n}</b><span>${sub}</span></button>`,
    )
    .join('');
  const totStars = Object.values(prog.career.stars).reduce((a, b) => a + b, 0);
  $('#mode-seg').innerHTML = [
    ['career', 'Carrière', `Niveau ${prog.career.max} / ${CAREER_LEVELS} · ${totStars}★`],
    ['endless', 'Infini', 'Vagues sans fin'],
  ]
    .map(
      ([id, n, sub]) =>
        `<button class="cut ${save.mode === id ? 'on' : ''}" data-mode="${id}"><b>${n}</b><span>${sub}</span></button>`,
    )
    .join('');
  renderEquip();
  const done = Object.keys(prog.career.stars).length;
  $('#menu-records').innerHTML =
    `<dt>Carrière</dt><dd>${done} / ${CAREER_LEVELS} niveaux · ${totStars} / ${CAREER_LEVELS * 3}★</dd><dt>Infini</dt><dd>${prog.best.endless ? 'vague ' + prog.best.endless : '—'}</dd><dt>Parties · victoires</dt><dd>${prog.runs} · ${prog.wins}</dd><dt>Germes éliminés</dt><dd>${(prog.totalKills || 0).toLocaleString('fr-FR')}</dd>`;
  $('#acc-name').textContent = account.name || '';
  updateMuteLabels();
}

export function renderEquip() {
  const it = equipped();
  const d = WEAPONS[it.id],
    R = RARITY[it.r];
  const nb = prog.boxes.std + prog.boxes.prem;
  $('#equip-card').innerHTML =
    `<div class="equip-card cut" data-tip="w:${it.id}:${it.r}" style="--c:${d.col};--rc:${R.col}"><span class="ico">${svg(it.id)}</span><div style="min-width:0"><b>${d.name}</b><span class="rar" style="--rc:${R.col}">${R.name}</span><small>${rarBonus(it.r)} · ${Object.keys(ownedMap()).length}/${Object.keys(WEAPONS).length} armes</small></div></div>`;
  const owned = Object.keys(ownedMap()).length,
    all = Object.keys(WEAPONS).length;
  $('#btn-inv').innerHTML = `${svg('arsenal')}<span>Inventaire</span><small>${owned}/${all} armes</small>`;
  const L = $('#btn-lab');
  L.classList.toggle('hot', nb > 0);
  L.innerHTML = `<span class="box-art">${boxArt()}</span><span class="lab-cta-txt"><b>LABO</b><small>${nb ? 'Des box t’attendent !' : 'Box d’armes · talents'}</small></span>
  <span class="lab-cta-side"><span class="lab-cta-cores" data-tip="c:core">${svg('core', 2)}${prog.cores}<span class="cur-lbl">noyaux</span></span>${nb ? `<span class="badge">${nb} box à ouvrir</span>` : '<span class="arrow">→</span>'}</span>`;
}

export function initMenu() {
  $('#mode-seg').addEventListener('click', e => {
    const b = e.target.closest('[data-mode]');
    if (!b || b.disabled) return;
    save.mode = b.dataset.mode;
    persist();
    Sfx.init();
    Sfx.click();
    renderMenu();
  });
  $('#btn-play').addEventListener('click', playPressed);
  $('#btn-logout').addEventListener('click', async () => {
    Sfx.init();
    Sfx.click();
    await logout();
    showLogin();
  });
  const openInv = () => {
    Sfx.init();
    Sfx.click();
    renderInv();
    show('scr-inv');
  };
  // les box s'ouvrent depuis le labo (ou l'inventaire) ; « Retour » ramène à l'écran d'origine
  const openBoxes = () => {
    Sfx.init();
    Sfx.click();
    renderLab();
    show('scr-lab');
  };
  $('#btn-inv').addEventListener('click', openInv);
  $('#equip-card').addEventListener('click', openInv);
  $('#btn-inv-box').addEventListener('click', openBoxes);
  $('#btn-inv-back').addEventListener('click', () => {
    renderMenu();
    show('scr-menu');
  });
}
