const TEMPO = 150;
const STEP_DURATION = 60 / TEMPO / 4;
const LOOKAHEAD = 0.15;
const SCHEDULER_INTERVAL = 25;
const VOLUME = 0.08;
const HOLD = -1;
const REST = 0;

const MELODY = [
  69, HOLD, 72, HOLD, 76, HOLD, 74, 72, 69, HOLD, HOLD, HOLD, 67, HOLD, 69, HOLD,
  65, HOLD, 69, HOLD, 72, HOLD, 69, HOLD, 77, HOLD, 76, HOLD, 74, HOLD, 72, HOLD,
  72, HOLD, 76, HOLD, 79, HOLD, 76, 74, 72, HOLD, HOLD, HOLD, 74, HOLD, 76, HOLD,
  74, HOLD, 71, HOLD, 67, HOLD, 71, HOLD, 79, HOLD, 77, HOLD, 76, HOLD, 74, HOLD,
];
const BASS_ROOTS = [45, 41, 48, 43];

/**
 * Original looping 8-bit background music, played with Web Audio oscillators
 * (square lead, triangle bass, noise hi-hat) and a look-ahead scheduler.
 */
export class Music {
  /**
   * @param {import('./audio.js').Sounds} sounds sound manager providing the audio context
   */
  constructor(sounds) {
    this.sounds = sounds;
    this.output = null;
    this.timer = null;
    this.step = 0;
    this.nextTime = 0;
    this.noiseBuffer = null;
  }

  /**
   * Starts the music loop from the beginning. Does nothing if audio is not unlocked yet.
   */
  start() {
    const { context } = this.sounds;
    if (!context || this.timer) return;
    if (!this.output) {
      this.output = context.createGain();
      this.output.connect(context.destination);
      this.noiseBuffer = this.createNoiseBuffer(context);
    }
    this.setMuted(this.sounds.muted);
    this.step = 0;
    this.nextTime = context.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), SCHEDULER_INTERVAL);
  }

  /**
   * Stops the music loop.
   */
  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  /**
   * @param {boolean} muted true to silence the music
   */
  setMuted(muted) {
    if (this.output) this.output.gain.value = muted ? 0 : VOLUME;
  }

  /**
   * Schedules every step that starts within the look-ahead window.
   */
  schedule() {
    const { context } = this.sounds;
    while (this.nextTime < context.currentTime + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime);
      this.step = (this.step + 1) % MELODY.length;
      this.nextTime += STEP_DURATION;
    }
  }

  /**
   * Plays the lead, bass and drums of one sixteenth-note step.
   *
   * @param {number} step index in the loop
   * @param {number} time audio context time of the step
   */
  playStep(step, time) {
    const note = MELODY[step];
    if (note > REST) this.playNote('square', note, time, this.noteLength(step) * STEP_DURATION * 0.9, 0.5);

    const bar = Math.floor(step / 16);
    const beat = step % 16;
    if (beat % 2 === 0) {
      const octave = beat % 4 === 0 ? 0 : 12;
      this.playNote('triangle', BASS_ROOTS[bar] + octave, time, STEP_DURATION * 1.6, 1);
    }
    if (beat % 4 === 2) this.playHat(time);
  }

  /**
   * Counts how many steps a melody note lasts (itself plus the following holds).
   *
   * @param {number} step index of the note in the melody
   * @returns {number} length in steps
   */
  noteLength(step) {
    let length = 1;
    while (MELODY[(step + length) % MELODY.length] === HOLD) length++;
    return length;
  }

  /**
   * Plays one oscillator note with a short decay envelope.
   *
   * @param {OscillatorType} type oscillator waveform
   * @param {number} midi MIDI note number
   * @param {number} time start time in the audio context
   * @param {number} duration note length in seconds
   * @param {number} volume gain relative to the music volume
   */
  playNote(type, midi, time, duration, volume) {
    const context = this.sounds.context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(gain).connect(this.output);
    oscillator.start(time);
    oscillator.stop(time + duration);
  }

  /**
   * Plays a very short noise burst used as a hi-hat.
   *
   * @param {number} time start time in the audio context
   */
  playHat(time) {
    const context = this.sounds.context;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = this.noiseBuffer;
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    source.connect(gain).connect(this.output);
    source.start(time);
    source.stop(time + 0.05);
  }

  /**
   * Builds a short white noise buffer reused by every hi-hat.
   *
   * @param {AudioContext} context audio context
   * @returns {AudioBuffer} noise buffer
   */
  createNoiseBuffer(context) {
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.05), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}
