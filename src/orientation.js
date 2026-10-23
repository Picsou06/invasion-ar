import * as THREE from 'three';

const DEG = THREE.MathUtils.DEG2RAD;
const SCREEN_TO_CAMERA = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const TAP_MAX_MOVE = 8;

/**
 * Drives the camera rotation from the phone orientation sensors, with a
 * mouse/keyboard fallback for desktop browsers.
 */
export class OrientationController {
  /**
   * @param {THREE.Camera} camera camera to rotate
   * @param {HTMLElement} surface element receiving mouse drags
   */
  constructor(camera, surface) {
    this.camera = camera;
    this.sensor = { alpha: null, beta: null, gamma: null };
    this.mode = 'souris/clavier';
    this.manual = { yaw: 0, pitch: 0 };
    this.euler = new THREE.Euler();
    this.screenQuat = new THREE.Quaternion();
    this.direction = new THREE.Vector3();
    this.drag = null;
    this.lastDragDistance = 0;
    this.bindManualControls(surface);
  }

  /**
   * Asks for sensor permission (required on iOS 13+) and starts listening.
   * Must be called from a user gesture.
   *
   * @returns {Promise<boolean>} true if sensor events will be listened to
   */
  async start() {
    const Orientation = window.DeviceOrientationEvent;
    if (!Orientation) return false;
    if (typeof Orientation.requestPermission === 'function') {
      try {
        if ((await Orientation.requestPermission()) !== 'granted') return false;
      } catch (err) {
        console.warn('Orientation permission refused:', err);
        return false;
      }
    }
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', (e) => this.onAbsoluteOrientation(e));
    }
    window.addEventListener('deviceorientation', (e) => this.onOrientation(e));
    return true;
  }

  /**
   * Handles Android absolute orientation events (alpha relative to true north).
   *
   * @param {DeviceOrientationEvent} e sensor event
   */
  onAbsoluteOrientation(e) {
    if (e.alpha === null) return;
    this.mode = 'absolu (Nord réel)';
    this.setSensor(e.alpha, e.beta, e.gamma);
  }

  /**
   * Handles standard orientation events: uses the iOS compass heading when
   * available, otherwise the relative alpha unless an absolute source exists.
   *
   * @param {DeviceOrientationEvent} e sensor event
   */
  onOrientation(e) {
    if (e.alpha === null) return;
    if (typeof e.webkitCompassHeading === 'number') {
      this.mode = 'absolu (boussole iOS)';
      this.setSensor(360 - e.webkitCompassHeading, e.beta, e.gamma);
    } else if (!this.mode.startsWith('absolu')) {
      this.mode = 'relatif';
      this.setSensor(e.alpha, e.beta, e.gamma);
    }
  }

  /**
   * Stores the latest sensor angles.
   *
   * @param {number} alpha rotation around the vertical axis, in degrees
   * @param {number} beta front-to-back tilt, in degrees
   * @param {number} gamma left-to-right tilt, in degrees
   */
  setSensor(alpha, beta, gamma) {
    this.sensor.alpha = alpha;
    this.sensor.beta = beta;
    this.sensor.gamma = gamma;
  }

  /**
   * @returns {boolean} true once the phone sensors have sent data
   */
  get usesSensors() {
    return this.sensor.alpha !== null;
  }

  /**
   * Registers mouse drag and arrow keys to look around on desktop.
   * Also measures each drag so a short click can be told apart from a drag.
   *
   * @param {HTMLElement} surface element receiving pointer events
   */
  bindManualControls(surface) {
    surface.addEventListener('pointerdown', (e) => {
      this.drag = { x: e.clientX, y: e.clientY };
      this.lastDragDistance = 0;
    });
    window.addEventListener('pointerup', () => { this.drag = null; });
    window.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      this.lastDragDistance += Math.hypot(dx, dy);
      if (!this.usesSensors) {
        this.manual.yaw += dx * 0.005;
        this.manual.pitch += dy * 0.005;
      }
      this.drag = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('keydown', (e) => {
      const step = 0.05;
      if (e.key === 'ArrowLeft') this.manual.yaw += step;
      if (e.key === 'ArrowRight') this.manual.yaw -= step;
      if (e.key === 'ArrowUp') this.manual.pitch += step;
      if (e.key === 'ArrowDown') this.manual.pitch -= step;
    });
  }

  /**
   * @returns {boolean} true if the last pointer interaction was a tap, not a drag
   */
  get wasTap() {
    return this.lastDragDistance < TAP_MAX_MOVE;
  }

  /**
   * Applies the current orientation (sensors or manual) to the camera.
   * Should be called once per frame.
   */
  update() {
    if (this.usesSensors) {
      this.applySensorOrientation();
    } else {
      this.manual.pitch = THREE.MathUtils.clamp(this.manual.pitch, -Math.PI / 2, Math.PI / 2);
      this.camera.quaternion.setFromEuler(this.euler.set(this.manual.pitch, this.manual.yaw, 0, 'YXZ'));
    }
  }

  /**
   * Converts the W3C device orientation angles into a camera quaternion,
   * taking the screen orientation (portrait/landscape) into account.
   */
  applySensorOrientation() {
    const { alpha, beta, gamma } = this.sensor;
    const screenAngle = screen.orientation ? screen.orientation.angle : window.orientation || 0;
    this.euler.set(beta * DEG, alpha * DEG, -gamma * DEG, 'YXZ');
    this.camera.quaternion.setFromEuler(this.euler);
    this.camera.quaternion.multiply(SCREEN_TO_CAMERA);
    this.camera.quaternion.multiply(this.screenQuat.setFromAxisAngle(Z_AXIS, -screenAngle * DEG));
  }

  /**
   * @returns {number} compass heading the camera looks at, in degrees (0 = north, 90 = east)
   */
  get heading() {
    this.camera.getWorldDirection(this.direction);
    const deg = THREE.MathUtils.radToDeg(Math.atan2(this.direction.x, -this.direction.z));
    return (deg + 360) % 360;
  }
}
