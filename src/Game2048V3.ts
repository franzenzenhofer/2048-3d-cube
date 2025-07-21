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
  private rotationMode: boolean = false;
  private rotationModeIndicator: HTMLElement | null = null;

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
      (deltaX, deltaY) => this.handlePan(deltaX, deltaY),
      () => this.enterRotationMode()
    );
    
    this.updateVisuals(true);
    this.scene.render();
  }

  private async handleMove(direction: SwipeDirection): Promise<void> {
    if (this.isAnimating || this.game.isGameOver()) return;
    
    // If in rotation mode, exit it
    if (this.rotationMode) {
      this.exitRotationMode();
    }
    
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
    
    if (this.rotationMode) {
      // In rotation mode: full 360° rotation on all axes
      cubeGroup.rotation.y = this.freeRotationStartRotation.y - (deltaX * sensitivity);
      cubeGroup.rotation.x = this.freeRotationStartRotation.x - (deltaY * sensitivity);
      // No clamping - allow full rotation!
    } else {
      // Normal mode: limited rotation with clamping
      cubeGroup.rotation.y = this.freeRotationStartRotation.y - (deltaX * sensitivity);
      cubeGroup.rotation.x = this.freeRotationStartRotation.x - (deltaY * sensitivity);
      
      // Clamp X rotation to prevent flipping
      cubeGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cubeGroup.rotation.x));
    }
  }

  private handlePinch(scale: number): void {
    // Pinch works in both modes
    if (!this.freeRotationActive && !this.rotationMode) return;
    
    // Apply zoom based on pinch scale
    const newZoom = this.initialPinchScale * scale;
    this.currentZoom = Math.max(0.5, Math.min(2, newZoom)); // Clamp between 0.5x and 2x
    
    const cubeGroup = this.cube.getCubeGroup();
    cubeGroup.scale.setScalar(this.currentZoom);
  }

  private enterRotationMode(): void {
    this.rotationMode = true;
    this.controls.setRotationMode(true);
    this.showRotationModeIndicator();
    
    // Start free rotation
    this.handleRotateStart();
  }

  private exitRotationMode(): void {
    this.rotationMode = false;
    this.controls.setRotationMode(false);
    this.hideRotationModeIndicator();
    
    // Snap back to forward face when exiting rotation mode
    this.cube.snapToForwardFace(this.game);
  }

  private showRotationModeIndicator(): void {
    if (!this.rotationModeIndicator) {
      this.rotationModeIndicator = document.createElement('div');
      this.rotationModeIndicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 255, 65, 0.1);
        border: 2px solid #00FF41;
        border-radius: 50%;
        width: 150px;
        height: 150px;
        pointer-events: none;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Orbitron', monospace;
        color: #00FF41;
        font-size: 14px;
        text-align: center;
        animation: pulse 2s ease-in-out infinite;
      `;
      this.rotationModeIndicator.innerHTML = '<div>ROTATION<br>MODE</div>';
      
      // Add pulse animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(this.rotationModeIndicator);
  }

  private hideRotationModeIndicator(): void {
    if (this.rotationModeIndicator && this.rotationModeIndicator.parentNode) {
      this.rotationModeIndicator.parentNode.removeChild(this.rotationModeIndicator);
    }
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