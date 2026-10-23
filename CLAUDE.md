# Invasion AR - Instructions pour l'IA

Jeu web en réalité augmentée : le flux caméra du smartphone en fond, des aliens 3D (Three.js)
arrivent de toutes les directions, le joueur tourne sur lui-même pour viser et touche l'écran pour tirer.
Une mini-carte Leaflet montre la position GPS réelle du joueur (sa "base") et les aliens autour.
Projet du cours "Sensibilisation à la programmation multimédia" (TD4 : programmer avec une IA).

## Stack
- **Vite** (dev server + build), modules ES, JavaScript sans framework UI (le jeu est un canvas 3D, un framework UI n'apporterait rien).
- **three** pour la 3D, **leaflet** pour la carte, installés via npm à versions figées dans `package.json`.
- Sons générés avec la Web Audio API (pas de fichiers audio).
- Déploiement automatique sur **GitHub Pages** par GitHub Actions (`.github/workflows/deploy.yml`) à chaque push sur `main`.

## Règles de code
- Identifiants en **anglais**, textes affichés au joueur en **français**.
- **Pas de commentaires dans le code**, sauf une **JSDoc en anglais** au-dessus de chaque fonction, méthode et classe.
- Un module par responsabilité dans `src/` (scène, orientation, aliens, tir, radar, carte...).
- Pas de code mort ni de fonctionnalités non demandées.
- Vérifier qu'une API existe dans la version installée (lire `node_modules`) avant de l'utiliser.

## Contraintes techniques
- Doit tourner en **HTTPS** sur smartphone (Android Chrome + iOS Safari).
- Caméra, capteurs et audio démarrés depuis le clic sur "Jouer" (obligatoire sur iOS).
- Toujours garder un **mode PC** (souris/clavier) pour développer et pour la correction.
- Repère 3D : joueur à l'origine, 1 unité = 1 mètre, Nord = -Z, Est = +X, haut = +Y.
- `?debug` dans l'URL affiche le panneau de debug de l'orientation.

## Git
- Messages de commit **en anglais**, un commit par étape/fonctionnalité.
- Aucune ligne `Co-Authored-By` ni mention de l'IA dans les commits.

## Méthode
- Une fonctionnalité par étape, `npm run build` doit passer avant chaque commit.
- Après chaque étape : mettre à jour `PROMPTS.md` (prompt, résultat, bugs, corrections).
- Test local : `npm run dev` puis http://localhost:5173/
