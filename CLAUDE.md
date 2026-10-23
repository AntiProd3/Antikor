# Antikor : contexte du projet

Document de passation pour reprendre le travail dans une nouvelle conversation. À lire avant toute modification.

## En bref

- **Antikor** est un jeu d'arcade de survie (« survivor » / auto-shooter) à thème biologique et néon : le joueur est la dernière défense d'un corps envahi par des germes. Les armes tirent toutes seules, on se déplace, on monte de niveau, on achète entre les vagues.
- Le jeu s'appelait **« Néon Horde »** jusqu'à la v0.7. Il a été renommé parce qu'un jeu Steam porte ce nom.
- **Le jeu est découpé en modules ES** depuis la v0.8.2 : `index.html` (le squelette HTML des écrans), `css/` et `js/`. Aucune dépendance, aucune étape de construction : GitHub Pages sert les fichiers tels quels. Avant, tout tenait dans un seul `index.html` de 2 200 lignes.
- **Langue :** l'interface, les commentaires du code et les échanges avec l'utilisateur sont en **français**. Les messages de commit sont en anglais.
- **Version actuelle : 0.8.2.** Elle est affichée en bas à droite du jeu (`VERSION` dans `js/config.js`).

## Dépôt et publication

- Dépôt GitHub : `AntiProd3/antikor` (compte créé pour le projet ; anciennement `antoinecorcos/neonhorde`, transféré et renommé en octobre 2026), branche **`main`**, publiée telle quelle par **GitHub Pages** (Settings → Pages → branche `main`, dossier `/`).
- URL : https://antiprod3.github.io/antikor/ (l'ancienne adresse ne redirige pas ; les sauvegardes locales de l'ancienne adresse ne sont pas reprises).
- Le serveur (duo, comptes, classement) sera dans un **dépôt privé séparé** du même compte. Ne jamais passer ce dépôt public en privé (GitHub Pages s'arrêterait) et ne rien y mettre de secret.
- Usage établi : **chaque mise à jour validée est commitée et poussée directement sur `main`**, ce qui la met en ligne. On incrémente `VERSION` dans `js/config.js` et la ligne « Version actuelle » du `README.md`.
- Fichiers :
  - `index.html`, `css/`, `js/` : le jeu (voir « Repères dans le code ») ;
  - `tests/sim-bench.mjs` et `package.json` : test de la simulation sous Node (le `package.json` ne sert qu'à Node, pas au site) ;
  - `.prettierrc.json` / `.prettierignore` : réglages de mise en forme du code ;
  - `test-serveur.html` : page de test du serveur de jeu (comptes, salles), copie de `public/test.html` du dépôt privé AntiBack ; non liée depuis le jeu. Ne pas la modifier ici : recopier depuis AntiBack ;
  - `README.md` : présentation et règles ;
  - `manifest.webmanifest` : nom « Antikor », icônes ;
  - les icônes : `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `favicon-32.png`, `favicon-64.png`. Elles représentent le petit monstre vert (« walker ») du jeu sur fond sombre.
- L'icône iOS utilise un chemin relatif (`href="apple-touch-icon.png"`), corrigé en v0.8.2 : un chemin absolu `/…` pointerait vers la racine du domaine et non vers `/antikor/`. Même règle pour tout nouveau fichier : **toujours des chemins relatifs**.
- Cache : GitHub Pages autorise les navigateurs à garder les fichiers 10 minutes. Juste après une mise en ligne, un joueur peut brièvement avoir un mélange d'anciens et de nouveaux modules ; un rechargement quelques minutes plus tard règle le problème.

## L'utilisateur et sa façon de travailler

- Deux personnes travaillent sur le projet : **Antoine** (propriétaire du dépôt) et **Tibo**, qui gère le Raspberry Pi et la future partie serveur (feuille de route : serveur Node autoritaire sur le Pi, Tailscale Funnel, SQLite ; voir « Pistes en attente »).

- Il n'est pas développeur. Il teste sur PC et sur iPhone (ajout à l'écran d'accueil iOS) et donne des retours de design et de jeu par petites séries numérotées.
- Il apprécie qu'on propose des idées et qu'on soit créatif, mais il tranche franchement : par exemple « le nouveau fond, ça va pas du tout ».
- Il aime le style **néon sobre**, le côté **addictif** (box, raretés, étoiles, carte de niveaux) et la **vibe biologique**.
- Réponses attendues en français, claires, sans jargon. On résume ce qui a changé et ce qui a été testé.

## Fonctionnalités actuelles (v0.8.2)

### Menu
- Logo **ANTIKOR** sur une ligne : « ANTI » en cyan, « KOR » en rose néon qui clignote. Sa taille suit la colonne (unités `cqi`).
- Description : « Tiens jusqu'à la dernière vague. Ouvre des box, collectionne les armes rares et fais évoluer ton arsenal. » L'utilisateur a refusé la version « Le corps est envahi… ».
- **Joueurs :** Solo / Duo en ligne. Le duo est **grisé et suspendu** (voir plus bas).
- **Mode :** Carrière / Infini.
- **Arme équipée** (carte avec la rareté) et bouton **Inventaire**.
- Gros bouton **JOUER**. En Carrière, il ouvre la carte.
- À droite :
  - le grand bouton **LABO** animé (bordure dégradée, box qui flotte, noyaux, badge « X box à ouvrir » qui pulse) ;
  - les records ;
  - les commandes ;
  - le bouton son.
- Le menu doit tenir sans défilement sur PC, testé de 1280×720 à 1920×1080.

### Modes
- **Carrière** (v0.8) :
  - 25 niveaux (`CAREER_LEVELS`), répartis en **5 mondes de 5 niveaux** (`WORLDS`) : Épiderme (grille bleue d'origine), Plasma (hexagones roses), Lymphe (points vert d'eau), Moelle (triangles ambre), Cortex (circuit violet).
  - Chaque niveau compte **10 manches de 30 s**, avec un **boss aux manches 5 et 10**.
  - Les boss de chaque niveau sont fixes (`careerBosses(L)`). La Couronne garde la fin de chaque monde (niveaux 5, 10…).
- **Difficulté de la carrière :** `progress()` et `computeScale()`. Avec `t` la progression dans le niveau (0→1) et `k = niveau−1` :
  - `hp = (1+.13k)(1+1.7t+2.4t²)` ;
  - `dmg = (1+.09k)(1+1.2t)` ;
  - `spd` augmente légèrement ;
  - la densité suit `p = .05+.045k+.6t`.
  - But : une montée **régulière dans un niveau et linéaire entre niveaux**. L'ancien Marathon était trop facile au milieu et injouable à la fin.
- **Étoiles :** 1★ si on termine, 2★ avec ≥ 40 % des PV à la fin, 3★ avec ≥ 75 %.
- **Récompenses :** bonus de noyaux au premier passage (`10+3L`), +5 par nouvelle étoile. Le niveau suivant est débloqué (`save.career.max`).
- **Carte** façon Candy Crush (`#scr-map`, `renderMap()`) :
  - chemin sinueux en SVG, niveau 1 en bas, bandes de couleur par monde sur toute la largeur ;
  - nœuds avec étoiles ; le niveau courant pulse ; les niveaux 5, 10… portent « Boss du monde » ;
  - toucher un nœud ouvre une fiche (boss, difficulté, étoiles, bonus) avec JOUER.
- **Écran de fin carrière :** « NIVEAU X TERMINÉ », étoiles animées, boutons « Niveau suivant → », « Rejouer »/« Réessayer », « Labo » et « Carte ».
- **Infini :** l'ancien mode sans fin. Le fond change toutes les 10 vagues et un boss arrive toutes les 5 vagues. Sprint et Marathon ont été supprimés en v0.8 ; les sauvegardes sont migrées vers la Carrière.

### Partie
- Déplacement : ZQSD, WASD ou flèches. Sur tactile, un joystick apparaît là où le doigt se pose ; **son centre reste fixe** (v0.8.1).
- Les armes tirent seules. Les gemmes donnent de l'XP ; à chaque niveau on choisit une carte parmi 3 (4 avec le talent).
- Une boutique s'ouvre entre les vagues et se paie en **pièces**.
- Il y a des élites (avec coffre), des événements (encerclement, nuée, mur) et des bonus au sol (cœur, aimant, bombe).
- **Emplacements d'armes :** une partie commence avec **1 seule arme** (celle équipée). Le talent **Arsenal** monte jusqu'à 4 armes.
- **Abandon :** aucun noyau gagné, mais les box trouvées sont gardées.
- **Manches de boss :** le même sol en **version éclaircie** (palettes `FLOOR_LIT` / `bgLit`), avec un fondu, et les bords de l'écran qui battent comme un cœur à la couleur du boss. Un fond « tissu infecté » avait été essayé puis **rejeté** par l'utilisateur.
- **4 boss** (`BOSSV`), dessinés dans le même style néon :
  - **La Couronne** (rose) : charges, anneaux de projectiles, renforts ;
  - **La Ruche** (jaune) : nombreux renforts ;
  - **L'Œil** (bleu) : spirales de projectiles ;
  - **Le Titan** (orange) : charges rapides, très résistant.
  - Leur nom s'affiche sous la barre de vie.

### Armes, raretés, box (méta-progression)
- **15 armes :** Blaster, Fusil à pompe, Drones, Arc électrique, Disque, Molotov, Mines, Roquettes, Champ de force, Laser rotatif, Lance-flammes, Rayon cryo, Katana néon, Singularité, **Tourelle** (v0.8).
  - Chacune a 5 niveaux et une **évolution** au niveau 5, qui demande un équipement précis.
  - Évolution de la Tourelle : « Sentinelles », trois tourelles volantes qui suivent le joueur. Elle demande le **Servomoteur**.
- **Équipements (passifs) :** 15 au total, dont Réservoir (portée), Puce tactique (dégâts contre élites et boss) et Servomoteur (vitesse et cadence). Au maximum 6 en partie.
- **Raretés** (`RARITY`) : Commun, Rare, Épique, Légendaire, Mythique.
  - Elles augmentent les dégâts et la zone, et réduisent la recharge.
  - Une arme Légendaire ou Mythique commence au niveau 2, et la Mythique tire un projectile de plus.
- **Box** (`BOXES`) :
  - **Box Souche** : 25 noyaux, de Commun à Mythique (0,4 %).
  - **Box Mutante** : 70 noyaux, au moins Rare.
  - Les box tombent aussi des boss (parfois des élites). Seul le boss de fin de monde donne une Box Mutante.
  - Chaque box donne 1 arme au hasard.
  - L'ouverture est animée : capsule bio hexagonale qui tremble et change de couleur jusqu'à la rareté obtenue.
  - Un nouveau joueur reçoit 1 Box Souche.
- **Inventaire** (menu uniquement) : on y équipe l'arme de départ, et **3 exemplaires identiques fusionnent** en une rareté supérieure. En partie, **seules les armes possédées** apparaissent, avec la meilleure rareté possédée.
- **Labo :**
  - les deux box directement en haut, sans sous-menu ;
  - les **talents permanents** avec icônes et couleurs : Arsenal, Vitalité, Puissance, Agilité, Magnétisme, Fortune, Capital, Blindage, Relance, Quatrième carte, Seconde chance.
  - **Arsenal :** 120, 260 puis 450 noyaux. Le niveau n ne s'achète **qu'une fois le monde n atteint** en carrière (v0.8.1).
- **Deux monnaies, à ne pas confondre :**
  - les **noyaux** sont **violets** (`--core:#c77dff`) : monnaie permanente gagnée en fin de partie, dépensée au labo ;
  - les **pièces** sont **dorées** : monnaie de la partie, dépensée dans la boutique entre les vagues, perdue à la fin.
- **Infobulles** (`data-tip`, `tipData()`, `#tip`) :
  - au survol sur PC, via un bouton « ? » sur tactile (et toujours visible sur les box) ;
  - armes : statistiques du niveau 1 au niveau 5 avec la rareté, progression et évolution ;
  - talents : effet actuel et suivant, coût, explication ;
  - box et monnaies.

### Duo en ligne : suspendu
- Il est désactivé par `const DUO_ENABLED=false` : bouton grisé « Bientôt de retour », lien `?join=` ignoré.
- **Consigne de l'utilisateur : ne pas maintenir le duo pendant les évolutions.** On le mettra à jour quand il sera réactivé. Le code reste dans le fichier : sections « RÉSEAU », `snap()`/`applySnap()`, `guestStart`, `hostGame`/`joinGame`.
- Architecture :
  - L'hôte fait tourner la simulation et envoie un instantané environ 20 fois par seconde. L'invité déplace lui-même son vaisseau et envoie ses actions avec `act()`.
  - La connexion passe par PeerJS 1.5.4, chargé depuis unpkg, avec le serveur public 0.peerjs.com et des serveurs STUN/TURN.
  - Un journal de connexion copiable est disponible.
  - `?net=local` permet de tester entre deux onglets (BroadcastChannel), et `?signal=hôte:port` d'utiliser un autre serveur PeerJS.
- Il a fonctionné en vrai entre deux appareils (v0.3). Les fonctionnalités ajoutées depuis la v0.4 ne sont **pas toutes synchronisées** : carrière, thèmes, tourelle, etc.

## Repères dans le code

### Organisation des fichiers

Chaque fichier commence par une ligne qui dit ce qu'il contient. Les imports en tête de fichier indiquent d'où vient chaque fonction.

- `index.html` : le HTML de tous les écrans, les feuilles de style, puis `<script type="module" src="js/main.js">`.
- `css/` : les styles, chargés **dans cet ordre** (l'ordre compte pour la cascade) : `base`, `menu`, `collection` (raretés, inventaire, box, bouton labo), `map`, `tooltips`, `duo`, `screens` (cartes, boutique, labo, fin), `hud` (+ bannière).
- `js/main.js` : démarrage (`init…()` de chaque module) et boucle `frame()`.
- `js/data/` : **les réglages du jeu, sans code** ; c'est là qu'on équilibre.
  - `weapons.js` : les 15 armes (textes, `stats(niveau)`, évolution) ;
  - `passives.js` (équipements), `talents.js` (labo + textes d'infobulle `TFX`/`TNOTE`), `loot.js` (`RARITY`, `BOXES`), `career.js` (`MODES`, `WORLDS`, `CAREER_LEVELS`, boss par niveau), `enemies.js` (`ETYPES`, `MAX_E`, `BOSSV`).
- `js/sim/` : **la simulation**. Elle n'accède jamais à la page (ni `document`, ni `window`, ni sauvegarde, ni son) et tourne aussi sous Node.
  - `state.js` : `G`, `P`, `ME`, `WM`, `view` (demi-taille visible `hw`/`hh`), `settings`. Les autres modules lisent ces variables directement mais les modifient **uniquement avec `setG`, `setP`, `setME`, `setWM`, `setView`** (règle des modules ES) ;
  - `hooks.js` : ce que la simulation demande à l'interface (son, bannière, notification, écran, fin de partie…). Le client les remplit dans `js/ui/game.js` (`initGame`) ; sous Node elles restent vides ;
  - `update.js` (une image), `weapons.js` (comportement des armes, `this` = l'arme de `data/weapons.js`), `combat.js`, `enemies.js`, `projectiles.js`, `pickups.js`, `spawn.js` (difficulté `progress()`/`computeScale()`, apparitions, événements), `boss.js`, `waves.js` (`newRun`, `startWave`, `endWave`), `options.js` (cartes de niveau/coffre/boutique et prix), `flow.js` (actions `doAct`, montée de niveau, boutique, pause, `gameOver`), `fx.js` (effets et `sfx()`, enregistrés par `rec()` pour le duo), `grid.js`, `player.js` ;
  - la commande de chaque joueur arrive dans `pl.in = [x, y]`, remplie par `main.js` (`stepGame`) à partir de `inputVec()`.
- `js/render/` : le dessin sur le canvas. `render.js` (image complète, démo du menu), `world.js` (tout ce qui est dans le monde), `floor.js` (sols des mondes), `canvas.js` (taille, `ZOOM`, `HW`/`HH`), `sprites.js` (dessins des monstres, créés par `initSprites()`).
- `js/ui/` : les écrans HTML. `game.js` (lancer/quitter une partie, `act()`, branchement des hooks), `menu.js`, `map.js`, `lab.js`, `boxes.js`, `inventory.js`, `cards.js` (écrans de niveau et de boutique), `over.js` (fin de partie, étoiles, noyaux), `hud.js`, `tooltips.js`, `keyboard.js`, `duo.js`, `dom.js` (`$`, `show`, notifications).
- `js/net/` : le duo suspendu (`net.js` connexion PeerJS, `sync.js` instantanés et affichage chez l'invité).
- `js/save.js` (sauvegarde), `js/meta.js` (talents achetés, armes possédées, `mySpec()`), `js/audio.js` (sons), `js/input.js` (clavier, joystick), `js/icons.js` (icônes SVG), `js/util.js`, `js/config.js` (`VERSION`, `DUO_ENABLED`).
- Les deux fichiers de dessins (`js/icons.js`, `js/render/sprites.js`) restent volontairement compacts ; inutile de les lire pour comprendre le jeu.

### Points clés

- **Écrans** (`.screen`, affichés avec `show(id)`) : `scr-menu`, `scr-lab`, `scr-inv`, `scr-map`, `scr-level`, `scr-shop`, `scr-pause`, `scr-over`. Plus le calque `#box-open` et `#map-pop`.
- **CSS :** variables de couleur dans `:root` (`css/base.css` : `--cyan`, `--mag`, `--gold`, `--core`…). Coins coupés avec la classe `.cut`, polices Bungee (titres) et Chakra Petch (texte).
- **État :** `G` la partie, `G.players` les joueurs, `P` le joueur « courant » (utilisé par le code des armes, changé avec `withP()`), `ME` l'index du joueur local, `WM` le multiplicateur de dégâts de la rareté pendant la mise à jour d'une arme.
- **Sauvegarde** (`save`, `persist()`, clé `antikor-v1`, l'ancienne `neon-horde-v1` est reprise) : `cores`, `talents`, `inv` (`[{u,id,r}]`), `equip`, `uid`, `boxes {std,prem}`, `career {max,stars}`, `best`, `mode`, `players`, `muted`, `runs`, `wins`, `totalKills`. Un nettoyage s'exécute au chargement de `save.js`.
- **Boucle :** `frame()` → `stepGame()` → `update()` (simulation) → `render()` → `updateHUD()`.
- **Pour le futur serveur** (phase 0 du bilan serveur, faite en v0.8.2) : la simulation n'a plus de lien avec la page, les sprites sont créés dans `initSprites()`, la sauvegarde est sortie de `newRun`, et `tests/sim-bench.mjs` fait tourner une partie sous Node. Reste à faire côté serveur : fixer `view` avec `setView()` (aujourd'hui la taille de l'écran du joueur), et transformer en identifiants les quelques références directes entre objets (cible des roquettes `b.tg`, cibles du cryo `w.tgs`, `G.boss`).
- **Débogage :** `window.__AK` expose `G`, `P`, `NET`, `startGame`, `act`, `chooseLevel`, `keys` et `tick(dt)` (une étape de simulation, pour les tests).

## Méthode de travail

- Le jeu se teste avec un serveur local (les modules ne s'ouvrent pas en double-cliquant sur `index.html`) : `python3 -m http.server 8765 --bind 127.0.0.1` dans le dossier du dépôt, puis http://127.0.0.1:8765/.
- **Mise en forme :** une instruction par ligne, réglages Prettier dans `.prettierrc.json` (`npx prettier --write js css tests`). Les fichiers de dessins sont exclus (`.prettierignore`).
- **Contrôles avant de pousser :**
  - `node --check` sur les fichiers modifiés, et vérifier qu'aucun module de `js/sim/` n'importe depuis `ui/`, `render/`, `net/`, `save.js`, `audio.js` ou `input.js` ;
  - `node tests/sim-bench.mjs [ticks] [mode] [niveau] [--duo] [--mortel]` : une partie sous Node, avec le temps par tick ;
  - **tests dans un vrai navigateur avec Playwright** (Chromium déjà installé) : piloter la partie via `__AK` (forcer l'XP, `G.waveT=G.waveDur` pour finir une vague, PV infinis…), prendre des captures et les regarder, vérifier qu'il n'y a pas d'erreur console, l'absence de défilement du menu (1280×720 à 1920×1080) et le rendu mobile (390×844).
- **Pour un changement qui ne doit rien changer au jeu** (réorganisation) : remplacer `Math.random` par un générateur à graine et `performance.now` par une horloge simulée, appeler `__AK.tick(1/60)` en boucle avec des touches scriptées, et comparer la trace (vague, éliminations, positions, PV, XP…) avec celle de la version précédente. Elle doit être identique. C'est ainsi qu'a été vérifié le découpage de la v0.8.2.
- Pièges déjà rencontrés :
  - les identifiants HTML en double (par exemple `btn-next` existe déjà dans la boutique) ;
  - Playwright refuse de cliquer sur un élément `aria-disabled` : utiliser `{force:true}` ;
  - une variable importée (`G`, `P`, `joy`…) ne peut pas être réaffectée depuis un autre module : passer par sa fonction `set…()`.
- L'environnement de développement n'a pas accès à unpkg ni à 0.peerjs.com. Le duo se teste avec `?net=local` (deux onglets) en passant temporairement `DUO_ENABLED` à `true`, ou avec un serveur PeerJS local (paquet npm `peer`).

## Historique des versions

- **0.1–0.2 :** fichier d'origine « Néon Horde » mis sur GitHub Pages.
- **0.3 :** duo en ligne PeerJS (hôte avec code, lien d'invitation, réanimation, boutiques séparées), puis journal de connexion et configuration STUN/TURN.
- **0.4 :** raretés, box, inventaire, fusion ; 4 nouvelles armes ; numéro de version visible.
- **0.5 :** duo suspendu ; icônes des talents ; box déplacées dans le labo ; 4 designs de boss.
- **0.6 :** icône du site (monstre vert), box dans le labo sans sous-menu, emplacements d'armes (talent Arsenal), abandon sans noyaux.
- **0.7 :** renommage en **Antikor**, bouton Labo attractif, nouvelles box en capsule. **0.7.1 :** Labo en haut à droite, JOUER plus gros. **0.7.2 :** noyaux violets et pièces dorées, infobulles, fond de boss. **0.7.3 :** fond de boss = grille d'origine éclaircie. **0.7.4 :** logo sur une ligne.
- **0.8 :** mode Carrière (25 niveaux, carte, étoiles), 5 fonds de monde, Tourelle et Servomoteur.
- **0.8.1 :** carte en pleine largeur sur PC, « ? » sur les box, Arsenal lié aux mondes, joystick fixe.
- **0.8.2 :** réorganisation du code sans changement de jeu : découpage en modules (`css/`, `js/data`, `js/sim`, `js/render`, `js/ui`, `js/net`), simulation séparée de la page (phase 0 du bilan serveur), test Node `tests/sim-bench.mjs`, chemin de l'icône iOS corrigé.

## Pistes en attente

- **Base de données de joueurs** (comptes, sauvegarde en ligne, classement) : envisagée avec **Supabase** (ou Firebase), le jeu restant sur GitHub Pages. Reportée par l'utilisateur.
- **Réactiver et mettre à jour le duo**, quand l'utilisateur le demandera.
- **Équilibrage :** les chiffres de difficulté de la carrière, des prix et des chances des box sont un premier réglage, à ajuster selon les retours.
- Idées proposées mais pas encore validées :
  - box quotidienne ;
  - défis qui rapportent des box ;
  - garantie d'une Épique toutes les 10 box ;
  - boomerang ;
  - effets uniques pour les armes Mythiques ;
  - améliorations au-delà du niveau 5 quand tous les emplacements d'armes sont pris.
