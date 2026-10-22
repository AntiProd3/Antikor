// Menu principal.

import { Sfx } from '../audio.js';
import { DUO_ENABLED } from '../config.js';
import { CAREER_LEVELS } from '../data/career.js';
import { RARITY, rarBonus } from '../data/loot.js';
import { WEAPONS } from '../data/weapons.js';
import { boxArt, svg } from '../icons.js';
import { equipped, ownedMap } from '../meta.js';
import { NET, netOpen, netReset, netSend, sendHello } from '../net/net.js';
import { persist, save } from '../save.js';
import { $, show, updateMuteLabels } from './dom.js';
import { renderDuo } from './duo.js';
import { playPressed } from './game.js';
import { renderInv } from './inventory.js';
import { renderLab } from './lab.js';

export function renderMenu() {
  const duo = save.players === 'duo',
    guest = duo && NET.role === 'guest';
  $('#players-seg').innerHTML = [
    ['solo', 'Solo', 'Sur cet appareil'],
    ['duo', 'Duo en ligne', DUO_ENABLED ? 'Chacun sur son appareil' : 'Bientôt de retour'],
  ]
    .map(
      ([id, n, sub]) =>
        `<button class="cut ${save.players === id ? 'on' : ''}" data-players="${id}" ${id === 'duo' && !DUO_ENABLED ? 'disabled' : ''}><b>${n}</b><span>${sub}</span></button>`,
    )
    .join('');
  const mode = guest && NET.hostMode ? NET.hostMode : save.mode;
  const totStars = Object.values(save.career.stars).reduce((a, b) => a + b, 0);
  $('#mode-seg').innerHTML = [
    ['career', 'Carrière', `Niveau ${save.career.max} / ${CAREER_LEVELS} · ${totStars}★`],
    ['endless', 'Infini', 'Vagues sans fin'],
  ]
    .map(
      ([id, n, sub]) =>
        `<button class="cut ${mode === id ? 'on' : ''}" data-mode="${id}" ${guest ? 'disabled' : ''}><b>${n}</b><span>${sub}</span></button>`,
    )
    .join('');
  renderEquip();
  const done = Object.keys(save.career.stars).length;
  $('#menu-records').innerHTML =
    `<dt>Carrière</dt><dd>${done} / ${CAREER_LEVELS} niveaux · ${totStars} / ${CAREER_LEVELS * 3}★</dd><dt>Infini</dt><dd>${save.best.endless ? 'vague ' + save.best.endless : '—'}</dd><dt>Parties · victoires</dt><dd>${save.runs} · ${save.wins}</dd><dt>Germes éliminés</dt><dd>${(save.totalKills || 0).toLocaleString('fr-FR')}</dd>`;
  renderDuo();
  const pb = $('#btn-play');
  if (!duo) {
    pb.disabled = false;
    pb.textContent = 'JOUER';
  } else if (NET.role === 'host') {
    const ok = netOpen() && !!NET.peerInfo;
    pb.disabled = !ok;
    pb.textContent = ok ? 'JOUER À 2' : 'JOUER';
  } else {
    pb.disabled = true;
    pb.textContent = guest && netOpen() ? 'L’HÔTE LANCE' : 'JOUER';
  }
  // tenir l'autre joueur au courant de nos choix
  if (NET.role === 'host' && netOpen() && NET.sentMode !== save.mode) {
    NET.sentMode = save.mode;
    netSend({ t: 'lobby', mode: save.mode });
  }
  if (NET.role === 'guest' && netOpen()) sendHello();
  updateMuteLabels();
}

export function renderEquip() {
  const it = equipped();
  const d = WEAPONS[it.id],
    R = RARITY[it.r];
  const nb = save.boxes.std + save.boxes.prem;
  $('#equip-card').innerHTML =
    `<div class="equip-card cut" data-tip="w:${it.id}:${it.r}" style="--c:${d.col};--rc:${R.col}"><span class="ico">${svg(it.id)}</span><div style="min-width:0"><b>${d.name}</b><span class="rar" style="--rc:${R.col}">${R.name}</span><small>${rarBonus(it.r)} · ${Object.keys(ownedMap()).length}/${Object.keys(WEAPONS).length} armes</small></div></div>`;
  const owned = Object.keys(ownedMap()).length,
    all = Object.keys(WEAPONS).length;
  $('#btn-inv').innerHTML = `${svg('arsenal')}<span>Inventaire</span><small>${owned}/${all} armes</small>`;
  const L = $('#btn-lab');
  L.classList.toggle('hot', nb > 0);
  L.innerHTML = `<span class="box-art">${boxArt()}</span><span class="lab-cta-txt"><b>LABO</b><small>${nb ? 'Des box t’attendent !' : 'Box d’armes · talents'}</small></span>
  <span class="lab-cta-side"><span class="lab-cta-cores" data-tip="c:core">${svg('core', 2)}${save.cores}<span class="cur-lbl">noyaux</span></span>${nb ? `<span class="badge">${nb} box à ouvrir</span>` : '<span class="arrow">→</span>'}</span>`;
}

export function initMenu() {
  $('#players-seg').addEventListener('click', e => {
    const b = e.target.closest('[data-players]');
    if (!b || b.disabled) return;
    const v = b.dataset.players;
    Sfx.init();
    Sfx.click();
    if (v === save.players) return;
    if (v === 'solo') netReset();
    save.players = v;
    persist();
    renderMenu();
  });
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
