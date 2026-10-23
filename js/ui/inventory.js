// Inventaire : équiper et fusionner les armes.

import { Sfx } from '../audio.js';
import { RARITY, rarBonus } from '../data/loot.js';
import { PASSIVES } from '../data/passives.js';
import { WEAPONS } from '../data/weapons.js';
import { svg } from '../icons.js';
import { equipped, ownedMap } from '../meta.js';
import { prog, request } from '../online/client.js';
import { showReveal } from './boxes.js';
import { $, notice } from './dom.js';
import { retip } from './tooltips.js';

/* ---------- Inventaire & box ---------- */

export function stacks() {
  const m = new Map();
  for (const it of prog.inv) {
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
  const it = prog.inv.find(x => x.id === id && x.r === +r);
  if (!it) return;
  Sfx.click();
  request('equip', { u: it.u }).then(res => res.ok || notice(res.msg));
}

// Fusion faite par le serveur : 3 exemplaires identiques → 1 de la rareté au-dessus
export async function fuse(key) {
  const [id, r] = key.split('|');
  const res = await request('fuse', { id, r: +r });
  if (!res.ok) {
    Sfx.deny();
    notice(res.msg);
    return;
  }
  showReveal(res.item, false, 'FUSION !');
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
