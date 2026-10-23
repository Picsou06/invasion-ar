import './style.css';
import { Timer } from 'three';
import { createScene } from './scene.js';
import { OrientationController } from './orientation.js';
import { startCameraFeed } from './cameraFeed.js';
import { AlienManager } from './aliens.js';
import { Shooter } from './shooting.js';
import { Explosions } from './effects.js';
import { Radar } from './radar.js';
import { Game } from './game.js';
import { Hud } from './hud.js';
import { MiniMap } from './minimap.js';
import { Player } from './player.js';
import { Sounds } from './audio.js';
import { OffscreenIndicators } from './indicators.js';
import { Music } from './music.js';
import { HumanDetector } from './humanDetector.js';

const debugMode = new URLSearchParams(location.search).has('debug');
const canvas = document.getElementById('scene3d');
const { renderer, scene, camera, compass } = createScene(canvas, debugMode);
const player = new Player();
const orientation = new OrientationController(camera, canvas);
const aliens = new AlienManager(scene);
const shooter = new Shooter(camera, scene);
const explosions = new Explosions(scene);
const radar = new Radar(document.getElementById('radar'));
const game = new Game(aliens, player);
const hud = new Hud();
const miniMap = new MiniMap(
  document.getElementById('minimap-panel'),
  document.getElementById('minimap'),
  document.getElementById('minimap-status'),
  player
);
const sounds = new Sounds();
const indicators = new OffscreenIndicators(document.getElementById('indicators'));
const muteButton = document.getElementById('btn-mute');
const music = new Music(sounds);
const video = document.getElementById('camera');
const humanDetector = new HumanDetector(video);
const HUMAN_PENALTY = 25;
const timer = new Timer();

const debug = {
  panel: document.getElementById('debug'),
  mode: document.getElementById('debug-mode'),
  heading: document.getElementById('debug-heading'),
  alpha: document.getElementById('debug-alpha'),
  beta: document.getElementById('debug-beta'),
  gamma: document.getElementById('debug-gamma'),
};
debug.panel.classList.toggle('hidden', !debugMode);

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
  if (!game.isRunning) return;
  const { fired, hit } = shooter.shoot(aliens.hitboxes);
  if (!fired) return;
  sounds.shoot();
  if (!hit) {
    if (humanDetector.isPersonAt(window.innerWidth / 2, window.innerHeight / 2)) shootHuman();
    return;
  }
  const alien = hit.userData.alien;
  explosions.spawn(alien.object.position, alien.color);
  sounds.explosion();
  aliens.remove(alien);
  game.addKill(alien);
}

/**
 * Penalizes the player for shooting at a real person detected in the camera feed.
 */
function shootHuman() {
  game.penalize(HUMAN_PENALTY);
  hud.showBanner(`Humain touché ! -${HUMAN_PENALTY}`, true);
  hud.flashDamage();
  sounds.damage();
  navigator.vibrate?.([80, 60, 80]);
}

/**
 * Reacts to the events produced by the game rules during a frame.
 *
 * @param {string[]} events events returned by Game.update
 */
function handleGameEvents(events) {
  for (const event of events) {
    if (event === 'wave-start') {
      hud.showBanner(`Vague ${game.wave}`);
      sounds.waveStart();
    }
    if (event === 'wave-cleared') hud.showBanner('Vague terminée !');
    if (event === 'damage') {
      hud.flashDamage();
      sounds.damage();
      navigator.vibrate?.(200);
    }
    if (event === 'game-over') {
      hud.showGameOver(game.score, game.bestScore);
      music.stop();
      sounds.gameOver();
    }
  }
}

/**
 * Starts a new game and hides the menus.
 */
function startGame() {
  game.start();
  hud.showGame();
  muteButton.classList.remove('hidden');
  miniMap.show();
  music.start();
  hud.showBanner('Préparez-vous !');
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
  player.update(delta, orientation.heading);
  camera.position.copy(player.position);
  compass.position.copy(player.position);
  const arrived = game.isRunning ? aliens.update(delta, timer.getElapsed(), player.position) : [];
  handleGameEvents(game.update(delta, arrived));
  shooter.update(delta);
  explosions.update(delta);
  radar.draw(delta, orientation.heading, camera, aliens.aliens, player.position);
  miniMap.update(delta, orientation.heading, aliens.aliens);
  indicators.update(camera, aliens.visibleAliens);
  hud.update(game);
  updateDebug();
  renderer.render(scene, camera);
});

hud.showMenu(game.bestScore);

let launched = false;

document.getElementById('btn-play').addEventListener('click', async (e) => {
  e.currentTarget.blur();
  if (launched) return;
  launched = true;
  sounds.unlock();
  await orientation.start();
  await startCameraFeed(video);
  player.startGps((status) => miniMap.setStatus(status));
  startGame();
  humanDetector.start();
});
document.getElementById('btn-replay').addEventListener('click', (e) => {
  e.currentTarget.blur();
  startGame();
});
muteButton.addEventListener('click', () => {
  muteButton.blur();
  const muted = sounds.toggleMute();
  music.setMuted(muted);
  muteButton.textContent = muted ? '🔇' : '🔊';
});
