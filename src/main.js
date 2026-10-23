import './style.css';
import { createScene } from './scene.js';
import { OrientationController } from './orientation.js';
import { startCameraFeed } from './cameraFeed.js';

const canvas = document.getElementById('scene3d');
const { renderer, scene, camera } = createScene(canvas);
const orientation = new OrientationController(camera, canvas);

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

renderer.setAnimationLoop(() => {
  orientation.update();
  updateDebug();
  renderer.render(scene, camera);
});

document.getElementById('btn-play').addEventListener('click', async () => {
  await orientation.start();
  await startCameraFeed(document.getElementById('camera'));
  document.getElementById('menu').classList.add('hidden');
});
