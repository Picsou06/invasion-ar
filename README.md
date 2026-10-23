# 👾 Invasion AR

Jeu de tir en réalité augmentée pour smartphone : des envahisseurs en pixel-art arrivent de toutes les
directions dans le flux caméra, le joueur tourne sur lui-même pour viser et touche l'écran pour tirer.

**Jouer :** https://picsou06.github.io/invasion-ar/ (sur smartphone, autoriser caméra, mouvement et position)
Ajouter `?debug` à l'URL pour afficher les valeurs des capteurs d'orientation.

Projet du TD4 « programmer avec une IA » du cours *Sensibilisation à la programmation multimédia*
([vestri/initiation-multimedia](https://github.com/vestri/initiation-multimedia)).
Le déroulé du développement avec l'IA est dans [`PROMPTS.md`](PROMPTS.md).

## Fonctionnalités
- Flux caméra arrière en fond, scène **Three.js** transparente dont la caméra suit l'orientation du téléphone
  (`deviceorientationabsolute` sur Android, `webkitCompassHeading` sur iOS)
- 3 types d'aliens en voxels animés, vagues de plus en plus rapides, 3 vies, score et meilleur score
- Tir par Raycaster depuis le viseur, explosions en particules
- Radar 2D orienté selon le regard, flèches au bord de l'écran vers les aliens hors champ
- Mini-carte **Leaflet** : position GPS réelle du joueur (sa base) et aliens convertis en coordonnées lat/lon
- Sons rétro générés avec la Web Audio API
- Mode PC : souris/flèches pour viser, clic/Espace pour tirer

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
| `src/minimap.js` | Mini-carte Leaflet et conversion mètres → lat/lon |
| `src/game.js` | Règles : vagues, vies, score |
| `src/hud.js` | Affichage du score, bannières, écrans |
| `src/audio.js` | Effets sonores synthétisés |

Déploiement automatique sur GitHub Pages à chaque push sur `main` (`.github/workflows/deploy.yml`).
