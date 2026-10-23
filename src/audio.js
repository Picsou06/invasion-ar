/**
 * Retro sound effects synthesized with the Web Audio API (no audio files).
 */
export class Sounds {
  /**
   * The audio context is created later, on the first user gesture.
   */
  constructor() {
    this.context = null;
    this.muted = false;
  }

  /**
   * Creates the audio context. Must be called from a user gesture (iOS/Chrome autoplay rules).
   */
  unlock() {
    if (this.context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) this.context = new AudioContext();
  }

  /**
   * Switches the sound on or off.
   *
   * @returns {boolean} true if the sound is now muted
   */
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * @returns {boolean} true if sounds can be played right now
   */
  get ready() {
    return this.context !== null && !this.muted;
  }

  /**
   * Plays a tone whose pitch slides from one frequency to another.
   *
   * @param {OscillatorType} type oscillator waveform
   * @param {number} from start frequency in Hz
   * @param {number} to end frequency in Hz
   * @param {number} duration length in seconds
   * @param {number} volume peak gain between 0 and 1
   * @param {number} [delay=0] seconds before the tone starts
   */
  tone(type, from, to, duration, volume, delay = 0) {
    if (!this.ready) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  /**
   * Plays a burst of white noise fading out, used for explosions.
   *
   * @param {number} duration length in seconds
   * @param {number} volume peak gain between 0 and 1
   */
  noise(duration, volume) {
    if (!this.ready) return;
    const length = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain).connect(this.context.destination);
    source.start();
  }

  /**
   * Laser shot.
   */
  shoot() {
    this.tone('square', 900, 120, 0.15, 0.12);
  }

  /**
   * Alien destroyed.
   */
  explosion() {
    this.noise(0.4, 0.35);
    this.tone('triangle', 200, 40, 0.4, 0.3);
  }

  /**
   * Player hit by an alien.
   */
  damage() {
    this.tone('sawtooth', 160, 50, 0.5, 0.3);
  }

  /**
   * New wave starting: short rising arpeggio.
   */
  waveStart() {
    [330, 440, 660].forEach((frequency, i) => this.tone('square', frequency, frequency, 0.12, 0.1, i * 0.12));
  }

  /**
   * Game over: slow descending notes.
   */
  gameOver() {
    [392, 330, 262, 196].forEach((frequency, i) => this.tone('triangle', frequency, frequency * 0.97, 0.35, 0.2, i * 0.3));
  }
}
