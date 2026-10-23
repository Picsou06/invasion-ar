import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_BASE = { lat: 43.616513, lng: 7.072094 };
const ZOOM = 18;
const METERS_PER_DEGREE = 111320;
const REFRESH_INTERVAL = 0.2;

/**
 * Small Leaflet map showing the player's real GPS position (the "base"),
 * the direction they are facing and the aliens converted to map coordinates.
 */
export class MiniMap {
  /**
   * @param {HTMLElement} panel hidden panel wrapping the map and its status line
   * @param {HTMLElement} container element holding the map
   * @param {HTMLElement} status element displaying the GPS status
   */
  constructor(panel, container, status) {
    this.panel = panel;
    this.status = status;
    this.base = { ...DEFAULT_BASE };
    this.refreshTimer = 0;
    this.alienMarkers = new Map();

    this.map = L.map(container, {
      center: this.base,
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

    this.accuracyCircle = L.circle(this.base, { radius: 0, color: '#4fc3ff', weight: 1, fillOpacity: 0.15 }).addTo(this.map);
    this.playerMarker = L.marker(this.base, {
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
    this.map.setView(this.base, ZOOM, { animate: false });
  }

  /**
   * Starts following the player's GPS position. Keeps the default base if
   * geolocation is unavailable or refused.
   */
  start() {
    if (!navigator.geolocation) return;
    this.setStatus('Recherche GPS…');
    navigator.geolocation.watchPosition(
      (position) => this.onPosition(position),
      (err) => {
        console.warn('Geolocation unavailable:', err);
        this.setStatus('Pas de GPS : base IUT');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  /**
   * Moves the base to the new GPS position.
   *
   * @param {GeolocationPosition} position position returned by the Geolocation API
   */
  onPosition(position) {
    const { latitude, longitude, accuracy } = position.coords;
    this.base = { lat: latitude, lng: longitude };
    this.playerMarker.setLatLng(this.base);
    this.accuracyCircle.setLatLng(this.base).setRadius(accuracy);
    this.map.setView(this.base, ZOOM, { animate: false });
    this.setStatus(`Base GPS ±${Math.round(accuracy)} m`);
  }

  /**
   * @param {string} text GPS status shown under the map
   */
  setStatus(text) {
    this.status.textContent = text;
  }

  /**
   * Converts a position in the 3D world (meters around the player) to map coordinates.
   *
   * @param {{x: number, z: number}} position world position, north = -Z, east = +X
   * @returns {{lat: number, lng: number}} geographic coordinates
   */
  worldToLatLng({ x, z }) {
    const lat = this.base.lat - z / METERS_PER_DEGREE;
    const lng = this.base.lng + x / (METERS_PER_DEGREE * Math.cos((this.base.lat * Math.PI) / 180));
    return { lat, lng };
  }

  /**
   * Refreshes the player direction and the alien markers a few times per second.
   *
   * @param {number} delta seconds since the previous frame
   * @param {number} heading compass heading of the camera, in degrees
   * @param {import('./aliens.js').Alien[]} aliens aliens to display
   */
  update(delta, heading, aliens) {
    this.refreshTimer -= delta;
    if (this.refreshTimer > 0) return;
    this.refreshTimer = REFRESH_INTERVAL;

    const arrow = this.playerMarker.getElement()?.firstChild;
    if (arrow) arrow.style.transform = `rotate(${heading}deg)`;
    this.updateAlienMarkers(aliens);
  }

  /**
   * Adds, moves and removes alien markers so they match the current aliens.
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
      const latLng = this.worldToLatLng(alien.object.position);
      if (this.alienMarkers.has(alien)) {
        this.alienMarkers.get(alien).setLatLng(latLng);
      } else {
        const color = `#${alien.color.toString(16).padStart(6, '0')}`;
        const marker = L.circleMarker(latLng, { radius: 5, color, fillColor: color, fillOpacity: 0.9, weight: 1 });
        this.alienMarkers.set(alien, marker.addTo(this.map));
      }
    }
  }
}
