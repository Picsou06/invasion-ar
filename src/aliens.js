import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const PIXEL_SIZE = 0.25;
const PIXEL_DEPTH = 0.35;
const FRAME_DURATION = 0.5;
const SPAWN_DISTANCE = 32;
const REACH_DISTANCE = 2;
const HITBOX_GEOMETRY = new THREE.SphereGeometry(1.8, 8, 6);
const HITBOX_MATERIAL = new THREE.MeshBasicMaterial({ visible: false });

export const ALIEN_TYPES = {
  squid: {
    color: 0xff4fd8,
    points: 30,
    speed: 1.4,
    frames: [
      ['...##...', '..####..', '.######.', '##.##.##', '########', '..#..#..', '.#.##.#.', '#.#..#.#'],
      ['...##...', '..####..', '.######.', '##.##.##', '########', '.#.##.#.', '#......#', '.#....#.'],
    ],
  },
  crab: {
    color: 0x3bff8a,
    points: 20,
    speed: 1.1,
    frames: [
      ['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'],
      ['..#.....#..', '#..#...#..#', '#.#######.#', '###.###.###', '###########', '.#########.', '..#.....#..', '.#.......#.'],
    ],
  },
  octopus: {
    color: 0x4fc3ff,
    points: 10,
    speed: 0.8,
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
 * A pixel-art space invader flying toward the player. Its position is kept in
 * spherical coordinates around the player (azimuth, elevation, distance).
 */
export class Alien {
  /**
   * @param {string} type key of ALIEN_TYPES
   * @param {number} azimuth compass direction it comes from, in radians (0 = north)
   * @param {number} elevation angle above the horizon, in radians
   * @param {number} speedFactor multiplier applied to the type base speed
   */
  constructor(type, azimuth, elevation, speedFactor) {
    const config = ALIEN_TYPES[type];
    this.type = type;
    this.points = config.points;
    this.color = config.color;
    this.speed = config.speed * speedFactor;
    this.azimuth = azimuth;
    this.elevation = elevation;
    this.distance = SPAWN_DISTANCE;
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
    this.updatePosition(0);
  }

  /**
   * Moves the alien toward the player and swaps its animation frame.
   *
   * @param {number} delta seconds since the previous frame
   * @param {number} elapsed seconds since the game started
   */
  update(delta, elapsed) {
    this.distance -= this.speed * delta;
    this.elevation *= 1 - 0.15 * delta;
    this.mesh.geometry = this.frames[Math.floor(elapsed / FRAME_DURATION) % 2];
    this.updatePosition(elapsed);
  }

  /**
   * Converts the spherical coordinates (plus a small side-to-side wobble)
   * into a world position and turns the alien to face the player.
   *
   * @param {number} elapsed seconds since the game started
   */
  updatePosition(elapsed) {
    const wobble = Math.sin(elapsed * 1.5 + this.wobblePhase) * 0.12;
    const azimuth = this.azimuth + wobble;
    const horizontal = Math.cos(this.elevation) * this.distance;
    this.object.position.set(
      Math.sin(azimuth) * horizontal,
      Math.sin(this.elevation) * this.distance,
      -Math.cos(azimuth) * horizontal
    );
    this.object.lookAt(0, 0, 0);
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
   * Spawns an alien of a random type from a random direction.
   *
   * @param {number} speedFactor speed multiplier, grows with the waves
   * @returns {Alien} the new alien
   */
  spawnRandom(speedFactor = 1) {
    const types = Object.keys(ALIEN_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const azimuth = Math.random() * Math.PI * 2;
    const elevation = THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-5, 25));
    const alien = new Alien(type, azimuth, elevation, speedFactor);
    this.aliens.push(alien);
    this.scene.add(alien.object);
    return alien;
  }

  /**
   * Moves every alien and removes the ones that reached the player.
   *
   * @param {number} delta seconds since the previous frame
   * @param {number} elapsed seconds since the game started
   * @returns {Alien[]} aliens that reached the player during this frame
   */
  update(delta, elapsed) {
    const arrived = [];
    for (const alien of this.aliens) {
      alien.update(delta, elapsed);
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
   * @returns {THREE.Object3D[]} invisible hitboxes used for ray casting
   */
  get hitboxes() {
    return this.aliens.map((alien) => alien.hitbox);
  }
}
