import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const PIXEL_SIZE = 0.25;
const PIXEL_DEPTH = 0.35;
const FRAME_DURATION = 0.5;
export const VISIBLE_RANGE = 70;
const FULL_SIZE_DISTANCE = 10;
const MIN_SCALE = 0.6;
const REACH_DISTANCE = 2;
const HITBOX_GEOMETRY = new THREE.SphereGeometry(1.8, 8, 6);
const HITBOX_MATERIAL = new THREE.MeshBasicMaterial({ visible: false });

export const ALIEN_TYPES = {
  squid: {
    color: 0xff4fd8,
    points: 30,
    speed: 2.2,
    frames: [
      ['...##...', '..####..', '.######.', '##.##.##', '########', '..#..#..', '.#.##.#.', '#.#..#.#'],
      ['...##...', '..####..', '.######.', '##.##.##', '########', '.#.##.#.', '#......#', '.#....#.'],
    ],
  },
  crab: {
    color: 0x3bff8a,
    points: 20,
    speed: 1.8,
    frames: [
      ['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'],
      ['..#.....#..', '#..#...#..#', '#.#######.#', '###.###.###', '###########', '.#########.', '..#.....#..', '.#.......#.'],
    ],
  },
  octopus: {
    color: 0x4fc3ff,
    points: 10,
    speed: 1.4,
    frames: [
      ['....####....', '.##########.', '############', '###..##..###', '############', '...##..##...', '..##.##.##..', '##........##'],
      ['....####....', '.##########.', '############', '###..##..###', '############', '..###..###..', '.##..##..##.', '..##....##..'],
    ],
  },
};

const geometryCache = new Map();

/**
 * Turns a pixel-art bitmap into a single merged voxel geometry centered on the origin.
 *
 * @param {string[]} rows bitmap rows, top to bottom, '#' meaning a filled pixel
 * @returns {THREE.BufferGeometry} merged geometry
 */
function bitmapToGeometry(rows) {
  const width = rows[0].length;
  const height = rows.length;
  const boxes = [];
  rows.forEach((row, y) => {
    [...row].forEach((pixel, x) => {
      if (pixel !== '#') return;
      const box = new THREE.BoxGeometry(PIXEL_SIZE, PIXEL_SIZE, PIXEL_DEPTH);
      box.translate(
        (x - (width - 1) / 2) * PIXEL_SIZE,
        ((height - 1) / 2 - y) * PIXEL_SIZE,
        0
      );
      boxes.push(box);
    });
  });
  return mergeGeometries(boxes);
}

/**
 * Returns the two animation frames of an alien type, building them once.
 *
 * @param {string} type key of ALIEN_TYPES
 * @returns {THREE.BufferGeometry[]} geometries for frame A and frame B
 */
function getFrames(type) {
  if (!geometryCache.has(type)) {
    geometryCache.set(type, ALIEN_TYPES[type].frames.map(bitmapToGeometry));
  }
  return geometryCache.get(type);
}

/**
 * A pixel-art space invader placed in the real world (meters around the GPS
 * origin). It always flies toward the player's current position and only
 * becomes visible in the AR view when it is close enough.
 */
export class Alien {
  /**
   * @param {string} type key of ALIEN_TYPES
   * @param {number} x east position in meters
   * @param {number} z south position in meters
   * @param {number} height flying height in meters while far away
   * @param {number} speedFactor multiplier applied to the type base speed
   */
  constructor(type, x, z, height, speedFactor) {
    const config = ALIEN_TYPES[type];
    this.type = type;
    this.points = config.points;
    this.color = config.color;
    this.speed = config.speed * speedFactor;
    this.ground = new THREE.Vector2(x, z);
    this.height = height;
    this.distance = Infinity;
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.frames = getFrames(type);

    this.mesh = new THREE.Mesh(
      this.frames[0],
      new THREE.MeshStandardMaterial({ color: config.color, emissive: config.color, emissiveIntensity: 0.45 })
    );
    this.hitbox = new THREE.Mesh(HITBOX_GEOMETRY, HITBOX_MATERIAL);
    this.hitbox.userData.alien = this;

    this.object = new THREE.Group();
    this.object.add(this.mesh, this.hitbox);
    this.object.visible = false;
  }

