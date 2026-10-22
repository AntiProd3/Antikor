// État partagé de la simulation.
// Les autres modules lisent G, P, ME et WM directement, mais ne peuvent les modifier que par les fonctions set…().

// G = partie en cours, P = joueur « courant » (celui dont on exécute les armes / options), ME = index du joueur local
export let G = null,
  P = null,
  ME = 0;

// WM = multiplicateur de dégâts de la rareté de l'arme en cours (mémorisé sur chaque projectile)
export let WM = 1;

// Demi-largeur et demi-hauteur visibles (unités du monde) : servent à placer les apparitions hors de l’écran
export const view = { hw: 400, hh: 300 };

// Réglages venant du client (accessibilité)
export const settings = { reduced: false };

export function setG(v) {
  G = v;
}

export function setP(v) {
  P = v;
}

export function setME(v) {
  ME = v;
}

export function setWM(v) {
  WM = v;
}

export function setView(hw, hh) {
  view.hw = hw;
  view.hh = hh;
}

export function withP(pl, fn) {
  const o = P;
  P = pl;
  try {
    return fn();
  } finally {
    P = o;
  }
}
