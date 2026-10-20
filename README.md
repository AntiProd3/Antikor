# Néon Horde

Jeu d'arcade néon en un seul fichier HTML, publié avec GitHub Pages.

- Jouer : https://antoinecorcos.github.io/neonhorde/
- Code : `index.html`

## Modes

- **Solo** : fonctionne entièrement hors ligne.
- **Duo en ligne** : chacun joue sur son appareil. L'un crée la partie et partage le code (ou le lien `?join=CODE`), l'autre le saisit. La connexion passe d'un navigateur à l'autre (WebRTC via [PeerJS](https://peerjs.com/)) ; la partie tourne chez l'hôte.
  - XP et niveaux communs, mais chacun choisit sa carte à chaque niveau.
  - Porte-monnaie et boutique séparés ; la vague suivante démarre quand les deux sont prêts.
  - Un joueur à terre est réanimé si son partenaire reste 3 s à côté de lui.

Pour tester le duo sans internet, ouvrir deux onglets avec `?net=local`.
