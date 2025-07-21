export class MinimalUI {
  private container: HTMLElement;
  private scoreElement: HTMLElement;
  private startScreen: HTMLElement;
  private gameScreen: HTMLElement;
  private onStart: () => void;

  constructor(container: HTMLElement, onStart: () => void) {
    this.container = container;
    this.onStart = onStart;
    this.createUI();
  }

  private createUI(): void {
    // Start screen
    this.startScreen = document.createElement('div');
    this.startScreen.className = 'start-screen';
    this.startScreen.innerHTML = `
      <div class="start-content">
        <h1 class="start-title">2048<span class="cube-3d">³</span></h1>
        <p class="start-subtitle">A 3D PUZZLE</p>
        <div class="start-hint">TAP TO BEGIN</div>
        <div class="version-start">v${(window as any).__APP_VERSION__ || '2.0.0'}</div>
      </div>
    `;
    this.container.appendChild(this.startScreen);

    // Game screen
    this.gameScreen = document.createElement('div');
    this.gameScreen.className = 'game-screen';
    this.gameScreen.innerHTML = `
      <div class="score-display">
        <span id="score">0</span>
      </div>
    `;
    this.gameScreen.style.display = 'none';
    this.container.appendChild(this.gameScreen);

    this.scoreElement = document.getElementById('score')!;

    // Start game on tap/click
    this.startScreen.addEventListener('click', () => {
      this.showGame();
      this.onStart();
    });

    this.startScreen.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.showGame();
      this.onStart();
    });
  }

  private showGame(): void {
    this.startScreen.style.display = 'none';
    this.gameScreen.style.display = 'block';
  }

  public updateScore(score: number): void {
    this.scoreElement.textContent = score.toString();
    this.scoreElement.classList.add('score-pop');
    setTimeout(() => {
      this.scoreElement.classList.remove('score-pop');
    }, 300);
  }

  public showGameOver(score: number): void {
    // Simply fade the game
    this.gameScreen.classList.add('game-over');
    
    setTimeout(() => {
      this.gameScreen.style.display = 'none';
      this.startScreen.style.display = 'flex';
      this.gameScreen.classList.remove('game-over');
    }, 2000);
  }

  public showWin(score: number): void {
    // Celebration effect
    this.gameScreen.classList.add('game-win');
    
    setTimeout(() => {
      this.gameScreen.classList.remove('game-win');
    }, 3000);
  }

  public showFaceUnlock(face: string): void {
    const unlock = document.createElement('div');
    unlock.className = 'face-unlock';
    unlock.textContent = `${face} UNLOCKED`;
    this.gameScreen.appendChild(unlock);
    
    setTimeout(() => {
      unlock.remove();
    }, 2000);
  }
}