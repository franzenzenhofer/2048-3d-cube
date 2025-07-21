import { CubeGameV3Fixed, CubeFace } from './game/CubeGameV3Fixed';
import { SwipeDirection } from './game/CubeGame';
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
  private freeRotationStartRotation: { x: number; y: number } | null = null;
  private freeRotationActive: boolean = false;
  private freeRotationPanStart: { x: number, y: number } | null = null;
  private currentZoom: number = 1;
  private initialPinchScale: number = 1;

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
      () => this.restart(),
      () => this.handleRotateStart(),
      (rotation) => this.handleRotate(rotation),
      () => this.handleRotateEnd(),
      (scale) => this.handlePinch(scale),
      (deltaX, deltaY) => this.handlePan(deltaX, deltaY)
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
      // Step 1: Animate tile movements on ALL faces
      const movements = this.game.getMoveHistory();
      if (movements.length > 0) {
        await this.cube.animateMovements(movements, previousActiveFace);
      }
      
      // Step 2: Update visuals to show merged tiles and new spawned tile
      this.updateVisuals();
      
      // Step 3: Longer delay to let merges be visible before rotating
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Rotate the cube to show the new active face
      if (result.rotation) {
        await this.cube.rotateCube(result.rotation, this.game);
      }
      
      // Update score with animation
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

  private handleRotateStart(): void {
    if (!this.isAnimating) {
      this.freeRotationActive = true;
      const cubeGroup = this.cube.getCubeGroup();
      this.freeRotationStartRotation = {
        x: cubeGroup.rotation.x,
        y: cubeGroup.rotation.y
      };
      this.freeRotationPanStart = null;
      this.initialPinchScale = this.currentZoom;
    }
  }

  private handleRotate(rotation: number): void {
    if (this.freeRotationActive && this.freeRotationStartRotation) {
      const cubeGroup = this.cube.getCubeGroup();
      // Apply rotation based on gesture
      cubeGroup.rotation.y = this.freeRotationStartRotation.y + (rotation * Math.PI / 180);
    }
  }

  private handleRotateEnd(): void {
    if (this.freeRotationActive) {
      this.freeRotationActive = false;
      // Don't snap back - allow free inspection!
      // this.cube.snapToForwardFace(this.game);
    }
  }

  private handlePan(deltaX: number, deltaY: number): void {
    if (!this.freeRotationActive || !this.freeRotationStartRotation) return;
    
    const cubeGroup = this.cube.getCubeGroup();
    const sensitivity = 0.005; // Adjust for comfortable rotation speed
    
    // Rotate based on drag distance
    cubeGroup.rotation.y = this.freeRotationStartRotation.y - (deltaX * sensitivity);
    cubeGroup.rotation.x = this.freeRotationStartRotation.x - (deltaY * sensitivity);
    
    // Clamp X rotation to prevent flipping
    cubeGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cubeGroup.rotation.x));
  }

  private handlePinch(scale: number): void {
    if (!this.freeRotationActive) return;
    
    // Apply zoom based on pinch scale
    const newZoom = this.initialPinchScale * scale;
    this.currentZoom = Math.max(0.5, Math.min(2, newZoom)); // Clamp between 0.5x and 2x
    
    const cubeGroup = this.cube.getCubeGroup();
    cubeGroup.scale.setScalar(this.currentZoom);
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