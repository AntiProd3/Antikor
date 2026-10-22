// Duo en ligne (suspendu) : connexion PeerJS, messages entre l’hôte et l’invité.

import { Sfx } from '../audio.js';
import { MODES } from '../data/career.js';
import { WEAPONS } from '../data/weapons.js';
import { mySpec, talentStats } from '../meta.js';
import { applySnap, guestStart } from './sync.js';
import { teamDown } from '../sim/combat.js';
import { doAct, levelDone, nextWave } from '../sim/flow.js';
import { setRec } from '../sim/fx.js';
import { G, setP } from '../sim/state.js';
import { applyLevelView, applyShopView, refreshViews, shakeCard } from '../ui/cards.js';
import { currentScreen, toastRaw } from '../ui/dom.js';
import { openMenu } from '../ui/game.js';
import { renderMenu } from '../ui/menu.js';
import { showOver } from '../ui/over.js';
import { clamp } from '../util.js';

/* ================= RÉSEAU (duo en ligne) ================= */

// L'hôte fait tourner la partie et envoie un instantané ~20 fois/s ; l'invité affiche cet état,
// déplace lui-même son vaisseau (pas de latence ressentie) et transmet ses actions à l'hôte.
export const NET = {
  role: null,
  peer: null,
  conn: null,
  code: '',
  status: '',
  err: '',
  typed: '',
  peerInfo: null,
  hostMode: null,
  joinTO: 0,
};

export const PEER_PREFIX = 'antikor-v1-';

export const PEERJS_URL = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';

// Serveurs ICE : STUN pour trouver l'adresse publique, TURN (relais) quand la connexion directe est impossible (4G, réseaux d'entreprise…)
export const ICE = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: 'stun:stun.cloudflare.com:3478' },
  {
    urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'],
    username: 'peerjs',
    credential: 'peerjsp',
  },
];

// ?signal=hote:port permet d'utiliser un autre serveur de mise en relation PeerJS (tests)
export const SIGNAL = new URLSearchParams(location.search).get('signal');

export function peerOpts() {
  const o = {
    debug: 2,
    config: { iceServers: ICE },
    logFunction: (lvl, ...a) =>
      netLog('peerjs: ' + a.map(x => (typeof x === 'string' ? x : (x && x.message) || safeJson(x))).join(' ')),
  };
  if (SIGNAL) {
    const [h, pt] = SIGNAL.split(':');
    Object.assign(o, {
      host: h,
      port: +pt || 9000,
      path: '/',
      secure: location.protocol === 'https:' && h !== 'localhost',
    });
  }
  return o;
}

/* ---------- Journal de connexion (affiché dans le menu duo, copiable pour le debug) ---------- */

export const NETLOG = [];
const T0 = Date.now();

export function safeJson(x) {
  try {
    return JSON.stringify(x).slice(0, 200);
  } catch (e) {
    return String(x);
  }
}

export function netLog(msg) {
  const line = ((Date.now() - T0) / 1000).toFixed(1).padStart(6) + 's  ' + msg;
  NETLOG.push(line);
  if (NETLOG.length > 300) NETLOG.shift();
  console.log('[duo]', msg);
  const el = document.getElementById('net-log');
  if (el) {
    el.textContent = NETLOG.join('\n');
    el.scrollTop = el.scrollHeight;
  }
}

export function netLogHeader() {
  netLog('— ' + new Date().toISOString() + ' · ' + navigator.userAgent);
  netLog('page ' + location.href + ' · WebRTC ' + (window.RTCPeerConnection ? 'oui' : 'NON'));
}

