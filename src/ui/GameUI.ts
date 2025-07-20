export class GameUI {
  private container: HTMLElement;
  private scoreElement: HTMLElement;
  private gameOverElement: HTMLElement;
  private winElement: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.createUI();
  }

  private createUI(): void {
    const uiOverlay = document.createElement('div');
    uiOverlay.className = 'ui-overlay';
    uiOverlay.innerHTML = `
      <div class="game-header">
        <h1 class="game-title">2048<span class="cube-3d">³</span></h1>
        <div class="score-container">
          <div class="score-label">SCORE</div>
          <div class="score-value" id="score">0</div>
        </div>
      </div>
      <div class="game-controls">
        <div class="control-hint">
          <span class="icon">👆</span> Swipe to move
        </div>
        <div class="control-hint">
          <span class="icon">🔄</span> Double tap to restart
        </div>
      </div>
      <div class="game-over" id="game-over">
        <div class="overlay-content">
          <h2>GAME OVER</h2>
          <p>Final Score: <span id="final-score">0</span></p>
          <button id="restart-button" class="neon-button">RESTART</button>
        </div>
      </div>
      <div class="game-win" id="game-win">
        <div class="overlay-content">
          <h2>YOU WIN!</h2>
          <p>Score: <span id="win-score">0</span></p>
          <button id="continue-button" class="neon-button">CONTINUE</button>
        </div>
      </div>
    `;
    this.container.appendChild(uiOverlay);

    this.scoreElement = document.getElementById('score')!;
    this.gameOverElement = document.getElementById('game-over')!;
    this.winElement = document.getElementById('game-win')!;

    document.getElementById('restart-button')?.addEventListener('click', () => {
      this.container.dispatchEvent(new CustomEvent('restart'));
    });

    document.getElementById('continue-button')?.addEventListener('click', () => {
      this.hideWin();
    });
  }

  public updateScore(score: number): void {
    this.scoreElement.textContent = score.toString();
    this.scoreElement.classList.add('score-pop');
    setTimeout(() => {
      this.scoreElement.classList.remove('score-pop');
    }, 300);
  }

  public showGameOver(finalScore: number): void {
    const finalScoreElement = document.getElementById('final-score');
    if (finalScoreElement) {
      finalScoreElement.textContent = finalScore.toString();
    }
    this.gameOverElement.classList.add('show');
  }

  public hideGameOver(): void {
    this.gameOverElement.classList.remove('show');
  }

  public showWin(score: number): void {
    const winScoreElement = document.getElementById('win-score');
    if (winScoreElement) {
      winScoreElement.textContent = score.toString();
    }
    this.winElement.classList.add('show');
  }

  public hideWin(): void {
    this.winElement.classList.remove('show');
  }
}