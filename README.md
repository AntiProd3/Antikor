# Antikor

Jeu d'arcade néon en HTML/CSS/JavaScript sans dépendance, publié avec GitHub Pages. Le corps est envahi par des germes : tu es sa dernière défense.

(Anciennement « Néon Horde », renommé en v0.7 ; les sauvegardes sont reprises automatiquement.)

- Jouer : https://antoinecorcos.github.io/neonhorde/
- Code : `index.html` (écrans), `css/` (styles), `js/` (jeu : `data/` réglages, `sim/` simulation, `render/` dessin, `ui/` interface, `net/` duo)
- En local : lancer un petit serveur dans le dossier (`python3 -m http.server`) puis ouvrir http://localhost:8000/ (ouvrir le fichier directement ne marche pas avec les modules)

Version actuelle : **0.8.2** (affichée en bas à droite du jeu).

## Armes, raretés et box

- On commence avec un **Blaster commun** (et une Box Souche offerte).
- Les **box** s'achètent avec les noyaux (Box Souche 25, Box Mutante 70) ou se gagnent sur les boss et parfois les élites.
- 5 raretés : Commun, Rare, Épique, Légendaire, Mythique. Plus c'est rare, plus l'arme est forte (dégâts, recharge, zone ; Légendaire et Mythique commencent niveau 2, Mythique +1 projectile).
- **Inventaire** (menu uniquement) : équiper son arme de départ, fusionner 3 exemplaires identiques en une rareté supérieure.
- En partie, seules les armes possédées apparaissent, avec la meilleure rareté possédée.
- **1 seule arme à la fois** au départ ; le talent **Arsenal** du labo ajoute des emplacements (jusqu'à 4 armes : 120, 260 puis 450 noyaux).
- Une partie abandonnée ne rapporte aucun noyau (les box trouvées sont conservées).
- 15 armes, dont Lance-flammes, Rayon cryo, Katana néon, Singularité (0.4) et Tourelle (0.8, évolution « Sentinelles » : tourelles volantes qui suivent le joueur).

## Boss

Quatre boss au style néon, chacun avec ses attaques : **La Ruche** (renforts), **L'Œil** (spirales de projectiles), **Le Titan** (charges rapides, très résistant) et **La Couronne** (boss final).

## Carrière (v0.8)

- 25 niveaux répartis en 5 mondes (Épiderme, Plasma, Lymphe, Moelle, Cortex), chacun avec son fond néon.
- Chaque niveau : 10 manches, boss aux manches 5 et 10. La difficulté monte doucement dans un niveau et de façon linéaire d'un niveau à l'autre.
- Carte façon « chemin » : niveau suivant débloqué en cas de victoire, 1 à 3 étoiles selon les PV restants (40 % et 75 %).
- Bonus de noyaux au premier passage et pour chaque nouvelle étoile ; Box Mutante sur le boss de fin de monde.
- Le mode **Infini** reste disponible (le fond change tous les 10 vagues).

## Modes

- **Solo** : fonctionne entièrement hors ligne.
- **Duo en ligne** (suspendu depuis la 0.5, `DUO_ENABLED` dans `js/config.js`) : chacun joue sur son appareil. L'un crée la partie et partage le code (ou le lien `?join=CODE`), l'autre le saisit. La connexion passe d'un navigateur à l'autre (WebRTC via [PeerJS](https://peerjs.com/)) ; la partie tourne chez l'hôte.
  - XP et niveaux communs, mais chacun choisit sa carte à chaque niveau.
  - Porte-monnaie et boutique séparés ; la vague suivante démarre quand les deux sont prêts.
  - Un joueur à terre est réanimé si son partenaire reste 3 s à côté de lui.

Pour tester le duo sans internet, ouvrir deux onglets avec `?net=local`.