// Suit l'état WebRTC d'une connexion : c'est là qu'on voit si la liaison directe/relais réussit
export function watchIce(c) {
  let tries = 0;
  const t = setInterval(() => {
    const pc = c.peerConnection;
    if (!pc) {
      if (++tries > 80) clearInterval(t);
      return;
    }
    clearInterval(t);
    // types d'adresses proposées : host = réseau local, srflx = adresse publique (STUN), relay = relais TURN
    const kinds = () => {
      const k = {};
      for (const m of ((pc.localDescription && pc.localDescription.sdp) || '').matchAll(/ typ (\w+)/g))
        k[m[1]] = (k[m[1]] || 0) + 1;
      return k;
    };
    const gathered = () => {
      const k = kinds();
      netLog(
        'ICE : adresses locales ' +
          safeJson(k) +
          (k.srflx ? '' : ' · aucune adresse publique (STUN bloqué ?)') +
          (k.relay ? '' : ' · aucun relais TURN'),
      );
    };
    netLog('ICE : état initial ' + pc.iceConnectionState + ' / collecte ' + pc.iceGatheringState);
    if (pc.iceGatheringState === 'complete') gathered();
    pc.addEventListener('iceconnectionstatechange', () => {
      netLog('ICE : ' + pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        NET.iceFailed = true;
        netLog('→ aucune route réseau entre les deux appareils (ni directe, ni via relais TURN)');
      }
    });
    pc.addEventListener('connectionstatechange', () => netLog('WebRTC : ' + pc.connectionState));
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') gathered();
    });
  }, 50);
}

export function netOpen() {
  return !!(NET.conn && NET.conn.open);
}

export function netSend(o) {
  if (netOpen())
    try {
      NET.conn.send(o);
    } catch (e) {
      console.warn(e);
    }
}

export function PeerCls() {
  return window.Peer || (window.peerjs && window.peerjs.Peer);
}

export function loadPeer() {
  if (PeerCls()) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = PEERJS_URL;
    s.crossOrigin = 'anonymous';
    s.onload = () => (PeerCls() ? res() : rej(new Error('peerjs')));
    s.onerror = () => rej(new Error('peerjs'));
    document.head.appendChild(s);
  });
}

export function genCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 5; i++) c += A[Math.floor(Math.random() * A.length)];
  return c;
}

export function netReset() {
  clearTimeout(NET.joinTO);
  const c = NET.conn,
    p = NET.peer;
  NET.conn = null;
  NET.peer = null;
  try {
    if (c) {
      c._quiet = true;
      c.close();
    }
  } catch (e) {}
  try {
    if (p) p.destroy();
  } catch (e) {}
  Object.assign(NET, {
    role: null,
    code: '',
    status: '',
    err: '',
    peerInfo: null,
    hostMode: null,
    sentMode: null,
    sentHello: '',
    iceFailed: false,
  });
  setRec(false);
}

export function netFail(msg) {
  const role = NET.role;
  netReset();
  NET.err = msg;
  if (!G || role !== 'guest') {
    if (currentScreen() === 'scr-menu' || !G) renderMenu();
  }
}

export function peerErr(e) {
  return (e && e.type === 'network') || (e && e.type === 'server-error') || (e && e.type === 'socket-error')
    ? 'Serveur de mise en relation injoignable. Réessaie dans un instant.'
    : e && e.type === 'browser-incompatible'
      ? 'Ce navigateur ne gère pas le jeu en ligne.'
      : 'Erreur réseau (' + ((e && e.type) || 'inconnue') + ').';
}

// Transport de test entre deux onglets du même navigateur : ?net=local (aucun serveur nécessaire)
export const LOCAL_NET = new URLSearchParams(location.search).get('net') === 'local';

export function localConn(bc) {
  const h = {};
  const c = {
    open: false,
    _bc: bc,
    on(ev, fn) {
      (h[ev] = h[ev] || []).push(fn);
      return c;
    },
    _emit(ev, x) {
      for (const f of h[ev] || []) f(x);
    },
    send(o) {
      bc.postMessage(o);
    },
    close() {
      if (!c.open) return;
      c.open = false;
      try {
        bc.postMessage({ __bye: 1 });
        bc.close();
      } catch (e) {}
      c._emit('close');
    },
  };
  bc.onmessage = ev => {
    const m = ev.data;
    if (m.__bye) {
      if (c.open) {
        c.open = false;
        c._emit('close');
      }
      return;
    }
    if (m.__j || m.__ok) return;
    c._emit('data', m);
  };
  return c;
}

