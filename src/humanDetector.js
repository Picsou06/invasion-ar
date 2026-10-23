const ML5_URL = 'https://cdn.jsdelivr.net/npm/ml5@1.4.0/dist/ml5.min.js';
const DETECTION_INTERVAL = 200;
const MIN_CONFIDENCE = 0.5;

/**
 * Loads the ml5.js library from its CDN by adding a script tag.
 * It is loaded lazily so the game starts without waiting for it.
 *
 * @returns {Promise<object>} the global ml5 object
 */
function loadMl5() {
  if (window.ml5) return Promise.resolve(window.ml5);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = ML5_URL;
    script.onload = () => resolve(window.ml5);
    script.onerror = () => reject(new Error('ml5.js could not be loaded'));
    document.head.appendChild(script);
  });
}

/**
 * Detects people in the camera feed with ml5.js (COCO-SSD object detection),
 * draws a frame around them and tells whether a screen point is on a person.
 */
export class HumanDetector {
  /**
   * @param {HTMLVideoElement} video camera feed to analyse
   * @param {HTMLCanvasElement} overlay full-screen canvas used to draw the frames
   */
  constructor(video, overlay) {
    this.video = video;
    this.overlay = overlay;
    this.ctx = overlay.getContext('2d');
    this.detector = null;
    this.people = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * Loads ml5.js and the COCO-SSD model, then starts the detection loop.
   * Does nothing when there is no camera feed.
   */
  async start() {
    if (!this.video.srcObject || this.detector) return;
    try {
      const ml5 = await loadMl5();
      this.detector = await ml5.objectDetection('cocossd');
      await this.detector.ready;
      this.detectLoop();
    } catch (err) {
      console.warn('Human detection unavailable:', err);
    }
  }

  /**
   * Runs one detection on the current video frame, keeps the people found
   * and schedules the next detection.
   */
  async detectLoop() {
    if (this.video.readyState >= 2) {
      try {
        const results = await this.detector.detect(this.video);
        this.people = results.filter((r) => r.label === 'person' && r.confidence >= MIN_CONFIDENCE);
        this.draw();
      } catch (err) {
        console.warn('Detection failed:', err);
      }
    }
    setTimeout(() => this.detectLoop(), DETECTION_INTERVAL);
  }

  /**
   * Matches the overlay resolution to the window size.
   */
  resize() {
    this.overlay.width = window.innerWidth;
    this.overlay.height = window.innerHeight;
    this.draw();
  }

  /**
   * Converts a box from video pixels to screen pixels, taking into account the
   * "object-fit: cover" cropping of the video element.
   *
   * @param {{x: number, y: number, width: number, height: number}} box box in video pixels
   * @returns {{x: number, y: number, width: number, height: number}} box in screen pixels
   */
  toScreen(box) {
    const { videoWidth, videoHeight } = this.video;
    const scale = Math.max(window.innerWidth / videoWidth, window.innerHeight / videoHeight);
    const offsetX = (window.innerWidth - videoWidth * scale) / 2;
    const offsetY = (window.innerHeight - videoHeight * scale) / 2;
    return {
      x: box.x * scale + offsetX,
      y: box.y * scale + offsetY,
      width: box.width * scale,
      height: box.height * scale,
    };
  }

  /**
   * Draws a dashed frame and a label around every detected person.
   */
  draw() {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.font = '13px sans-serif';
    for (const person of this.people) {
      const box = this.toScreen(person);
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      ctx.fillText(`Humain ${Math.round(person.confidence * 100)}%`, box.x + 4, box.y + 16);
    }
    ctx.setLineDash([]);
  }

  /**
   * @param {number} x horizontal screen position in pixels
   * @param {number} y vertical screen position in pixels
   * @returns {boolean} true if the point is inside a detected person
   */
  isPersonAt(x, y) {
    return this.people.some((person) => {
      const box = this.toScreen(person);
      return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
    });
  }
}
