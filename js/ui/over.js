// Écran de fin de partie : récompenses, étoiles, records.

import { CAREER_LEVELS, MODES, WORLDS, careerMode, worldOf } from '../data/career.js';
import { BOXES } from '../data/loot.js';
import { ICON, svg } from '../icons.js';
import { NET } from '../net/net.js';
import { persist, save } from '../save.js';
import { $, show } from './dom.js';
import { setOverMode } from './game.js';
import { fmtTime } from '../util.js';

// Chaque joueur calcule ses noyaux et records avec sa propre sauvegarde
export function showOver(d) {
  const career = d.mode === 'career';
  const M = career ? careerMode(d.cl) : MODES[d.mode] || MODES.endless;
  const waves = d.win ? d.wave : d.wave - 1;
  // Carrière : étoiles selon les PV restants, bonus au premier passage et pour chaque nouvelle étoile, niveau suivant débloqué
  let stars = 0,
    bonus = 0,
    unlocked = false;
  if (career && d.win && !d.quit) {
    stars = d.hp >= 0.75 ? 3 : d.hp >= 0.4 ? 2 : 1;
    const prev = save.career.stars[d.cl] || 0;
    if (!prev) bonus += 10 + 3 * d.cl;
    if (stars > prev) {
      bonus += (stars - prev) * 5;
      save.career.stars[d.cl] = stars;
    }
    if (d.cl >= save.career.max && d.cl < CAREER_LEVELS) {
      save.career.max = d.cl + 1;
      unlocked = true;
    }
  }
  let cores = Math.floor(waves * 3 + d.kills / 40 + d.bossKills * 8 + (d.win && !career ? 20 : 0) + bonus);
  cores = d.quit ? 0 : Math.max(1, cores);
  save.cores += cores;
  save.totalKills = (save.totalKills || 0) + d.kills;
  if (d.win) save.wins++;
  const b = save.best[d.mode] || 0;
  const newRec = !career && d.wave > b;
  if (newRec) save.best[d.mode] = d.wave;
  persist();
  $('#over-box').className = 'box over ' + (d.win ? 'win' : 'lose');
  $('#over-title').textContent = d.win
    ? career
      ? 'NIVEAU ' + d.cl + ' TERMINÉ'
      : 'VICTOIRE'
    : d.quit
      ? 'ABANDON'
      : d.duo
        ? 'VOUS AVEZ CHUTÉ'
        : 'TU AS CHUTÉ';
  const wd = career ? WORLDS[worldOf(d.cl)] : null;
  $('#over-sub').textContent = career
    ? `Monde ${worldOf(d.cl) + 1} · ${wd.name} · niveau ${d.cl}${unlocked ? ' · niveau ' + (d.cl + 1) + ' débloqué !' : ''}`
    : `${M.name}${d.duo ? ' · duo' : ''} · ${d.win ? 'toutes les vagues tenues' : 'vague ' + d.wave}${newRec ? ' · nouveau record' : ''}`;
  const os = $('#over-stars');
  os.hidden = !(career && d.win && !d.quit);
  os.innerHTML = [1, 2, 3]
    .map(i => `<svg viewBox="0 0 24 24" class="${i <= stars ? 'on' : ''}">${ICON.star}</svg>`)
    .join('');
  const st = [
    ['Vague atteinte', M.endless ? d.wave : `${d.wave} / ${M.waves}`],
    ['Temps', fmtTime(d.time)],
    ['Éliminations', d.kills],
    ['Meilleur combo', d.maxCombo],
    ['Dégâts infligés', d.dmg.toLocaleString('fr-FR')],
    ['Niveau du héros', d.level],
    ['Pièces ramassées (partie)', d.coins],
  ];
  if (career && d.win && !d.quit)
    st.unshift([
      'PV restants',
      Math.round(d.hp * 100) +
        '% · ' +
        (stars === 3 ? 'parfait' : stars === 2 ? '3★ à partir de 75%' : '2★ à partir de 40%'),
    ]);
  $('#over-stats').innerHTML = st.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  const bx = d.boxes || {};
  save.boxes.std += bx.std | 0;
  save.boxes.prem += bx.prem | 0;
  persist();
  $('#over-reward').innerHTML =
    (d.quit
      ? `<span style="font-size:15px;color:var(--dim);font-family:var(--f-ui)">Partie abandonnée : aucun noyau.</span>`
      : svg('core', 2) + `+${cores} noyaux <span class="cur-lbl">gardés pour toujours</span>`) +
    (bx.std | 0
      ? ` <span class="rw-box" style="--c:${BOXES.std.col}">${svg('box', 2)}+${bx.std} ${BOXES.std.name}</span>`
      : '') +
    (bx.prem | 0
      ? ` <span class="rw-box" style="--c:${BOXES.prem.col}">${svg('box', 2)}+${bx.prem} ${BOXES.prem.name}</span>`
      : '');
  const guest = NET.role === 'guest' && d.duo;
  const again = $('#btn-again');
  again.disabled = guest;
  again.textContent = guest ? 'L’hôte relance…' : career && !d.win ? 'Réessayer' : 'Rejouer';
  const nx = $('#btn-nextlv');
  nx.hidden = !(career && d.win && !d.quit && d.cl < CAREER_LEVELS);
  nx.className = 'btn btn-gold cut';
  again.className = nx.hidden ? 'btn btn-gold cut' : 'btn cut';
  $('#btn-menu').textContent = career ? 'Carte' : 'Menu';
  setOverMode(career ? 'career' : 'endless');
  $('#hud').hidden = true;
  show('scr-over');
}