export async function hostGame() {
  netReset();
  NET.role = 'host';
  NET.status = 'Connexion au serveur de mise en relation…';
  netLogHeader();
  netLog('Hôte : création de la partie');
  renderMenu();
  if (LOCAL_NET) {
    NET.code = genCode();
    const bc = new BroadcastChannel('nh-' + NET.code);
    NET.peer = {
      destroy() {
        bc.close();
      },
    };
    NET.status = 'En attente du joueur 2…';
    bc.onmessage = ev => {
      if (ev.data.__j && !NET.conn) {
        const c = localConn(bc);
        NET.conn = c;
        bindConn(c);
        bc.postMessage({ __ok: 1 });
        c.open = true;
        c._emit('open');
      }
    };
    renderMenu();
    return;
  }
  try {
    await loadPeer();
    netLog('Module PeerJS chargé');
  } catch (e) {
    netLog('ÉCHEC du chargement de PeerJS (' + PEERJS_URL + ')');
    netFail('Impossible de charger le module réseau (connexion internet ?).');
    return;
  }
  if (NET.role !== 'host') return;
  const code = genCode();
  const Peer = PeerCls();
  const peer = new Peer(PEER_PREFIX + code, peerOpts());
  NET.peer = peer;
  const openTO = setTimeout(() => {
    if (NET.peer === peer && !peer.open) {
      netLog('Serveur de mise en relation : pas de réponse après 15 s');
      netFail('Serveur de mise en relation injoignable. Réessaie dans un instant.');
    }
  }, 15000);
  // le code n'est affiché qu'une fois enregistré auprès du serveur : sinon personne ne pourrait le rejoindre
  peer.on('open', id => {
    clearTimeout(openTO);
    if (NET.peer !== peer) return;
    NET.code = code;
    netLog('Enregistré auprès du serveur sous ' + id);
    NET.status = 'En attente du joueur 2…';
    renderMenu();
  });
  peer.on('connection', c => {
    netLog('Demande de connexion reçue de ' + c.peer);
    if (netOpen() || G) {
      netLog('Refusée : partie déjà complète ou en cours');
      c.on('open', () => {
        c.send({ t: 'full' });
        setTimeout(() => c.close(), 400);
      });
      return;
    }
    NET.conn = c;
    NET.status = 'Le joueur 2 arrive… (connexion en cours)';
    renderMenu();
    bindConn(c);
    watchIce(c);
    clearTimeout(NET.joinTO);
    NET.joinTO = setTimeout(() => {
      if (NET.conn === c && !c.open) {
        netLog('Connexion avec le joueur 2 jamais établie (20 s)');
        try {
          c._quiet = true;
          c.close();
        } catch (e) {}
        NET.conn = null;
        NET.status = 'Le joueur 2 n’a pas pu se connecter (réseau bloquant ?). En attente…';
        renderMenu();
      }
    }, 20000);
  });
  peer.on('error', e => {
    netLog('Erreur PeerJS : ' + e.type + ' · ' + (e.message || ''));
    if (e.type === 'unavailable-id') {
      hostGame();
      return;
    }
    if (!netOpen() && !peer.open) netFail(peerErr(e));
  });
  peer.on('disconnected', () => {
    netLog('Déconnecté du serveur de mise en relation, reconnexion…');
    if (NET.peer === peer && !peer.destroyed)
      try {
        peer.reconnect();
      } catch (e) {}
  });
}

