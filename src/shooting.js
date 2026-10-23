import * as THREE from 'three';

const COOLDOWN = 0.2;
const LASER_LIFETIME = 0.12;
const LASER_RANGE = 60;
const MUZZLE_OFFSET = new THREE.Vector3(0.25, -0.35, -0.5);
const SCREEN_CENTER = new THREE.Vector2(0, 0);

/**
 * Fires laser shots from the center of the screen and tells which alien was hit.
 */
export class Shooter {
  /**
   * @param {THREE.Camera} camera camera the shots are fired from
   * @param {THREE.Scene} scene scene where the laser beams are drawn
   */
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.cooldown = 0;
    this.lasers = [];
  }

  /**
   * Shoots along the crosshair direction if the weapon is ready.
   *
   * @param {THREE.Object3D[]} targets hitboxes that can be hit
   * @returns {{fired: boolean, hit: THREE.Object3D|null}} whether a shot was fired and the hitbox it hit
   */
  shoot(targets) {
    if (this.cooldown > 0) return { fired: false, hit: null };
    this.cooldown = COOLDOWN;

    this.raycaster.setFromCamera(SCREEN_CENTER, this.camera);
    const [intersection] = this.raycaster.intersectObjects(targets, false);
    const end = intersection
      ? intersection.point
      : this.raycaster.ray.at(LASER_RANGE, new THREE.Vector3());
    this.addLaser(end);
    return { fired: true, hit: intersection ? intersection.object : null };
  }

  /**
   * Draws a short-lived laser beam from just below the camera to a target point.
   *
   * @param {THREE.Vector3} end world position where the beam stops
   */
  addLaser(end) {
    const start = this.camera.localToWorld(MUZZLE_OFFSET.clone());
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({ color: 0xff3b3b, transparent: true });
    const line = new THREE.Line(geometry, material);
    line.userData.age = 0;
    this.lasers.push(line);
    this.scene.add(line);
  }

  /**
   * Reloads the weapon and fades out the laser beams.
   *
   * @param {number} delta seconds since the previous frame
   */
  update(delta) {
    this.cooldown = Math.max(0, this.cooldown - delta);
    for (const laser of this.lasers) {
      laser.userData.age += delta;
      laser.material.opacity = 1 - laser.userData.age / LASER_LIFETIME;
    }
    const expired = this.lasers.filter((laser) => laser.userData.age >= LASER_LIFETIME);
    for (const laser of expired) {
      this.scene.remove(laser);
      laser.geometry.dispose();
      laser.material.dispose();
    }
    this.lasers = this.lasers.filter((laser) => laser.userData.age < LASER_LIFETIME);
  }
}
