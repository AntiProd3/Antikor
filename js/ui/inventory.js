// Inventaire : équiper et fusionner les armes.

import { Sfx } from '../audio.js';
import { RARITY, rarBonus } from '../data/loot.js';
import { PASSIVES } from '../data/passives.js';
import { WEAPONS } from '../data/weapons.js';
import { svg } from '../icons.js';
import { equipped, ownedMap } from '../meta.js';
import { persist, save } from '../save.js';
import { showReveal } from './boxes.js';
import { $ } from './dom.js';
import { retip } from './tooltips.js';

/* ---------- Inventaire & box ---------- */

export function stacks() {
  const m = new Map();
  for (const it of save.inv) {
    const k = it.id + '|' + it.r;
    if (!m.has(k)) m.set(k, { id: it.id, r: it.r, items: [] });
    m.get(k).items.push(it);
  }
  return [...m.values()].sort(
    (a, b) => b.r - a.r || Object.keys(WEAPONS).indexOf(a.id) - Object.keys(WEAPONS).indexOf(b.id),
  );
}

export function renderInv() {
  const eq = equipped();
  setTimeout(retip);
  $('#inv-grid').innerHTML = stacks()
    .map(st => {
      const d = WEAPONS[st.id],
        R = RARITY[st.r];
      const on = st.items.some(x => x.u === eq.u);
      const n = st.items.length;
      return `<div class="card cut inv-card ${on ? 'on' : ''}" style="--c:${d.col};--rc:${R.col}" data-eq="${st.id}|${st.r}" data-tip="w:${st.id}:${st.r}" role="button" tabindex="0">
   <div class="card-top"><span class="ico">${svg(st.id)}</span><span class="count">×${n}</span><span class="tipi" data-tipi>?</span></div>
   <div class="card-name">${d.name}</div><span class="rar" style="--rc:${R.col}">${R.name}</span>
   <p class="card-desc">${rarBonus(st.r)}</p><p class="card-hint">Évolution : ${d.evoName} (avec ${PASSIVES[d.evoWith].name})</p>
   <div class="inv-actions">${on ? '<span class="tag" style="background:var(--cyan)">ÉQUIPÉE</span>' : '<button class="btn cut" data-eq="' + st.id + '|' + st.r + '">Équiper</button>'}
   ${st.r < 4 ? `<button class="btn ${n >= 3 ? 'btn-gold' : ''} cut" data-fuse="${st.id}|${st.r}" ${n >= 3 ? '' : 'disabled'}>Fusion ${Math.min(n, 3)}/3 → ${RARITY[st.r + 1].name}</button>` : ''}</div></div>`;
    })
    .join('');
  const own = ownedMap();
  const miss = Object.keys(WEAPONS).filter(id => own[id] === undefined);
  $('#inv-missing').innerHTML = miss.length
    ? miss
        .map(
          id =>
            `<div class="card cut inv-card missing" data-tip="w:${id}:0"><div class="card-top"><span class="ico">${svg('lock')}</span><span class="tipi" data-tipi>?</span></div><div class="card-name">${WEAPONS[id].name}</div><p class="card-desc">${WEAPONS[id].up[0]}</p></div>`,
        )
        .join('')
    : '<p class="empty">Collection complète !</p>';
}

export function equipStack(key) {
  const [id, r] = key.split('|');
  const it = save.inv.find(x => x.id === id && x.r === +r);
  if (!it) return;
  save.equip = it.u;
  persist();
  Sfx.click();
  renderInv();
}

export function fuse(key) {
  const [id, r0] = key.split('|');
  const r = +r0;
  const its = save.inv.filter(x => x.id === id && x.r === r);
  if (its.length < 3 || r >= 4) {
    Sfx.deny();
    return;
  }
  const used = its.slice(0, 3);
  const wasEq = used.some(x => x.u === save.equip);
  save.inv = save.inv.filter(x => !used.includes(x));
  const nu = { u: save.uid++, id, r: r + 1 };
  save.inv.push(nu);
  if (wasEq) save.equip = nu.u;
  persist();
  renderInv();
  showReveal(nu, false, 'FUSION !');
}

export function initInventory() {
  $('#inv-grid').addEventListener('click', e => {
    const f = e.target.closest('[data-fuse]');
    if (f) {
      if (!f.disabled) fuse(f.dataset.fuse);
      return;
    }
    const q = e.target.closest('[data-eq]');
    if (q) equipStack(q.dataset.eq);
  });
}