export async function joinGame(code) {
  netReset();
  NET.role = 'guest';
  NET.code = code;
  NET.status = 'Connexion à la partie ' + code + '…';
  netLogHeader();
  netLog('Invité : rejoint ' + code);
  renderMenu();
  if (LOCAL_NET) {
    const bc = new BroadcastChannel('nh-' + code);
    const c = localConn(bc);
    NET.conn = c;
    NET.peer = {
      destroy() {
        bc.close();
      },
    };
    bindConn(c);
    bc.addEventListener('message', ev => {
      if (ev.data.__ok && !c.open) {
        c.open = true;
        c._emit('open');
      }
    });
    bc.postMessage({ __j: 1 });
    NET.joinTO = setTimeout(() => {
      if (!c.open) netFail('Partie introuvable. Vérifie le code.');
    }, 4000);
    return;
  }
  try {
    await loadPeer();
    netLog('Module PeerJS chargé');
  } catch (e) {
    netLog('ÉCHEC du chargement de PeerJS (' + PEERJS_URL + ')');
    netFail('Impossible de charger le module réseau (connexion internet ?).');
    return;
  }
  if (NET.role !== 'guest') return;
  const Peer = PeerCls();
  const peer = new Peer(peerOpts());
  NET.peer = peer;
  const openTO = setTimeout(() => {
    if (NET.peer === peer && !peer.open) {
      netLog('Serveur de mise en relation : pas de réponse après 15 s');
      netFail('Serveur de mise en relation injoignable. Réessaie dans un instant.');
    }
  }, 15000);
  peer.on('open', id => {
    clearTimeout(openTO);
    if (NET.peer !== peer) return;
    netLog('Enregistré auprès du serveur sous ' + id + ', appel de l’hôte…');
    NET.status = 'Hôte trouvé ? Connexion en cours…';
    renderMenu();
    const c = peer.connect(PEER_PREFIX + code, { reliable: true, serialization: 'json' });
    NET.conn = c;
    bindConn(c);
    watchIce(c);
    NET.joinTO = setTimeout(() => {
      if (!netOpen()) {
        netLog('Connexion jamais établie après 20 s');
        netFail(
          NET.iceFailed
            ? 'Connexion directe impossible entre vos deux réseaux. Essayez un autre réseau (ex. le même Wi-Fi).'
            : 'Impossible de joindre la partie. Vérifie le code ou réessaie.',
        );
      }
    }, 20000);
  });
  peer.on('error', e => {
    netLog('Erreur PeerJS : ' + e.type + ' · ' + (e.message || ''));
    if (e.type === 'peer-unavailable') netFail('Partie introuvable. Vérifie le code (l’hôte doit rester sur le menu).');
    else if (!netOpen() && !peer.open) netFail(peerErr(e));
  });
  peer.on('disconnected', () => {
    netLog('Déconnecté du serveur de mise en relation');
    if (NET.peer === peer && !peer.destroyed && !netOpen())
      try {
        peer.reconnect();
      } catch (e) {}
  });
}

export function bindConn(c) {
  c.on('open', () => {
    netLog('Canal de données OUVERT avec ' + (c.peer || 'le partenaire'));
    if (NET.conn !== c) return;
    clearTimeout(NET.joinTO);
    NET.err = '';
    NET.lastRx = performance.now();
    NET.sentMode = null;
    NET.sentHello = '';
    if (NET.role === 'guest') {
      NET.status = 'Connecté ! L’hôte va lancer la partie.';
      sendHello();
    } else NET.status = 'Joueur 2 connecté. Lance la partie !';
    Sfx.init();
    Sfx.wave();
    if (!G) renderMenu();
  });
  c.on('data', m => {
    if (NET.conn !== c || !m || typeof m !== 'object') return;
    NET.lastRx = performance.now();
    if (m.t === 'ping') return;
    if (m.t === 'bye') {
      onPeerLost();
      return;
    }
    try {
      onNet(m);
    } catch (e) {
      console.error(e);
    }
  });
  c.on('close', () => {
    netLog('Canal de données fermé');
    if (NET.conn !== c || c._quiet) return;
    onPeerLost();
  });
  c.on('error', e => netLog('Erreur canal : ' + ((e && e.type) || '') + ' ' + ((e && e.message) || e)));
}

export function sendHello() {
  const m = { t: 'hello', ...mySpec() };
  const k = JSON.stringify(m);
  if (k === NET.sentHello) return;
  NET.sentHello = k;
  netSend(m);
}

