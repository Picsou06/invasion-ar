import * as THREE from 'three';

const PARTICLE_COUNT = 60;
const EXPLOSION_LIFETIME = 0.9;
const GRAVITY = -6;

/**
 * Pixel-style particle explosions left behind by destroyed aliens.
 */
export class Explosions {
  /**
   * @param {THREE.Scene} scene scene where the explosions are drawn
   */
  constructor(scene) {
    this.scene = scene;
    this.explosions = [];
  }

  /**
   * Creates an explosion: particles thrown in every direction from a point.
   *
   * @param {THREE.Vector3} position world position of the explosion
   * @param {number} color particle color as a hex number
   */
  spawn(position, color) {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions.set([position.x, position.y, position.z], i * 3);
      velocities.push(new THREE.Vector3().randomDirection().multiplyScalar(THREE.MathUtils.randFloat(2, 7)));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color, size: 0.3, transparent: true });
    const points = new THREE.Points(geometry, material);
    this.explosions.push({ points, velocities, age: 0 });
    this.scene.add(points);
  }

  /**
   * Moves the particles, applies gravity, fades them and removes finished explosions.
   *
   * @param {number} delta seconds since the previous frame
   */
  update(delta) {
    for (const explosion of this.explosions) {
      explosion.age += delta;
      const attribute = explosion.points.geometry.attributes.position;
      explosion.velocities.forEach((velocity, i) => {
        velocity.y += GRAVITY * delta;
        attribute.setXYZ(
          i,
          attribute.getX(i) + velocity.x * delta,
          attribute.getY(i) + velocity.y * delta,
          attribute.getZ(i) + velocity.z * delta
        );
      });
      attribute.needsUpdate = true;
      explosion.points.material.opacity = 1 - explosion.age / EXPLOSION_LIFETIME;
    }
    for (const explosion of this.explosions.filter((e) => e.age >= EXPLOSION_LIFETIME)) {
      this.scene.remove(explosion.points);
      explosion.points.geometry.dispose();
      explosion.points.material.dispose();
    }
    this.explosions = this.explosions.filter((e) => e.age < EXPLOSION_LIFETIME);
  }
}
