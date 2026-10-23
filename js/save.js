// Réglages propres à cet appareil (mode choisi, son), gardés dans le navigateur.
// La progression (noyaux, armes, talents, carrière…) est sur le serveur : voir js/online/client.js.

const KEY = 'antikor-settings';

function load() {
  const s = { mode: 'career', muted: false };
  try {
    Object.assign(s, JSON.parse(localStorage.getItem(KEY)) || {});
  } catch (e) {}
  if (s.mode !== 'career' && s.mode !== 'endless') s.mode = 'career';
  return s;
}

export const save = load();

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ mode: save.mode, muted: save.muted }));
  } catch (e) {}
}
