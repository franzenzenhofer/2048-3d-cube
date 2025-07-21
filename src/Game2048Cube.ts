import { CubeGame, SwipeDirection, CubeFace } from './game/CubeGame';
import { OptimizedScene } from './3d/OptimizedScene';
import { IsometricCube } from './3d/IsometricCube';
import { TouchControls } from './ui/TouchControls';
import { MinimalUI } from './ui/MinimalUI';

export class Game2048Cube {
  private game: CubeGame;
  private scene: OptimizedScene;
  private cube: IsometricCube;
  private controls: TouchControls;
  private ui: MinimalUI;
  private container: HTMLElement;
  private isAnimating: boolean = false;
  private gameStarted: boolean = false;
  private lastUnlockedFaces: number = 3;

  constructor() {
    this.setupDOM();
    this.setupGame();
  }

  private setupDOM(): void {
    const app = document.getElementById('app');
    if (!app) throw new Error('App element not found');
    
    app.innerHTML = '<div id="game-container"></div>';
    this.container = document.getElementById('game-container')!;
  }

  private setupGame(): void {
    this.ui = new MinimalUI(this.container, () => this.startGame());
  }

  private startGame(): void {
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.initializeGame();
    } else {
      this.restart();
    }
  }

  private initializeGame(): void {
    this.game = new CubeGame();
    this.scene = new OptimizedScene(this.container);
    this.cube = new IsometricCube(this.scene.scene);
    this.controls = new TouchControls(
      this.container,
      (direction) => this.handleMove(direction),
      () => this.restart()
    );
    
    this.updateVisuals();
    this.startGameLoop();
  }

  private async handleMove(direction: SwipeDirection): Promise<void> {
    if (this.isAnimating || this.game.isGameOver()) return;
    
    this.isAnimating = true;
    const previousScore = this.game.getScore();
    const moved = this.game.move(direction);
    
    if (moved) {
      // Animate tile movements
      const movements = this.game.getMoveHistory();
      if (movements.length > 0) {
        await this.cube.animateMovements(movements);
      }
      
      // Update visuals
      this.updateVisuals();
      
      // Rotate to optimal viewing angle
      const optimalAngle = this.game.getOptimalViewAngle();
      await this.cube.rotateToAngle(optimalAngle, 400);
      
      // Check for face unlocks
      const currentUnlockedCount = this.game.getUnlockedFaces().length;
      if (currentUnlockedCount > this.lastUnlockedFaces) {
        const newFace = this.game.getUnlockedFaces()[currentUnlockedCount - 1];
        this.ui.showFaceUnlock(this.getFaceName(newFace));
        this.lastUnlockedFaces = currentUnlockedCount;
      }
      
      // Check win/lose conditions
      if (this.game.hasWon()) {
        setTimeout(() => {
          this.ui.showWin(this.game.getScore());
        }, 500);
      } else if (this.game.isGameOver()) {
        setTimeout(() => {
          this.ui.showGameOver(this.game.getScore());
        }, 500);
      }
    }
    
    this.isAnimating = false;
  }

  private updateVisuals(): void {
    this.cube.updateFromGame(this.game);
    this.ui.updateScore(this.game.getScore());
  }

  private restart(): void {
    this.game = new CubeGame();
    this.lastUnlockedFaces = 3;
    this.updateVisuals();
  }

  private getFaceName(face: CubeFace): string {
    switch(face) {
      case CubeFace.TOP: return 'TOP FACE';
      case CubeFace.BOTTOM: return 'BOTTOM FACE';
      case CubeFace.BACK: return 'BACK FACE';
      default: return face;
    }
  }

  private startGameLoop(): void {
    const animate = () => {
      requestAnimationFrame(animate);
      this.scene.render();
    };
    animate();
  }
}