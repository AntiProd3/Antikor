// Panneau du duo en ligne dans le menu (suspendu, voir DUO_ENABLED).

import { Sfx } from '../audio.js';
import { NET, NETLOG, hostGame, joinGame, netLog, netOpen, netReset } from '../net/net.js';
import { save } from '../save.js';
import { $, esc } from './dom.js';
import { renderMenu } from './menu.js';

export function renderDuo() {
  const el = $('#duo-panel');
  const duo = save.players === 'duo';
  el.hidden = !duo;
  if (!duo) return;
  const typed = ($('#code-in') || {}).value || NET.typed || '';
  let h = '';
  if (!NET.role) {
    h =
      `<div class="eyebrow">Duo en ligne</div><p class="help">L’un crée la partie et partage le code, l’autre le saisit. Chacun garde ses talents et son arme de départ.</p>
  <div class="duo-row"><button class="btn btn-gold cut" data-net="host">Créer une partie</button></div>
  <div class="duo-row"><input class="code-in cut" id="code-in" maxlength="5" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Code de la partie" value="${esc(typed)}"><button class="btn cut" data-net="join">Rejoindre</button></div>` +
      (NET.err ? `<p class="duo-status err">${esc(NET.err)}</p>` : '');
  } else if (NET.role === 'host') {
    h = `<div class="eyebrow">Ta partie · code à donner au joueur 2</div><div class="code-big">${NET.code ? esc(NET.code) : '·····'}</div>
  <p class="duo-status ${netOpen() ? 'ok' : NET.err ? 'err' : ''}">${esc(NET.err || NET.status)}</p>
  <div class="duo-row"><button class="btn cut" data-net="share" ${NET.code && !NET.err ? '' : 'disabled'}>Partager le lien</button><button class="btn cut" data-net="leave">Annuler</button></div>`;
  } else {
    h = `<div class="eyebrow">Partie ${esc(NET.code)}</div><p class="duo-status ${netOpen() ? 'ok' : NET.err ? 'err' : ''}">${esc(NET.err || NET.status)}</p>
  <div class="duo-row"><button class="btn cut" data-net="leave">Quitter</button></div>`;
  }
  h += `<details class="netlog"${NET.logOpen ? ' open' : ''}><summary>Journal de connexion</summary><pre id="net-log">${esc(NETLOG.join('\n')) || '(vide)'}</pre><div class="duo-row"><button class="btn cut" data-net="copylog">Copier le journal</button></div></details>`;
  el.innerHTML = h;
  const pre = $('#net-log');
  if (pre) pre.scrollTop = pre.scrollHeight;
  el.querySelector('details').addEventListener('toggle', ev => {
    NET.logOpen = ev.target.open;
  });
}

export function initDuo() {
  $('#duo-panel').addEventListener('click', e => {
    const b = e.target.closest('[data-net]');
    if (!b) return;
    Sfx.init();
    Sfx.click();
    switch (b.dataset.net) {
      case 'host':
        hostGame();
        break;
      case 'join': {
        const c = ($('#code-in').value || '').trim().toUpperCase();
        if (c.length < 4) {
          NET.err = 'Saisis le code donné par l’hôte.';
          renderMenu();
          return;
        }
        joinGame(c);
        break;
      }
      case 'leave':
        netLog('Partie quittée');
        netReset();
        renderMenu();
        break;
      case 'copylog': {
        const t = NETLOG.join('\n');
        if (navigator.clipboard)
          navigator.clipboard.writeText(t).then(
            () => {
              b.textContent = 'Journal copié ✓';
            },
            () => {
              b.textContent = 'Copie impossible : sélectionne le texte';
            },
          );
        break;
      }
      case 'share': {
        const url = location.origin + location.pathname + '?join=' + NET.code;
        if (navigator.share)
          navigator
            .share({ title: 'Antikor', text: 'Rejoins ma partie d’Antikor (code ' + NET.code + ')', url })
            .catch(() => {});
        else if (navigator.clipboard)
          navigator.clipboard.writeText(url).then(
            () => {
              b.textContent = 'Lien copié ✓';
            },
            () => {
              b.textContent = url;
            },
          );
        break;
      }
    }
  });
  $('#duo-panel').addEventListener('keydown', e => {
    if (e.target.id === 'code-in' && e.key === 'Enter') {
      e.preventDefault();
      $('[data-net="join"]').click();
    }
  });
  $('#duo-panel').addEventListener('input', e => {
    if (e.target.id === 'code-in') {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      NET.typed = e.target.value;
    }
  });
}
