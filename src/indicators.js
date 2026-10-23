import * as THREE from 'three';

const EDGE_MARGIN = 28;

/**
 * Arrows on the screen edges pointing toward aliens that are outside the field of view.
 */
export class OffscreenIndicators {
  /**
   * @param {HTMLElement} container element receiving the arrow elements
   */
  constructor(container) {
    this.container = container;
    this.arrows = [];
    this.projected = new THREE.Vector3();
  }

  /**
   * Returns the arrow element at a given index, creating it if needed.
   *
   * @param {number} index arrow index
   * @returns {HTMLElement} arrow element
   */
  getArrow(index) {
    if (!this.arrows[index]) {
      const arrow = document.createElement('div');
      arrow.className = 'offscreen-arrow';
      this.container.appendChild(arrow);
      this.arrows[index] = arrow;
    }
    return this.arrows[index];
  }

  /**
   * Positions one arrow per off-screen alien and hides the unused ones.
   *
   * @param {THREE.Camera} camera camera used to project the alien positions
   * @param {import('./aliens.js').Alien[]} aliens aliens to track
   */
  update(camera, aliens) {
    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    let used = 0;

    for (const alien of aliens) {
      this.projected.copy(alien.object.position).project(camera);
      const behind = this.projected.z > 1;
      let { x, y } = this.projected;
      if (behind) {
        x = -x;
        y = -y;
      }
      if (!behind && Math.abs(x) <= 1 && Math.abs(y) <= 1) continue;

      const angle = Math.atan2(-y * halfHeight, x * halfWidth);
      const scale = Math.min(
        (halfWidth - EDGE_MARGIN) / Math.abs(Math.cos(angle) || 1e-6),
        (halfHeight - EDGE_MARGIN) / Math.abs(Math.sin(angle) || 1e-6)
      );
      const arrow = this.getArrow(used++);
      arrow.style.display = 'block';
      arrow.style.borderLeftColor = `#${alien.color.toString(16).padStart(6, '0')}`;
      arrow.style.transform =
        `translate(${halfWidth + Math.cos(angle) * scale}px, ${halfHeight + Math.sin(angle) * scale}px) rotate(${angle}rad)`;
    }

    for (let i = used; i < this.arrows.length; i++) this.arrows[i].style.display = 'none';
  }
}
