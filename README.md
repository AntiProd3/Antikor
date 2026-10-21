# Néon Horde

Jeu d'arcade néon en un seul fichier HTML, publié avec GitHub Pages.

- Jouer : https://antoinecorcos.github.io/neonhorde/
- Code : `index.html`

Version actuelle : **0.4** (affichée en bas à droite du jeu).

## Armes, raretés et box

- On commence avec un **Blaster commun** (et une Box néon offerte).
- Les **box** s'achètent avec les noyaux (Box néon 25, Box prisme 70) ou se gagnent sur les boss et parfois les élites.
- 5 raretés : Commun, Rare, Épique, Légendaire, Mythique. Plus c'est rare, plus l'arme est forte (dégâts, recharge, zone ; Légendaire et Mythique commencent niveau 2, Mythique +1 projectile).
- **Inventaire** (menu uniquement) : équiper son arme de départ, fusionner 3 exemplaires identiques en une rareté supérieure.
- En partie, seules les armes possédées apparaissent, avec la meilleure rareté possédée.
- 14 armes, dont 4 nouvelles en 0.4 : Lance-flammes, Rayon cryo, Katana néon, Singularité.

## Modes

- **Solo** : fonctionne entièrement hors ligne.
- **Duo en ligne** : chacun joue sur son appareil. L'un crée la partie et partage le code (ou le lien `?join=CODE`), l'autre le saisit. La connexion passe d'un navigateur à l'autre (WebRTC via [PeerJS](https://peerjs.com/)) ; la partie tourne chez l'hôte.
  - XP et niveaux communs, mais chacun choisit sa carte à chaque niveau.
  - Porte-monnaie et boutique séparés ; la vague suivante démarre quand les deux sont prêts.
  - Un joueur à terre est réanimé si son partenaire reste 3 s à côté de lui.

Pour tester le duo sans internet, ouvrir deux onglets avec `?net=local`.
