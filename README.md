# 👾 Invasion AR

Jeu de tir en réalité augmentée géolocalisé pour smartphone : des envahisseurs en pixel-art atterrissent
autour du joueur dans le monde réel et foncent sur sa position. Il les repère sur la carte, se déplace vers
eux, et quand ils sont à moins de 30 m ils apparaissent dans le flux caméra : il vise en tournant sur lui-même
et touche l'écran pour tirer.

**Jouer :** https://picsou06.github.io/invasion-ar/ (sur smartphone, autoriser caméra, mouvement et position)
Ajouter `?debug` à l'URL pour afficher les valeurs des capteurs d'orientation et les repères N/E/S/O.

Projet du TD4 « programmer avec une IA » du cours *Sensibilisation à la programmation multimédia*
([vestri/initiation-multimedia](https://github.com/vestri/initiation-multimedia)).
Le déroulé du développement avec l'IA est dans [`PROMPTS.md`](PROMPTS.md).

## Fonctionnalités
- Flux caméra arrière en fond, scène **Three.js** transparente dont la caméra suit l'orientation du téléphone
  (`deviceorientationabsolute` sur Android, `webkitCompassHeading` sur iOS)
- 3 types d'aliens en voxels animés, vagues de plus en plus rapides, 3 vies, score et meilleur score
- Tir par Raycaster depuis le viseur, explosions en particules
- Position du joueur par **GPS** (lissée), aliens placés en mètres autour de lui et convertis en lat/lon
- Radar 2D de 150 m orienté selon le regard, flèches au bord de l'écran vers les aliens proches hors champ
- Mini-carte **Leaflet** qui suit le joueur : zone de tir de 30 m et tous les aliens
- **ml5.js** (COCO-SSD) détecte les humains dans la caméra : ils sont encadrés, et leur tirer dessus coûte 25 points
- Musique 8-bit originale et sons rétro générés avec la Web Audio API
- Mode PC : souris/flèches pour viser, ZQSD/WASD pour se déplacer, clic/Espace pour tirer

## Lancer en local
```bash
npm install
npm run dev
```
Puis http://localhost:5173/. La caméra et les capteurs du téléphone nécessitent HTTPS : tester sur la version GitHub Pages.

## Structure
| Fichier | Rôle |
|---|---|
| `src/main.js` | Point d'entrée, boucle de jeu, branchement des modules |
| `src/scene.js` | Renderer, scène, caméra, repères cardinaux |
| `src/orientation.js` | Capteurs d'orientation → rotation de la caméra, mode souris/clavier |
| `src/cameraFeed.js` | Flux caméra arrière |
| `src/aliens.js` | Modèles voxel, déplacement et gestion des aliens |
| `src/shooting.js` | Tir et rayons laser |
| `src/effects.js` | Explosions en particules |
| `src/radar.js` | Radar 2D |
| `src/indicators.js` | Flèches vers les aliens hors champ |
| `src/player.js` | Position du joueur (GPS lissé ou clavier), conversion mètres ↔ lat/lon |
| `src/minimap.js` | Mini-carte Leaflet |
| `src/game.js` | Règles : vagues, vies, score |
| `src/hud.js` | Affichage du score, bannières, écrans |
| `src/audio.js` | Effets sonores synthétisés |
| `src/music.js` | Musique 8-bit en boucle (séquenceur Web Audio) |
| `src/humanDetector.js` | Détection des humains avec ml5.js et pénalité de tir |

Déploiement automatique sur GitHub Pages à chaque push sur `main` (`.github/workflows/deploy.yml`).
