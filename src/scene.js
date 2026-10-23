import * as THREE from 'three';

const COMPASS_DISTANCE = 25;
const COMPASS_POINTS = [
  { label: 'N', color: '#ff3b3b', angle: 0 },
  { label: 'E', color: '#ffffff', angle: 90 },
  { label: 'S', color: '#ffffff', angle: 180 },
  { label: 'O', color: '#ffffff', angle: 270 },
];

/**
 * Creates the renderer, scene and camera. The player stands at the origin;
 * north is -Z, east is +X and up is +Y. One world unit is one meter.
 *
 * @param {HTMLCanvasElement} canvas canvas drawn on top of the camera feed
 * @returns {{renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera}}
 */
export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 500);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(5, 10, 5);
  scene.add(sun);

  addCompassMarkers(scene);

  const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };
  window.addEventListener('resize', resize);
  resize();

  return { renderer, scene, camera };
}

/**
 * Places a floating letter on the horizon for each cardinal direction,
 * so the player can check that the AR view is aligned with the real world.
 *
 * @param {THREE.Scene} scene scene receiving the markers
 */
function addCompassMarkers(scene) {
  for (const point of COMPASS_POINTS) {
    const sprite = createTextSprite(point.label, point.color);
    const rad = THREE.MathUtils.degToRad(point.angle);
    sprite.position.set(Math.sin(rad) * COMPASS_DISTANCE, 0, -Math.cos(rad) * COMPASS_DISTANCE);
    scene.add(sprite);
  }
}

/**
 * Builds a camera-facing sprite displaying a short text.
 *
 * @param {string} text text to draw
 * @param {string} color CSS color of the text
 * @returns {THREE.Sprite} sprite scaled to about 3 meters
 */
function createTextSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.font = 'bold 96px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 64);

  const material = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3, 3, 1);
  return sprite;
}