  /**
   * Moves the alien toward the player, lowers it to eye level as it gets
   * closer, grows it from MIN_SCALE to full size, swaps its animation frame
   * and shows it only within VISIBLE_RANGE.
   *
   * @param {number} delta seconds since the previous frame
   * @param {number} elapsed seconds since the game started
   * @param {THREE.Vector3} player current player position
   */
  update(delta, elapsed, player) {
    const toPlayer = new THREE.Vector2(player.x - this.ground.x, player.z - this.ground.y);
    this.distance = toPlayer.length();
    if (this.distance > 0.001) {
      this.ground.addScaledVector(toPlayer.normalize(), Math.min(this.speed * delta, this.distance));
    }

    const side = new THREE.Vector2(-toPlayer.y, toPlayer.x);
    const wobble = Math.sin(elapsed * 1.5 + this.wobblePhase) * Math.min(this.distance * 0.12, 3);
    const altitude = this.height * Math.min(this.distance / VISIBLE_RANGE, 1);
    this.object.position.set(
      this.ground.x + side.x * wobble,
      altitude,
      this.ground.y + side.y * wobble
    );
    this.object.lookAt(player.x, 0, player.z);
    this.object.scale.setScalar(THREE.MathUtils.mapLinear(
      THREE.MathUtils.clamp(this.distance, FULL_SIZE_DISTANCE, VISIBLE_RANGE),
      VISIBLE_RANGE, FULL_SIZE_DISTANCE, MIN_SCALE, 1
    ));
    this.object.visible = this.isVisible;
    this.mesh.geometry = this.frames[Math.floor(elapsed / FRAME_DURATION) % 2];
  }

  /**
   * @returns {boolean} true when the alien is close enough to be seen and shot
   */
  get isVisible() {
    return this.distance <= VISIBLE_RANGE;
  }

  /**
   * @returns {boolean} true when the alien is close enough to hit the player
   */
  get hasReachedPlayer() {
    return this.distance <= REACH_DISTANCE;
  }
}

/**
 * Keeps track of every alien in the scene: spawning, moving and removing them.
 */
export class AlienManager {
  /**
   * @param {THREE.Scene} scene scene the aliens are added to
   */
  constructor(scene) {
    this.scene = scene;
    this.aliens = [];
  }

  /**
   * Spawns an alien of a random type in a random direction around the player.
   *
   * @param {THREE.Vector3} player current player position
   * @param {number} minDistance minimum spawn distance in meters
   * @param {number} maxDistance maximum spawn distance in meters
   * @param {number} speedFactor speed multiplier, grows with the waves
   * @returns {Alien} the new alien
   */
  spawnRandom(player, minDistance, maxDistance, speedFactor = 1) {
    const types = Object.keys(ALIEN_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const azimuth = Math.random() * Math.PI * 2;
    const distance = THREE.MathUtils.randFloat(minDistance, maxDistance);
    const alien = new Alien(
      type,
      player.x + Math.sin(azimuth) * distance,
      player.z - Math.cos(azimuth) * distance,
      THREE.MathUtils.randFloat(3, 12),
      speedFactor
    );
    this.aliens.push(alien);
    this.scene.add(alien.object);
    return alien;
  }

  /**
   * Moves every alien and removes the ones that reached the player.
   *
   * @param {number} delta seconds since the previous frame
   * @param {number} elapsed seconds since the game started
   * @param {THREE.Vector3} player current player position
   * @returns {Alien[]} aliens that reached the player during this frame
   */
  update(delta, elapsed, player) {
    const arrived = [];
    for (const alien of this.aliens) {
      alien.update(delta, elapsed, player);
      if (alien.hasReachedPlayer) arrived.push(alien);
    }
    arrived.forEach((alien) => this.remove(alien));
    return arrived;
  }

  /**
   * Removes an alien from the scene and from the managed list.
   *
   * @param {Alien} alien alien to remove
   */
  remove(alien) {
    this.scene.remove(alien.object);
    alien.mesh.material.dispose();
    this.aliens = this.aliens.filter((a) => a !== alien);
  }

  /**
   * Removes every alien.
   */
  clear() {
    [...this.aliens].forEach((alien) => this.remove(alien));
  }

  /**
   * @returns {THREE.Object3D[]} hitboxes of the aliens close enough to be shot
   */
  get hitboxes() {
    return this.visibleAliens.map((alien) => alien.hitbox);
  }

  /**
   * @returns {Alien[]} aliens currently within VISIBLE_RANGE
   */
  get visibleAliens() {
    return this.aliens.filter((alien) => alien.isVisible);
  }
}
