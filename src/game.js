const STARTING_LIVES = 3;
const WAVE_BREAK = 3;
const WAVE_BONUS = 50;
const BEST_SCORE_KEY = 'invasion-ar-best-score';

/**
 * Game rules: waves of aliens, lives, score and best score.
 * It decides when to spawn aliens; the caller reacts to the returned events.
 */
export class Game {
  /**
   * @param {import('./aliens.js').AlienManager} aliens manager used to spawn and clear aliens
   * @param {import('./player.js').Player} player player the aliens spawn around
   */
  constructor(aliens, player) {
    this.aliens = aliens;
    this.player = player;
    this.state = 'menu';
    this.bestScore = Game.loadBestScore();
    this.reset();
  }

  /**
   * Puts score, lives and wave counters back to their starting values.
   */
  reset() {
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.wave = 0;
    this.toSpawn = 0;
    this.spawnTimer = 0;
    this.breakTimer = 0;
  }

  /**
   * Starts a new game from the first wave.
   */
  start() {
    this.aliens.clear();
    this.reset();
    this.nextWave();
  }

  /**
   * Prepares the next wave: more aliens, spawned faster, closer and flying faster.
   */
  nextWave() {
    this.wave += 1;
    this.toSpawn = 3 + this.wave * 2;
    this.spawnInterval = Math.max(1, 4 - this.wave * 0.4);
    this.speedFactor = 1 + (this.wave - 1) * 0.12;
    this.maxAlive = 3 + this.wave;
    this.spawnDistance = Math.max(45, 55 - this.wave * 2);
    this.spawnTimer = 0;
    this.breakTimer = WAVE_BREAK;
    this.state = 'wave-break';
  }

  /**
   * Advances the game by one frame.
   *
   * @param {number} delta seconds since the previous frame
   * @param {import('./aliens.js').Alien[]} arrived aliens that reached the player this frame
   * @returns {string[]} events that happened: 'wave-start', 'damage', 'wave-cleared', 'game-over'
   */
  update(delta, arrived) {
    const events = [];
    if (this.state === 'wave-break') {
      this.breakTimer -= delta;
      if (this.breakTimer <= 0) {
        this.state = 'playing';
        events.push('wave-start');
      }
      return events;
    }
    if (this.state !== 'playing') return events;

    if (arrived.length > 0) {
      this.lives = Math.max(0, this.lives - arrived.length);
      events.push('damage');
      if (this.lives === 0) {
        this.end();
        events.push('game-over');
        return events;
      }
    }

    this.spawnTimer -= delta;
    if (this.toSpawn > 0 && this.spawnTimer <= 0 && this.aliens.aliens.length < this.maxAlive) {
      this.aliens.spawnRandom(this.player.position, this.spawnDistance, this.spawnDistance + 15, this.speedFactor);
      this.toSpawn -= 1;
      this.spawnTimer = this.spawnInterval;
    }

    if (this.toSpawn === 0 && this.aliens.aliens.length === 0) {
      this.score += WAVE_BONUS * this.wave;
      events.push('wave-cleared');
      this.nextWave();
    }
    return events;
  }

  /**
   * Adds the points of a destroyed alien.
   *
   * @param {import('./aliens.js').Alien} alien destroyed alien
   */
  addKill(alien) {
    this.score += alien.points;
  }

  /**
   * Removes points from the score, without going below zero.
   *
   * @param {number} points points to remove
   */
  penalize(points) {
    this.score = Math.max(0, this.score - points);
  }

  /**
   * Ends the game and saves the best score.
   */
  end() {
    this.state = 'over';
    this.aliens.clear();
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      Game.saveBestScore(this.score);
    }
  }

  /**
   * @returns {boolean} true while the player can shoot
   */
  get isRunning() {
    return this.state === 'playing' || this.state === 'wave-break';
  }

  /**
   * Reads the best score from the browser storage.
   *
   * @returns {number} best score, 0 if none or storage unavailable
   */
  static loadBestScore() {
    try {
      return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Writes the best score to the browser storage, ignoring storage errors.
   *
   * @param {number} score score to save
   */
  static saveBestScore(score) {
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(score));
    } catch (err) {
      console.warn('Best score not saved:', err);
    }
  }
}
