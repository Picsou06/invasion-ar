# Journal de développement avec l'IA

Outil utilisé : Claude Code (Opus 5.5), dans le terminal.
Les consignes permanentes données à l'IA sont dans [`CLAUDE.md`](CLAUDE.md).

## Feuille de route
- [x] Étape 1 : caméra en fond + scène 3D transparente qui suit l'orientation du téléphone + repères N/E/S/O
- [x] Étape 2 : apparition et déplacement des aliens vers le joueur
- [x] Étape 3 : tir (toucher l'écran, Raycaster depuis le viseur) et explosions
- [x] Étape 4 : radar 2D (canvas) indiquant la direction des ennemis
- [x] Étape 5 : vagues, vies, score, écran de fin
- [x] Étape 6 : mini-carte Leaflet avec la position GPS de la "base"
- [x] Étape 7 : sons, bouton muet, flèches vers les aliens hors champ

---

## Choix du sujet

**Prompts :**
> Voici la demande du prof fais des propositions [...]

> le but est d'utiliser une AI pour dev pas de mettre de l'ia dans le projet

> Recupere ce projet et lis tout: https://github.com/vestri/initiation-multimedia/

> Vas y propose des projets "jeux" sympa avec toutes les informations maintenant

> On part sur le projet Invasion AR

**Résultat :** l'IA a lu les supports des TD1 à TD4 puis proposé 6 jeux ; choix d'« Invasion AR »
(reprend l'exercice 2 du TD3 : objets 3D dans le flux caméra + orientation).

**Correction apportée à l'IA :** sa première proposition mettait de l'IA (ml5.js) *dans* l'application ;
j'ai recadré : l'IA sert à développer, pas à être dans le projet.

---

## Étape 1 - Caméra + orientation

**Premier jet (vanilla JS, Three.js en CDN) puis prompt de recadrage :**
> Fais toutes les etapes
> Pourquoi sans framework? Si il y a un truc adapté utilise le non?
> Code non commenté. Commit en anglais et tu peux mettre des description de chaque fonction en mode javadoc en anglais aussi
> Crée un git avec gh
> et continue d'avancer sur l'app

**Résultat :** passage à **Vite + npm** (three, leaflet) avec déploiement GitHub Pages par GitHub Actions,
code découpé en modules, identifiants en anglais, JSDoc en anglais, plus de commentaires en ligne.
Les cubes de test sont remplacés par des lettres N/E/S/O flottant sur l'horizon.

**Points techniques expliqués par l'IA :**
- `DeviceOrientationControls` n'existe plus dans Three.js : la conversion alpha/beta/gamma → quaternion est réécrite à la main.
- Sur Android, `deviceorientation` donne un alpha *relatif* ; `deviceorientationabsolute` donne le vrai Nord.
  Sur iOS, il faut `webkitCompassHeading` et une demande d'autorisation au clic.
- La caméra et les capteurs ne fonctionnent qu'en HTTPS (d'où GitHub Pages).

**Test PC :** _à compléter_

**Test smartphone (Android) :** caméra en fond OK, lettres N/E/S/O cohérentes avec la réalité.

---

## Étapes 2 à 7 - Développement du jeu

Faites dans la foulée du même prompt (« Fais toutes les etapes [...] continue d'avancer sur l'app »),
avec un commit par étape (voir `git log`). L'IA a vérifié chaque étape en compilant (`npm run build`)
puis en lançant le jeu dans un navigateur sans écran (Edge headless) avec des appuis clavier simulés,
et en regardant une capture d'écran.

| Étape | Ce qui a été fait | Vérification par l'IA |
|---|---|---|
| 2 - Aliens | 3 types d'envahisseurs en voxels (bitmaps pixel-art fusionnées en une géométrie), 2 images d'animation, avancent vers le joueur | Capture : aliens visibles autour du repère N |
| 3 - Tir | Raycaster depuis le centre de l'écran sur des sphères invisibles (plus faciles à toucher), laser, explosion en particules | Pas d'erreur console ; le tir est validé à l'étape 5 grâce au score |
| 4 - Radar | Canvas 2D orienté selon le regard, cône de vision, balayage | Les points du radar correspondent aux aliens visibles |
| 5 - Règles | Vagues (plus d'aliens, plus rapides), 3 vies, bonus de fin de vague, meilleur score en `localStorage` | Score à 80 après une rafale simulée ; écran de fin après 60 s sans tirer |
| 6 - Carte | Leaflet + OSM, position GPS (IUT par défaut), aliens convertis mètres → lat/lon | Carte, radar et vue 3D cohérents |
| 7 - Finitions | Sons Web Audio synthétisés, bouton muet, flèches au bord de l'écran vers les aliens hors champ | Flèches du côté des points du radar |

**Bug trouvé et corrigé pendant l'étape 6 :** la carte Leaflet était créée dans un bloc caché
(`display: none`) donc avec une taille nulle ; il faut appeler `map.invalidateSize()` au moment de l'afficher.

**Bug trouvé en relecture :** sur PC, après un vrai clic sur « Jouer », le bouton gardait le focus ;
chaque appui sur Espace (pour tirer) recliquait dessus et relançait la partie. Les tests avec des événements
simulés en JavaScript ne le montraient pas, il a fallu de vrais événements clavier/souris (CDP `Input.*`).
Correction : `blur()` sur les boutons après le clic + garde contre un double lancement.

**Choix expliqués par l'IA :**
- Les aliens sont générés par code (pixel-art → cubes fusionnés) plutôt que des modèles glTF :
  pas de fichiers lourds, style rétro, et une seule géométrie partagée par type d'alien.
- 1 unité 3D = 1 mètre, ce qui permet de placer les aliens sur la vraie carte (1° de latitude ≈ 111 320 m).
- Les sons sont synthétisés (oscillateurs + bruit blanc) : aucun fichier audio à charger.

**Test smartphone (Android) :** le toucher tire bien, la carte affiche la vraie position GPS.
iPhone : non testé (pas d'appareil disponible).

---

## Étape 8 - Aliens géolocalisés et déplacement du joueur

**Prompt :**
> Pourquoi afficher les cardinaux (Nord sud etc) peut etre pour rendre la map utile en bas afficher que si on est proche
> et que je puisse me deplacer pour tirer sur les aliens. et qu'ils avancent vers moi quand meme si je bouge pas
> et meme si je bouge ils avancent aussi

**Résultat :**
- Les lettres N/E/S/O ne servaient qu'à vérifier l'alignement : elles ne s'affichent plus qu'avec `?debug`.
- Nouveau module `player.js` : la position du joueur vient du GPS (convertie en mètres autour d'une origine,
  lissée pour éviter les sauts de la caméra) ou de ZQSD/WASD sur PC.
- Les aliens apparaissent à 50-110 m dans le monde réel et foncent vers la position **actuelle** du joueur,
  qu'il bouge ou non. Ils ne sont visibles et touchables dans la caméra qu'à moins de 40 m.
- La carte suit le joueur, montre la zone de tir (cercle rouge de 40 m) et tous les aliens, même lointains.
  Le radar couvre 150 m avec la zone de tir en pointillés.
- Difficulté progressive : à chaque vague, plus d'aliens, qui apparaissent plus souvent, plus près et plus rapides.

**Vérification par l'IA :** déplacement de ~100 m vers le nord au clavier (visible sur la carte), 90 points
après une rafale quand les aliens sont arrivés dans la zone, écran de fin après 90 s sans tirer.

---

## Étape 9 - Zone de 30 m, musique 8-bit, détection des humains (ml5.js)

**Prompt :**
> Passe a 30m pour les voir. Peut tu mettre une musique de fond peut etre en 8bit pour respecter le theme.
> Peut tu ajouter ml5.js pour detecter les humains et si tu tire sur un humain tu perd un peu de point.

**Résultat :**
- Les aliens deviennent visibles et touchables à moins de 30 m (au lieu de 40 m).
- `music.js` : musique 8-bit originale en boucle (mélodie en onde carrée, basse en triangle, charleston en bruit blanc),
  jouée par un séquenceur Web Audio ; coupée par le bouton muet, arrêtée à la fin de partie.
- `humanDetector.js` : ml5.js (modèle COCO-SSD) analyse la caméra 5 fois par seconde, encadre les humains
  détectés (« Humain 87% ») et un tir qui ne touche pas d'alien mais tombe sur un humain coûte 25 points.
  Choix : si un alien est devant l'humain, le laser touche l'alien en premier et il n'y a pas de pénalité.

**Bug trouvé et corrigé :** `ml5.objectDetection('cocossd')` renvoie une *Promise* quand p5.js n'est pas utilisé
(contrairement aux exemples de la doc, écrits pour p5) → erreur `detect is not a function`. Correction : `await`.
Trouvé en inspectant l'objet renvoyé dans le navigateur.

**Vérification par l'IA :** ml5 se charge et la boucle de détection tourne sans erreur avec la caméra de test d'Edge.
La détection d'une vraie personne n'a pas pu être testée sur PC → à tester sur téléphone.
