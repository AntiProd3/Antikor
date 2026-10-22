// Infobulles : détails des armes, talents, box et monnaies.

import { BOXES, RARITY, rarBonus } from '../data/loot.js';
import { PASSIVES } from '../data/passives.js';
import { TALENTS, TFX, TNOTE } from '../data/talents.js';
import { WEAPONS } from '../data/weapons.js';
import { T, talentCost, talentGate } from '../meta.js';
import { $ } from './dom.js';
import { clamp } from '../util.js';

export const STAT_LBL = {
  dmg: 'Dégâts',
  cd: 'Recharge (s)',
  n: 'Nombre',
  pierce: 'Perforation',
  R: 'Rayon',
  len: 'Portée',
  ch: 'Rebonds',
  burn: 'Brûlure (toutes les 0,3 s)',
  boom: 'Explosion',
  dur: 'Durée (s)',
  fz: 'Gel après (s)',
};

export function fmtN(v) {
  return Math.abs(v - Math.round(v)) < 0.01 || v >= 20
    ? String(Math.round(v))
    : v.toFixed(v < 1 ? 2 : 1).replace('.', ',');
}

export function weaponTip(id, r) {
  const d = WEAPONS[id],
    R = RARITY[r];
  const a = d.stats(1),
    b = d.stats(5);
  const mul = k =>
    k === 'dmg' || k === 'burn' || k === 'boom' ? R.dmg : k === 'cd' ? R.cd : k === 'R' || k === 'len' ? R.area : 1;
  const rows = Object.keys(a)
    .filter(k => STAT_LBL[k])
    .map(k => `<dt>${STAT_LBL[k]}</dt><dd>${fmtN(a[k] * mul(k))} → ${fmtN(b[k] * mul(k))}</dd>`)
    .join('');
  return {
    col: R.col,
    html: `<div class="th">${d.name}</div><p class="ts">${R.name} · ${rarBonus(r)}</p><div>${d.up[0]}</div>
 <dl>${rows}</dl><div class="ts" style="margin:0">Niveau 1 → 5${R.dmg > 1 || R.cd < 1 ? ' (bonus de rareté inclus)' : ''}</div>
 <ul>${d.up
   .slice(1)
   .map((u, i) => `<li>Niv ${i + 2} : ${u}</li>`)
   .join('')}</ul>
 <p class="tn"><span class="tg">Évolution ${d.evoName}</span> : ${d.evoDesc} Il faut l’arme au niveau 5 et l’équipement ${PASSIVES[d.evoWith].name}.</p>`,
  };
}

export function tipData(key) {
  const [k, a, b] = key.split(':');
  if (k === 'w' && WEAPONS[a]) return weaponTip(a, +b || 0);
  if (k === 't') {
    const t = TALENTS.find(x => x.id === a);
    if (!t) return null;
    const l = T(t.id);
    const max = l >= t.max;
    return {
      col: t.col,
      html: `<div class="th">${t.name}</div><p class="ts">Niveau ${l} / ${t.max}</p><dl><dt>Actuellement</dt><dd>${TFX[t.id](l)}</dd>${max ? '' : `<dt>Niveau suivant</dt><dd>${TFX[t.id](l + 1)}</dd><dt>Coût</dt><dd class="tc">${talentCost(t, l)} noyaux</dd>`}${talentGate(t, l) ? `<dt>Déblocage</dt><dd>atteindre le monde ${talentGate(t, l)} en carrière</dd>` : ''}</dl><p class="tn">${TNOTE[t.id]}</p>`,
    };
  }
  if (k === 'b' && BOXES[a]) {
    const B = BOXES[a];
    const tot = B.odds.reduce((x, y) => x + y, 0);
    return {
      col: B.col,
      html: `<div class="th">${B.name}</div><div>Contient <b>1 arme au hasard</b> parmi les ${Object.keys(WEAPONS).length} du jeu.</div>
  <dl>${B.odds.map((o, r) => (o ? `<dt style="color:${RARITY[r].col}">${RARITY[r].name}</dt><dd>${((o / tot) * 100).toFixed(o / tot < 0.01 ? 1 : 0)}% · ${rarBonus(r)}</dd>` : '')).join('')}</dl>
  <p class="tn">Doublons : 3 armes identiques de même rareté fusionnent en une rareté supérieure (inventaire). Les boss lâchent aussi des box${a === 'prem' ? ' (la Box Mutante vient du boss final)' : ''}.</p>`,
    };
  }
  if (k === 'c' && a === 'core')
    return {
      col: '#c77dff',
      html: `<div class="th">Noyaux</div><div>Monnaie <b class="tc">permanente</b>, gagnée à la fin de chaque partie selon les vagues tenues, les éliminations et les boss.</div><p class="tn">Se dépensent au labo : box d’armes et talents. Une partie abandonnée ne rapporte aucun noyau.</p>`,
    };
  if (k === 'c' && a === 'coin')
    return {
      col: '#ffd23e',
      html: `<div class="th">Pièces</div><div>Monnaie <b class="tg">de la partie en cours</b>, ramassée sur les ennemis.</div><p class="tn">Elles servent dans cette boutique entre les vagues, puis disparaissent à la fin de la partie. Rien à voir avec les noyaux (violets), qui eux se gardent.</p>`,
    };
  return null;
}

export let tipEl = null,
  tipVia = '';

export function showTip(el, via = '') {
  tipVia = via;
  const key = el.dataset.tip;
  const d = key && tipData(key);
  if (!d) return;
  const t = $('#tip');
  t.innerHTML = d.html;
  t.style.setProperty('--tc', d.col);
  t.hidden = false;
  tipEl = el;
  const r = el.getBoundingClientRect(),
    w = t.offsetWidth,
    h = t.offsetHeight;
  let x = r.left + r.width / 2 - w / 2,
    y = r.bottom + 8;
  if (y + h > innerHeight - 8) y = r.top - h - 8;
  if (y < 8) y = Math.max(8, Math.min(innerHeight - h - 8, r.top + 12));
  x = clamp(x, 12, innerWidth - w - 12);
  t.style.left = x + 'px';
  t.style.top = y + 'px';
}

export function hideTip() {
  $('#tip').hidden = true;
  tipEl = null;
}

// après un nouvel affichage (achat, fusion…), l'infobulle suit le nouvel élément et ses valeurs à jour
export function retip() {
  if (!tipEl || document.body.contains(tipEl)) return;
  const n = document.querySelector(`.screen:not([hidden]) [data-tip="${tipEl.dataset.tip}"]`);
  if (n) showTip(n);
  else hideTip();
}

export function initTooltips() {
  document.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest('[data-tip]');
    if (el === tipEl) return;
    if (el) showTip(el);
    else hideTip();
  });
  document.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' && !e.target.closest('[data-tipi]')) hideTip();
  });
  // Écran tactile : le bouton « ? » ouvre l'infobulle sans déclencher l'action de la carte
  document.addEventListener(
    'click',
    e => {
      const i = e.target.closest('[data-tipi]');
      if (!i) return;
      e.stopPropagation();
      e.preventDefault();
      const el = i.closest('[data-tip]');
      if (el === tipEl && tipVia === 'tipi') hideTip();
      else if (el) showTip(el, 'tipi');
    },
    true,
  );
  addEventListener('scroll', hideTip, true);
}
