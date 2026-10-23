import * as THREE from 'three';

const DEFAULT_ORIGIN = { lat: 43.616513, lng: 7.072094 };
const METERS_PER_DEGREE = 111320;
const SMOOTHING_RATE = 4;
const KEYBOARD_SPEED = 4;
const MOVE_KEYS = {
  KeyW: [0, -1],
  KeyS: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
};

/**
 * Player position in the local metric world (x = east, z = south, in meters
 * from a geographic origin), fed by the GPS or by the keyboard on desktop.
 * GPS fixes are smoothed so the AR view does not jump.
 */
export class Player {
  /**
   * Starts at the default origin (IUT) until the first GPS fix.
   */
  constructor() {
    this.origin = { ...DEFAULT_ORIGIN };
    this.position = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.accuracy = null;
    this.hasGps = false;
    this.listeners = [];
    this.pressedKeys = new Set();
    window.addEventListener('keydown', (e) => this.pressedKeys.add(e.code));
    window.addEventListener('keyup', (e) => this.pressedKeys.delete(e.code));
  }

  /**
   * Starts following the GPS. Calls the status callback with a short text
   * describing the GPS state each time it changes.
   *
   * @param {(status: string) => void} onStatus receives GPS status messages
   */
  startGps(onStatus) {
    if (!navigator.geolocation) {
      onStatus('Pas de GPS : base IUT');
      return;
    }
    onStatus('Recherche GPS…');
    navigator.geolocation.watchPosition(
      (position) => {
        this.onGpsFix(position);
        onStatus(`GPS ±${Math.round(this.accuracy)} m`);
      },
      (err) => {
        console.warn('Geolocation unavailable:', err);
        onStatus('Pas de GPS : base IUT');
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
  }

  /**
   * Handles a new GPS fix. The first fix becomes the world origin, so the
   * player stays at the same place in the 3D world and the aliens keep their
   * position relative to the player.
   *
   * @param {GeolocationPosition} position position returned by the Geolocation API
   */
  onGpsFix(position) {
    const { latitude, longitude, accuracy } = position.coords;
    if (!this.hasGps) {
      this.hasGps = true;
      this.origin = { lat: latitude, lng: longitude };
      this.origin = this.toLatLng({ x: -this.position.x, z: -this.position.z });
    }
    this.accuracy = accuracy;
    const local = this.toLocal({ lat: latitude, lng: longitude });
    this.target.set(local.x, 0, local.z);
  }

  /**
   * Moves the player toward the latest GPS target (smoothed) and applies
   * keyboard movement relative to the looking direction.
   *
   * @param {number} delta seconds since the previous frame
   * @param {number} heading compass heading of the camera, in degrees
   */
  update(delta, heading) {
    const move = new THREE.Vector2();
    for (const [code, [right, back]] of Object.entries(MOVE_KEYS)) {
      if (this.pressedKeys.has(code)) {
        move.x += right;
        move.y += back;
      }
    }
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(KEYBOARD_SPEED * delta);
      const angle = THREE.MathUtils.degToRad(heading);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      this.target.x += move.x * cos - move.y * sin;
      this.target.z += move.x * sin + move.y * cos;
    }
    const smoothing = 1 - Math.exp(-delta * SMOOTHING_RATE);
    this.position.lerp(this.target, smoothing);
  }

  /**
   * Converts local world coordinates (meters) to geographic coordinates.
   *
   * @param {{x: number, z: number}} point world position, north = -Z, east = +X
   * @returns {{lat: number, lng: number}} geographic coordinates
   */
  toLatLng({ x, z }) {
    return {
      lat: this.origin.lat - z / METERS_PER_DEGREE,
      lng: this.origin.lng + x / (METERS_PER_DEGREE * Math.cos(THREE.MathUtils.degToRad(this.origin.lat))),
    };
  }

  /**
   * Converts geographic coordinates to local world coordinates (meters).
   *
   * @param {{lat: number, lng: number}} latLng geographic coordinates
   * @returns {{x: number, z: number}} world position, north = -Z, east = +X
   */
  toLocal({ lat, lng }) {
    return {
      x: (lng - this.origin.lng) * METERS_PER_DEGREE * Math.cos(THREE.MathUtils.degToRad(this.origin.lat)),
      z: -(lat - this.origin.lat) * METERS_PER_DEGREE,
    };
  }

  /**
   * @returns {{lat: number, lng: number}} current geographic position of the player
   */
  get latLng() {
    return this.toLatLng(this.position);
  }
}
