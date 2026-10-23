# Journal de développement avec l'IA

Outil utilisé : Claude Code (Opus 5.5), dans le terminal.
Les consignes permanentes données à l'IA sont dans [`CLAUDE.md`](CLAUDE.md).

## Feuille de route
- [x] Étape 1 : caméra en fond + scène 3D transparente qui suit l'orientation du téléphone + repères N/E/S/O
- [ ] Étape 2 : apparition et déplacement des aliens vers le joueur
- [ ] Étape 3 : tir (toucher l'écran, Raycaster depuis le viseur) et explosions
- [ ] Étape 4 : radar 2D (canvas) indiquant la direction des ennemis
- [ ] Étape 5 : vagues, vies, score, écran de fin
- [ ] Étape 6 : mini-carte Leaflet avec la position GPS de la "base"
- [ ] Étape 7 : particules, sons, finitions

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

**Test smartphone :** _à compléter (la caméra s'affiche ? les lettres restent fixes quand on tourne ? mode affiché avec `?debug` ?)_
