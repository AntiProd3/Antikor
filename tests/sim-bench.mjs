// Test de la simulation sans navigateur (Node.js) : une partie complète tourne sans page ni canvas,
// avec des commandes fictives, et on mesure le temps de calcul de chaque tick.
// Lancer depuis la racine du dépôt :  node tests/sim-bench.mjs [ticks] [mode] [niveau] [--duo] [--mortel]
// Par défaut les joueurs ne meurent pas, pour mesurer une partie longue avec beaucoup d'ennemis.
import { G, setView, setME } from '../js/sim/state.js';
import { newRun } from '../js/sim/waves.js';
import { update } from '../js/sim/update.js';
import { doAct } from '../js/sim/flow.js';
import { hooks } from '../js/sim/hooks.js';

const TICKS = +(process.argv[2] || 3000);

const MODE = process.argv[3] || 'career';

const LEVEL = +(process.argv[4] || 10);

const DT = 1 / 30; // le serveur prévu tourne à 30 ticks par seconde

// Sur le serveur, la zone visible ne dépend plus de l'écran : valeur fixe
setView(560, 420);
setME(0);

let overData = null;
hooks.gameOver = d => {
  overData = d;
};

// Joueur de test : talents moyens, quatre emplacements d'armes, plusieurs armes possédées
const ts = {
  slots: 4,
  hp: 50,
  dmg: 0.15,
  spd: 0.08,
  mag: 0.3,
  gold: 0.2,
  startGold: 40,
  armor: 0.08,
  freeRerolls: 1,
  choice: 1,
  revive: 1,
};

const owned = {
  blaster: 2,
  shotgun: 1,
  drones: 2,
  arc: 1,
  molotov: 0,
  rockets: 3,
  aura: 0,
  laser: 1,
  cryo: 2,
  katana: 3,
  turret: 1,
};

const specs = [
  { ts, owned, start: { id: 'katana', r: 3 } },
  { ts, owned, start: { id: 'blaster', r: 2 } },
];

const duo = process.argv.includes('--duo');

const immortal = !process.argv.includes('--mortel');
newRun(MODE, duo ? specs : specs.slice(0, 1), LEVEL);

const times = [];

let maxEnemies = 0;
for (let i = 0; i < TICKS && G.state !== 'over'; i++) {
  // commandes fictives : chaque joueur tourne en rond
  G.players.forEach((pl, k) => {
    const a = i / 40 + k * Math.PI;
    pl.in = [Math.cos(a), Math.sin(a)];
  });
  if (G.state === 'level') {
    for (const pl of G.players) if (pl.pend > 0) doAct(pl, 'pick', 0);
    continue;
  }
  if (G.state === 'shop') {
    for (const pl of G.players) {
      doAct(pl, 'buy', 0);
      doAct(pl, 'ready');
    }
    continue;
  }
  if (immortal) for (const pl of G.players) pl.hp = pl.maxHp;
  const t0 = performance.now();
  update(DT, DT);
  times.push(performance.now() - t0);
  maxEnemies = Math.max(maxEnemies, G.enemies.length);
}

times.sort((a, b) => a - b);

const avg = times.reduce((a, b) => a + b, 0) / times.length;

const pct = p => times[Math.min(times.length - 1, Math.floor(times.length * p))];
console.log(
  `Mode ${MODE}${MODE === 'career' ? ' niveau ' + LEVEL : ''}${duo ? ' (duo)' : ''} · ${times.length} ticks simulés à ${Math.round(1 / DT)} Hz`,
);
console.log(
  `Fin : état ${G.state}, vague ${G.wave}, ${G.kills} éliminations, niveau ${G.level}, max ${maxEnemies} ennemis à l'écran`,
);
if (overData) console.log(`Résultat : ${overData.win ? 'victoire' : 'défaite'}`);
console.log(
  `Temps par tick : moyenne ${avg.toFixed(2)} ms · 99e centile ${pct(0.99).toFixed(2)} ms · max ${times[times.length - 1].toFixed(2)} ms (budget : 33 ms)`,
);
