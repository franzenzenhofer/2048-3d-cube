import './style.css';
import { GameBoard, Direction } from './game/GameBoard';
import { GameScene } from './3d/GameScene';
import { CubeMatrix } from './3d/CubeMatrix';
import { SwipeControls } from './ui/SwipeControls';
import { GameUI } from './ui/GameUI';

class Game2048Cube {
  private board: GameBoard;
  private scene: GameScene;
  private cubeMatrix: CubeMatrix;
  private controls: SwipeControls;
  private ui: GameUI;
  private container: HTMLElement;
  private isAnimating: boolean = false;
  private hasWon: boolean = false;

  constructor() {
    this.setupDOM();
    this.board = new GameBoard();
    this.scene = new GameScene(this.container);
    this.cubeMatrix = new CubeMatrix(this.scene.scene);
    this.ui = new GameUI(this.container);
    this.controls = new SwipeControls(this.container, this.handleMove.bind(this));
    
    this.setupEventListeners();
    this.updateVisuals();
    this.startGameLoop();
  }

  private setupDOM(): void {
    const app = document.getElementById('app');
    if (!app) throw new Error('App element not found');
    
    app.innerHTML = '<div id="game-container"></div>';
    this.container = document.getElementById('game-container')!;
  }

  private setupEventListeners(): void {
    this.container.addEventListener('restart', () => {
      this.restart();
    });
  }

  private async handleMove(direction: Direction): Promise<void> {
    if (this.isAnimating || this.board.isGameOver()) return;
    
    this.isAnimating = true;
    const moved = this.board.move(direction);
    
    if (moved) {
      await this.cubeMatrix.rotateAfterMove(direction);
      this.updateVisuals();
      
      if (this.board.hasWon() && !this.hasWon) {
        this.hasWon = true;
        setTimeout(() => {
          this.ui.showWin(this.board.score);
        }, 500);
      } else if (this.board.isGameOver()) {
        setTimeout(() => {
          this.ui.showGameOver(this.board.score);
        }, 500);
      }
    }
    
    this.isAnimating = false;
  }

  private updateVisuals(): void {
    this.cubeMatrix.updateFromBoard(this.board);
    this.ui.updateScore(this.board.score);
  }

  private restart(): void {
    this.board.reset();
    this.hasWon = false;
    this.ui.hideGameOver();
    this.ui.hideWin();
    this.updateVisuals();
  }

  private startGameLoop(): void {
    const animate = () => {
      requestAnimationFrame(animate);
      this.scene.render();
    };
    animate();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game2048Cube();
});
