# Antikor : contexte du projet

Document de passation pour reprendre le travail dans une nouvelle conversation. À lire avant toute modification.

## En bref

- **Antikor** est un jeu d'arcade de survie (« survivor » / auto-shooter) à thème biologique et néon : le joueur est la dernière défense d'un corps envahi par des germes. Les armes tirent toutes seules, on se déplace, on monte de niveau, on achète entre les vagues.
- Le jeu s'appelait **« Néon Horde »** jusqu'à la v0.7. Il a été renommé parce qu'un jeu Steam porte ce nom.
- **Tout le jeu tient dans un seul fichier : `index.html`** (≈ 2 200 lignes, ≈ 225 Ko : HTML, CSS et JS en IIFE, sans dépendance ni build).
- **Langue :** l'interface, les commentaires du code et les échanges avec l'utilisateur sont en **français**. Les messages de commit sont en anglais.
- **Version actuelle : 0.8.1.** Elle est affichée en bas à droite du jeu (`const VERSION`).

## Dépôt et publication

- Dépôt GitHub : `antoinecorcos/neonhorde`, branche **`main`**, publiée telle quelle par **GitHub Pages** (Settings → Pages → branche `main`, dossier `/`).
- URL : https://antoinecorcos.github.io/neonhorde/ (le dépôt sera peut-être renommé plus tard ; l'utilisateur a dit « on verra le dépôt plus tard »).
- Usage établi : **chaque mise à jour validée est commitée et poussée directement sur `main`**, ce qui la met en ligne. On incrémente `VERSION` dans `index.html` et la ligne « Version actuelle » du `README.md`.
- Fichiers :
  - `index.html` : le jeu ;
  - `README.md` : présentation et règles ;
  - `manifest.webmanifest` : nom « Antikor », icônes ;
  - les icônes : `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `favicon-32.png`, `favicon-64.png`. Elles représentent le petit monstre vert (« walker ») du jeu sur fond sombre.
- ⚠️ À vérifier : un commit de l'utilisateur (« icon update ») a changé `href="apple-touch-icon.png"` en `href="/apple-touch-icon.png"`. Sur un site de projet GitHub Pages (`/neonhorde/`), le chemin absolu pointe vers la racine du domaine : l'icône iOS est probablement introuvable. À confirmer avec l'utilisateur avant de corriger.

## L'utilisateur et sa façon de travailler

- Il n'est pas développeur. Il teste sur PC et sur iPhone (ajout à l'écran d'accueil iOS) et donne des retours de design et de jeu par petites séries numérotées.
- Il apprécie qu'on propose des idées et qu'on soit créatif, mais il tranche franchement : par exemple « le nouveau fond, ça va pas du tout ».
- Il aime le style **néon sobre**, le côté **addictif** (box, raretés, étoiles, carte de niveaux) et la **vibe biologique**.
- Réponses attendues en français, claires, sans jargon. On résume ce qui a changé et ce qui a été testé.

## Fonctionnalités actuelles (v0.8.1)

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

## Repères dans le code (`index.html`)

- **CSS :** variables de couleur dans `:root` (`--cyan`, `--mag`, `--gold`, `--core`…). Les panneaux ont des coins coupés (classe `.cut`), avec les polices Bungee (titres) et Chakra Petch (texte).
- **Écrans** (`.screen`, affichés avec `show(id)`) : `scr-menu`, `scr-lab`, `scr-inv`, `scr-map`, `scr-level`, `scr-shop`, `scr-pause`, `scr-over`. Plus le calque `#box-open` et `#map-pop`.
- **Constantes principales :**
  - `VERSION`, `DUO_ENABLED` ;
  - `SAVE_KEY='antikor-v1'` (l'ancienne `neon-horde-v1` est reprise automatiquement) ;
  - `WEAPONS`, `PASSIVES`, `TALENTS`, `RARITY`, `BOXES`, `MODES`, `WORLDS`, `CAREER_LEVELS`, `BOSSV`, `ETYPES`, `ICON` (icônes SVG).
- **État :**
  - `G` : la partie ;
  - `P` : le joueur « courant », utilisé par le code des armes, avec `withP()` ;
  - `ME` : l'index du joueur local ;
  - `G.players` : la liste des joueurs ;
  - `WM` : le multiplicateur de dégâts de la rareté pendant la mise à jour d'une arme.
- **Sauvegarde** (`save`, `persist()`) : `cores`, `talents`, `inv` (`[{u,id,r}]`), `equip`, `uid`, `boxes {std,prem}`, `career {max,stars}`, `best`, `mode`, `players`, `muted`, `runs`, `wins`, `totalKills`. Une fonction de nettoyage s'exécute au chargement et migre les anciennes sauvegardes.
- **Boucle :** `frame()` → `update()` (simulation) → `render()` (canvas 2D) → `updateHUD()`. Le sol est dessiné par `floorPat` / `bossPat` (motif du monde 1) ou par `drawProcFloor()` (mondes 2 à 5, dessinés directement à l'écran).
- **Effets :** `burst`, `spark`, `ring`, `addText`, `banner`, `toast`… Ces fonctions appellent `rec()`, qui sert au duo.
- **Débogage :** `window.__AK` expose `G`, `P`, `NET`, `startGame`, `act`, `chooseLevel`.

## Méthode de travail

- Les modifications se font avec de petits scripts Python de remplacement, chacun vérifiant que le texte à remplacer apparaît exactement une fois, puis avec un contrôle de syntaxe :
  `sed -n '/<script>/,/<\/script>/p' index.html | sed '1d;$d' > /tmp/x.js && node --check /tmp/x.js`
- **Tests dans un vrai navigateur avec Playwright** (Chromium déjà installé) :
  - lancer un serveur local : `python3 -m http.server 8765 --bind 127.0.0.1` dans le dossier du dépôt ;
  - piloter la partie via `__AK` (forcer l'XP, `G.waveT=G.waveDur` pour finir une vague, PV infinis…) ;
  - prendre des captures et les regarder ; vérifier qu'il n'y a pas d'erreur console ;
  - tester l'absence de défilement du menu sur plusieurs tailles et le rendu mobile (390×844).
- Pièges déjà rencontrés :
  - les identifiants HTML en double (par exemple `btn-next` existe déjà dans la boutique) ;
  - Playwright refuse de cliquer sur un élément `aria-disabled` : utiliser `{force:true}`.
- L'environnement de développement n'a pas accès à unpkg ni à 0.peerjs.com. On a donc testé le duo avec un serveur PeerJS local (paquet npm `peer`).

## Historique des versions

- **0.1–0.2 :** fichier d'origine « Néon Horde » mis sur GitHub Pages.
- **0.3 :** duo en ligne PeerJS (hôte avec code, lien d'invitation, réanimation, boutiques séparées), puis journal de connexion et configuration STUN/TURN.
- **0.4 :** raretés, box, inventaire, fusion ; 4 nouvelles armes ; numéro de version visible.
- **0.5 :** duo suspendu ; icônes des talents ; box déplacées dans le labo ; 4 designs de boss.
- **0.6 :** icône du site (monstre vert), box dans le labo sans sous-menu, emplacements d'armes (talent Arsenal), abandon sans noyaux.
- **0.7 :** renommage en **Antikor**, bouton Labo attractif, nouvelles box en capsule. **0.7.1 :** Labo en haut à droite, JOUER plus gros. **0.7.2 :** noyaux violets et pièces dorées, infobulles, fond de boss. **0.7.3 :** fond de boss = grille d'origine éclaircie. **0.7.4 :** logo sur une ligne.
- **0.8 :** mode Carrière (25 niveaux, carte, étoiles), 5 fonds de monde, Tourelle et Servomoteur.
- **0.8.1 :** carte en pleine largeur sur PC, « ? » sur les box, Arsenal lié aux mondes, joystick fixe.

## Pistes en attente

- **Base de données de joueurs** (comptes, sauvegarde en ligne, classement) : envisagée avec **Supabase** (ou Firebase), le jeu restant sur GitHub Pages. Reportée par l'utilisateur.
- **Renommer le dépôt** `neonhorde` → `antikor` : cela change l'URL du site. Reporté.
- **Réactiver et mettre à jour le duo**, quand l'utilisateur le demandera.
- **Équilibrage :** les chiffres de difficulté de la carrière, des prix et des chances des box sont un premier réglage, à ajuster selon les retours.
- Idées proposées mais pas encore validées :
  - box quotidienne ;
  - défis qui rapportent des box ;
  - garantie d'une Épique toutes les 10 box ;
  - boomerang ;
  - effets uniques pour les armes Mythiques ;
  - améliorations au-delà du niveau 5 quand tous les emplacements d'armes sont pris.
