import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VISIBLE_RANGE } from './aliens.js';

const ZOOM = 16;
const REFRESH_INTERVAL = 0.2;

/**
 * Leaflet map following the player's real position, showing the shooting
 * range around them and every alien, even the ones too far to be seen in AR.
 */
export class MiniMap {
  /**
   * @param {HTMLElement} panel hidden panel wrapping the map and its status line
   * @param {HTMLElement} container element holding the map
   * @param {HTMLElement} status element displaying the GPS status
   * @param {import('./player.js').Player} player player to follow
   */
  constructor(panel, container, status, player) {
    this.panel = panel;
    this.status = status;
    this.player = player;
    this.refreshTimer = 0;
    this.alienMarkers = new Map();

    this.map = L.map(container, {
      center: player.latLng,
      zoom: ZOOM,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    });
    this.map.attributionControl.setPrefix(false);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    this.rangeCircle = L.circle(player.latLng, {
      radius: VISIBLE_RANGE,
      color: '#ff3b3b',
      weight: 1,
      dashArray: '4 4',
      fillOpacity: 0.08,
      interactive: false,
    }).addTo(this.map);
    this.playerMarker = L.marker(player.latLng, {
      icon: L.divIcon({ className: 'player-icon', html: '<div class="player-arrow"></div>', iconSize: [22, 22] }),
      interactive: false,
    }).addTo(this.map);
    this.setStatus('Base par défaut : IUT');
  }

  /**
   * Displays the map panel. Leaflet must recompute its size because the
   * map was created while hidden.
   */
  show() {
    this.panel.classList.remove('hidden');
    this.map.invalidateSize();
    this.map.setView(this.player.latLng, ZOOM, { animate: false });
  }

  /**
   * @param {string} text GPS status shown under the map
   */
  setStatus(text) {
    this.status.textContent = text;
  }

  /**
   * Re-centers the map on the player and refreshes the markers a few times per second.
   *
   * @param {number} delta seconds since the previous frame
   * @param {number} heading compass heading of the camera, in degrees
   * @param {import('./aliens.js').Alien[]} aliens aliens to display
   */
  update(delta, heading, aliens) {
    this.refreshTimer -= delta;
    if (this.refreshTimer > 0) return;
    this.refreshTimer = REFRESH_INTERVAL;

    const position = this.player.latLng;
    this.map.setView(position, ZOOM, { animate: false });
    this.rangeCircle.setLatLng(position);
    this.playerMarker.setLatLng(position);
    const arrow = this.playerMarker.getElement()?.firstChild;
    if (arrow) arrow.style.transform = `rotate(${heading}deg)`;
    this.updateAlienMarkers(aliens);
  }

  /**
   * Adds, moves and removes alien markers so they match the current aliens.
   * Aliens in shooting range are drawn bigger.
   *
   * @param {import('./aliens.js').Alien[]} aliens aliens to display
   */
  updateAlienMarkers(aliens) {
    for (const [alien, marker] of this.alienMarkers) {
      if (!aliens.includes(alien)) {
        marker.remove();
        this.alienMarkers.delete(alien);
      }
    }
    for (const alien of aliens) {
      const latLng = this.player.toLatLng(alien.object.position);
      if (!this.alienMarkers.has(alien)) {
        const color = `#${alien.color.toString(16).padStart(6, '0')}`;
        const marker = L.circleMarker(latLng, { color, fillColor: color, fillOpacity: 0.9, weight: 1, interactive: false });
        this.alienMarkers.set(alien, marker.addTo(this.map));
      }
      this.alienMarkers.get(alien).setLatLng(latLng).setRadius(alien.isVisible ? 6 : 4);
    }
  }
}
