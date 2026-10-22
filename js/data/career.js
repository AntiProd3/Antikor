// Modes de jeu, carrière (25 niveaux) et les 5 mondes.

export const MODES = {
  endless: {
    id: 'endless',
    name: 'Infini',
    waves: Infinity,
    dur: 32,
    bosses: [],
    endless: true,
    sub: 'Jusqu’à la chute',
  },
};

// ---------- Carrière : 25 niveaux de 10 manches (boss aux manches 5 et 10), 5 mondes de 5 niveaux ----------
export const CAREER_LEVELS = 25;

// style = motif du sol ; line/acc = couleurs [r,g,b,alpha] ; bgLit = fond éclairci pendant les boss
export const WORLDS = [
  { name: 'Épiderme', style: 'grid', col: '#3ef2ff', bg: '#070b16', bgLit: '#0f1832' },
  {
    name: 'Plasma',
    style: 'hex',
    col: '#ff3d8b',
    bg: '#0d0610',
    bgLit: '#1c0c1f',
    line: [255, 61, 139, 0.12],
    acc: [255, 140, 190, 0.32],
  },
  {
    name: 'Lymphe',
    style: 'dots',
    col: '#3effc2',
    bg: '#030f0e',
    bgLit: '#08201d',
    line: [62, 255, 194, 0.2],
    acc: [150, 255, 220, 0.34],
  },
  {
    name: 'Moelle',
    style: 'tri',
    col: '#ffb03e',
    bg: '#0e0904',
    bgLit: '#1f1508',
    line: [255, 176, 62, 0.1],
    acc: [255, 210, 140, 0.3],
  },
  {
    name: 'Cortex',
    style: 'circuit',
    col: '#b48cff',
    bg: '#090616',
    bgLit: '#150e2c',
    line: [180, 140, 255, 0.14],
    acc: [215, 195, 255, 0.4],
  },
];

export function worldOf(L) {
  return Math.min(WORLDS.length - 1, Math.floor((L - 1) / 5));
}

export function careerMode(L) {
  return { id: 'career', name: 'Niveau ' + L, level: L, waves: 10, dur: 30, bosses: [5, 10], career: true };
}

// boss fixes par niveau (affichés sur la carte) : la Couronne garde la fin de chaque monde
export function careerBosses(L) {
  const fin = L % 5 === 0 ? 'crown' : ['hive', 'eye', 'titan', 'crown'][(L - 1) % 4];
  const opts = ['hive', 'eye', 'titan'].filter(x => x !== fin);
  return { mid: opts[L % opts.length], fin };
}
