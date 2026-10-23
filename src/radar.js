import * as THREE from 'three';

const RANGE = 35;
const SWEEP_SPEED = 2.5;

/**
 * Heading-up 2D radar showing where the aliens are around the player.
 */
export class Radar {
  /**
   * @param {HTMLCanvasElement} canvas canvas the radar is drawn on
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sweep = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * Matches the canvas resolution to its displayed size and the screen density.
   */
  resize() {
    const ratio = Math.min(window.devicePixelRatio, 2);
    this.size = this.canvas.clientWidth;
    this.canvas.width = this.canvas.height = this.size * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  /**
   * Draws the radar for the current frame.
   *
   * @param {number} delta seconds since the previous frame
   * @param {number} heading compass heading of the camera, in degrees
   * @param {THREE.PerspectiveCamera} camera camera used to draw the field of view
   * @param {import('./aliens.js').Alien[]} aliens aliens to display
   */
  draw(delta, heading, camera, aliens) {
    const { ctx, size } = this;
    const radius = size / 2;
    this.sweep = (this.sweep + SWEEP_SPEED * delta) % (Math.PI * 2);

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(radius, radius);

    this.drawBackground(radius);
    this.drawFieldOfView(radius, camera);
    this.drawSweep(radius);
    this.drawNorth(radius, heading);
    for (const alien of aliens) this.drawAlien(radius, heading, alien);

    ctx.restore();
  }

  /**
   * Draws the disc and the distance rings.
   *
   * @param {number} radius radar radius in pixels
   */
  drawBackground(radius) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(5, 20, 12, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 255, 138, 0.35)';
    ctx.lineWidth = 1;
    for (const fraction of [1 / 3, 2 / 3, 1]) {
      ctx.beginPath();
      ctx.arc(0, 0, (radius - 1) * fraction, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * Draws the wedge matching what the camera currently sees (always pointing up).
   *
   * @param {number} radius radar radius in pixels
   * @param {THREE.PerspectiveCamera} camera camera giving the field of view
   */
  drawFieldOfView(radius, camera) {
    const { ctx } = this;
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const halfFov = Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius - 1, -Math.PI / 2 - halfFov, -Math.PI / 2 + halfFov);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draws the rotating sweep line with its fading trail.
   *
   * @param {number} radius radar radius in pixels
   */
  drawSweep(radius) {
    const { ctx } = this;
    const gradient = ctx.createConicGradient(this.sweep - Math.PI / 2, 0, 0);
    gradient.addColorStop(0, 'rgba(59, 255, 138, 0)');
    gradient.addColorStop(0.9, 'rgba(59, 255, 138, 0)');
    gradient.addColorStop(1, 'rgba(59, 255, 138, 0.35)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 1, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draws the "N" letter on the edge, rotated according to the heading.
   *
   * @param {number} radius radar radius in pixels
   * @param {number} heading compass heading of the camera, in degrees
   */
  drawNorth(radius, heading) {
    const { ctx } = this;
    const angle = THREE.MathUtils.degToRad(-heading);
    ctx.fillStyle = '#ff3b3b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', Math.sin(angle) * (radius - 9), -Math.cos(angle) * (radius - 9));
  }

  /**
   * Draws one alien as a dot, relative to where the player is looking.
   *
   * @param {number} radius radar radius in pixels
   * @param {number} heading compass heading of the camera, in degrees
   * @param {import('./aliens.js').Alien} alien alien to draw
   */
  drawAlien(radius, heading, alien) {
    const { ctx } = this;
    const { x, z } = alien.object.position;
    const bearing = Math.atan2(x, -z) - THREE.MathUtils.degToRad(heading);
    const distance = Math.min(Math.hypot(x, z) / RANGE, 1) * (radius - 6);
    ctx.fillStyle = `#${alien.color.toString(16).padStart(6, '0')}`;
    ctx.beginPath();
    ctx.arc(Math.sin(bearing) * distance, -Math.cos(bearing) * distance, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
