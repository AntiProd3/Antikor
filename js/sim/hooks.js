// Points d’accroche entre la simulation et l’affichage.
// La simulation n’accède jamais à la page : elle appelle ces fonctions, que le client remplit au démarrage
// (js/ui/game.js). Sur un serveur, elles restent vides.

export const hooks = {
  sound(name, ...args) {}, // jouer un son localement
  banner(main, sub, col) {}, // grand titre au milieu de l'écran
  toast(title, text, col) {}, // petite notification
  say(pl, name, arg) {}, // son ou refus destiné à un seul joueur
  toastFor(pl, title, text, col) {}, // notification destinée à un seul joueur
  refreshViews(only) {}, // ré-afficher l'écran de niveau ou de boutique
  show(id) {}, // afficher un écran (null = aucun)
  clearInput(all) {}, // relâcher le joystick (et le clavier si all)
  gameOver(d) {}, // fin de partie : écran de résultats
};