// Signal de vie : sans nouvelles du partenaire pendant 8 s, on considère la connexion perdue
setInterval(() => {
  if (!netOpen()) return;
  netSend({ t: 'ping' });
  if (performance.now() - (NET.lastRx || 0) > 8000) {
    const c = NET.conn;
    c._quiet = true;
    try {
      c.close();
    } catch (e) {}
    onPeerLost();
  }
}, 2000);
addEventListener('pagehide', () => {
  if (netOpen()) netSend({ t: 'bye' });
});

export function onPeerLost() {
  if (NET.role === 'host') {
    const c = NET.conn;
    NET.conn = null;
    if (c) {
      c._quiet = true;
      try {
        c.close();
      } catch (e) {}
    }
    NET.peerInfo = null;
    NET.status = 'Joueur 2 parti. En attente d’un nouveau joueur…';
    setRec(false);
    if (G && G.players.length > 1) dropGuest();
    if (!G || currentScreen() === 'scr-menu') renderMenu();
  } else {
    const inGame = !!G;
    netReset();
    NET.err = 'Connexion perdue avec l’hôte.';
    if (inGame) {
      openMenu();
    } else renderMenu();
  }
}

// L'invité est parti en pleine partie : l'hôte continue seul
export function dropGuest() {
  G.players.length = 1;
  setP(G.players[0]);
  toastRaw('DUO', 'Ton partenaire s’est déconnecté. Tu continues seul.', '#ff6ad5');
  if (G.state === 'level' && !G.players[0].pend) levelDone();
  else if (G.state === 'shop' && G.players[0].ready) nextWave();
  else if (G.state === 'level' || G.state === 'shop') refreshViews();
  else if (G.players[0].down) {
    G.players[0].down = false;
    G.players[0].hp = 1;
    teamDown();
  }
}

export function cleanSpec(m) {
  const n = v => (typeof v === 'number' && isFinite(v) ? v : 0);
  const t = m.ts || {};
  const ts = {};
  for (const k of Object.keys(talentStats())) ts[k] = n(t[k]);
  const owned = {};
  const om = m.owned && typeof m.owned === 'object' ? m.owned : {};
  for (const id in om) if (WEAPONS[id]) owned[id] = clamp(om[id] | 0, 0, 4);
  if (!Object.keys(owned).length) owned.blaster = 0;
  const st = m.start || {};
  const sid = owned[st.id] !== undefined ? st.id : Object.keys(owned)[0];
  return { ts, owned, start: { id: sid, r: clamp(st.r | 0, 0, owned[sid]) } };
}

export function onNet(m) {
  if (NET.role === 'host') {
    switch (m.t) {
      case 'hello':
        NET.peerInfo = cleanSpec(m);
        if (!G) renderMenu();
        break;
      case 'in': {
        const pl = G && G.players[1];
        if (pl && !G.guest) {
          pl.nx = +m.x || 0;
          pl.ny = +m.y || 0;
          pl.nvx = +m.vx || 0;
          pl.nvy = +m.vy || 0;
          pl.nm = !!m.m;
        }
        break;
      }
      case 'act':
        if (G && G.players[1]) doAct(G.players[1], m.a, m.i | 0);
        break;
    }
    return;
  }
  switch (m.t) {
    case 'full':
      netFail('Cette partie est déjà complète ou en cours.');
      break;
    case 'lobby':
      NET.hostMode = MODES[m.mode] ? m.mode : null;
      if (!G) renderMenu();
      break;
    case 'start':
      guestStart(m.mode);
      break;
    case 's':
      applySnap(m);
      break;
    case 'view':
      if (G) (m.k === 'level' ? applyLevelView : applyShopView)(m.v);
      break;
    case 'over':
      if (G) {
        G.state = 'over';
        showOver(m.d);
      }
      break;
    case 'menu':
      if (G) openMenu();
      break;
    case 'say':
      if (Sfx[m.n]) Sfx[m.n]();
      if (m.n === 'deny') shakeCard(m.arg);
      break;
    case 'toast':
      toastRaw(...m.a);
      break;
  }
}
