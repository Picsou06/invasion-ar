import './style.css';
import { Timer } from 'three';
import { createScene } from './scene.js';
import { OrientationController } from './orientation.js';
import { startCameraFeed } from './cameraFeed.js';
import { AlienManager } from './aliens.js';
import { Shooter } from './shooting.js';
import { Explosions } from './effects.js';
import { Radar } from './radar.js';

const canvas = document.getElementById('scene3d');
const { renderer, scene, camera } = createScene(canvas);
const orientation = new OrientationController(camera, canvas);
const aliens = new AlienManager(scene);
const shooter = new Shooter(camera, scene);
const explosions = new Explosions(scene);
const radar = new Radar(document.getElementById('radar'));
const timer = new Timer();
let started = false;
let spawnCooldown = 0;

const debug = {
  panel: document.getElementById('debug'),
  mode: document.getElementById('debug-mode'),
  heading: document.getElementById('debug-heading'),
  alpha: document.getElementById('debug-alpha'),
  beta: document.getElementById('debug-beta'),
  gamma: document.getElementById('debug-gamma'),
};
debug.panel.classList.toggle('hidden', !new URLSearchParams(location.search).has('debug'));

/**
 * Formats a sensor angle for the debug panel.
 *
 * @param {number|null} value angle in degrees
 * @returns {string} rounded value or a dash
 */
function formatAngle(value) {
  return value === null ? '-' : value.toFixed(0);
}

/**
 * Refreshes the debug panel with the current orientation data.
 */
function updateDebug() {
  if (debug.panel.classList.contains('hidden')) return;
  debug.mode.textContent = orientation.mode;
  debug.heading.textContent = `${orientation.heading.toFixed(0)}°`;
  debug.alpha.textContent = formatAngle(orientation.sensor.alpha);
  debug.beta.textContent = formatAngle(orientation.sensor.beta);
  debug.gamma.textContent = formatAngle(orientation.sensor.gamma);
}

/**
 * Fires at the crosshair and destroys the alien that was hit, if any.
 */
function fire() {
  if (!started) return;
  const { hit } = shooter.shoot(aliens.hitboxes);
  if (!hit) return;
  const alien = hit.userData.alien;
  explosions.spawn(alien.object.position, alien.color);
  aliens.remove(alien);
}

canvas.addEventListener('click', () => {
  if (orientation.wasTap) fire();
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') fire();
});

renderer.setAnimationLoop((time) => {
  timer.update(time);
  const delta = Math.min(timer.getDelta(), 0.1);
  orientation.update();
  if (started) {
    spawnCooldown -= delta;
    if (spawnCooldown <= 0 && aliens.aliens.length < 8) {
      aliens.spawnRandom();
      spawnCooldown = 2.5;
    }
    aliens.update(delta, timer.getElapsed());
  }
  shooter.update(delta);
  explosions.update(delta);
  radar.draw(delta, orientation.heading, camera, aliens.aliens);
  updateDebug();
  renderer.render(scene, camera);
});

document.getElementById('btn-play').addEventListener('click', async () => {
  await orientation.start();
  await startCameraFeed(document.getElementById('camera'));
  document.getElementById('menu').classList.add('hidden');
  started = true;
});
