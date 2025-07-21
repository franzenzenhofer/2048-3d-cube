import { CubeGameV3Fixed, SwipeDirection, CubeFace } from './game/CubeGameV3Fixed';
import { EnhancedScene } from './3d/EnhancedScene';
import { AnimatedCube } from './3d/AnimatedCube';
import { TouchControls } from './ui/TouchControls';
import { MinimalUI } from './ui/MinimalUI';

export class Game2048V3 {
  private game: CubeGameV3Fixed;
  private scene: EnhancedScene;
  private cube: AnimatedCube;
  private controls: TouchControls;
  private ui: MinimalUI;
  private container: HTMLElement;
  private isAnimating: boolean = false;
  private gameStarted: boolean = false;

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
    this.game = new CubeGameV3Fixed();
    this.scene = new EnhancedScene(this.container);
    this.cube = new AnimatedCube(this.scene.scene);
    this.controls = new TouchControls(
      this.container,
      (direction) => this.handleMove(direction),
      () => this.restart()
    );
    
    this.updateVisuals(true);
    this.scene.render();
  }

  private async handleMove(direction: SwipeDirection): Promise<void> {
    if (this.isAnimating || this.game.isGameOver()) return;
    
    this.isAnimating = true;
    const previousScore = this.game.getScore();
    const previousActiveFace = this.game.getActiveFace();
    const result = this.game.move(direction);
    
    if (result.moved) {
      // Animate tile movements on the active face only
      const movements = this.game.getMoveHistory();
      if (movements.length > 0) {
        await this.cube.animateMovements(movements, previousActiveFace);
      }
      
      // Update visuals after movement
      this.updateVisuals();
      
      // Then rotate the cube to show the new active face
      if (result.rotation) {
        await this.cube.rotateCube(result.rotation);
      }
      
      // Update score
      if (this.game.getScore() > previousScore) {
        this.ui.updateScore(this.game.getScore());
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

  private updateVisuals(skipAnimation: boolean = false): void {
    this.cube.updateFromGame(this.game, skipAnimation);
    this.ui.updateScore(this.game.getScore());
    
    // Show active face indicator
    const activeFace = this.game.getActiveFace();
    this.cube.highlightActiveFace(activeFace);
  }

  private restart(): void {
    if (this.scene) {
      this.scene.dispose();
    }
    if (this.cube) {
      this.cube.dispose();
    }
    if (this.controls) {
      this.controls.destroy();
    }
    
    this.gameStarted = false;
    this.isAnimating = false;
    
    // Reset UI
    this.ui = new MinimalUI(this.container, () => this.startGame());
  }
}