const BANNER_DURATION = 1800;
const DAMAGE_FLASH_DURATION = 350;

/**
 * DOM overlay of the game: score bar, wave banner, damage flash and screens.
 */
export class Hud {
  constructor() {
    this.bar = document.getElementById('hud');
    this.score = document.getElementById('hud-score');
    this.wave = document.getElementById('hud-wave');
    this.lives = document.getElementById('hud-lives');
    this.banner = document.getElementById('banner');
    this.damage = document.getElementById('damage');
    this.menu = document.getElementById('menu');
    this.menuBest = document.getElementById('menu-best');
    this.gameOver = document.getElementById('game-over');
    this.finalScore = document.getElementById('final-score');
    this.finalBest = document.getElementById('final-best');
    this.bannerTimeout = null;
  }

  /**
   * Updates the score, wave and lives display.
   *
   * @param {import('./game.js').Game} game current game
   */
  update(game) {
    this.score.textContent = game.score;
    this.wave.textContent = game.wave;
    this.lives.textContent = '❤️'.repeat(game.lives) + '🖤'.repeat(Math.max(0, 3 - game.lives));
  }

  /**
   * Shows a big message in the middle of the screen for a short time.
   *
   * @param {string} text message to display
   */
  showBanner(text) {
    this.banner.textContent = text;
    this.banner.classList.remove('hidden');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => this.banner.classList.add('hidden'), BANNER_DURATION);
  }

  /**
   * Flashes the screen red when the player loses a life.
   */
  flashDamage() {
    this.damage.classList.add('visible');
    setTimeout(() => this.damage.classList.remove('visible'), DAMAGE_FLASH_DURATION);
  }

  /**
   * Shows the start menu with the best score.
   *
   * @param {number} bestScore best score so far
   */
  showMenu(bestScore) {
    this.menuBest.textContent = bestScore > 0 ? `Meilleur score : ${bestScore}` : '';
  }

  /**
   * Hides the menus and shows the in-game overlay.
   */
  showGame() {
    this.menu.classList.add('hidden');
    this.gameOver.classList.add('hidden');
    this.bar.classList.remove('hidden');
  }

  /**
   * Shows the game over screen.
   *
   * @param {number} score final score
   * @param {number} bestScore best score so far
   */
  showGameOver(score, bestScore) {
    this.finalScore.textContent = score;
    this.finalBest.textContent = bestScore;
    this.gameOver.classList.remove('hidden');
    this.banner.classList.add('hidden');
  }
}
