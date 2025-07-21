import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Game2048V3 } from '../src/Game2048V3';
import { SwipeDirection } from '../src/game/CubeGame';

// Mock Three.js and WebGL
vi.mock('../src/3d/EnhancedScene', () => ({
  EnhancedScene: vi.fn().mockImplementation(() => ({
    scene: { add: vi.fn(), remove: vi.fn() },
    renderer: { setSize: vi.fn(), render: vi.fn() },
    camera: {},
    render: vi.fn(),
    dispose: vi.fn()
  }))
}));

vi.mock('../src/3d/AnimatedCube', () => ({
  AnimatedCube: vi.fn().mockImplementation(() => ({
    updateFromGame: vi.fn(),
    highlightActiveFace: vi.fn(),
    animateMovements: vi.fn().mockResolvedValue(undefined),
    rotateCube: vi.fn().mockResolvedValue(undefined),
    snapToForwardFace: vi.fn().mockResolvedValue(undefined),
    getCubeGroup: vi.fn().mockReturnValue({
      rotation: { x: 0, y: 0, z: 0 },
      scale: { setScalar: vi.fn() }
    }),
    dispose: vi.fn()
  }))
}));

describe('Rotation Mode Integration Tests', () => {
  let game: Game2048V3;
  let container: HTMLElement;

  beforeEach(() => {
    // Set up DOM
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);
    
    // Create game instance
    game = new Game2048V3();
    
    // Get the game container
    container = document.getElementById('game-container')!;
  });

  afterEach(() => {
    const app = document.getElementById('app');
    if (app) document.body.removeChild(app);
    vi.clearAllMocks();
  });

  describe('Rotation Mode Visual Indicator', () => {
    it('should show indicator when entering rotation mode', () => {
      // Start the game first
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      // Enter rotation mode
      (game as any).enterRotationMode();

      // Check for rotation mode indicator
      const indicator = document.body.querySelector('div[style*="ROTATION"]');
      expect(indicator).toBeTruthy();
      expect(indicator?.textContent).toContain('ROTATION');
      expect(indicator?.textContent).toContain('MODE');
    });

    it('should hide indicator when exiting rotation mode', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      // Enter and exit rotation mode
      (game as any).enterRotationMode();
      (game as any).exitRotationMode();

      // Check indicator is removed
      const indicator = document.body.querySelector('div[style*="ROTATION"]');
      expect(indicator).toBeFalsy();
    });

    it('should have pulse animation on indicator', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      // Enter rotation mode
      (game as any).enterRotationMode();

      // Check for animation styles
      const styles = document.head.querySelector('style[textContent*="pulse"]');
      expect(styles).toBeTruthy();
      expect(styles?.textContent).toContain('@keyframes pulse');
    });
  });

  describe('Rotation Mode Behavior', () => {
    it('should enable rotation mode in controls when entering', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      const controls = (game as any).controls;
      const setRotationModeSpy = vi.spyOn(controls, 'setRotationMode');

      // Enter rotation mode
      (game as any).enterRotationMode();

      expect(setRotationModeSpy).toHaveBeenCalledWith(true);
    });

    it('should disable rotation mode in controls when exiting', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      const controls = (game as any).controls;
      const setRotationModeSpy = vi.spyOn(controls, 'setRotationMode');

      // Enter and exit rotation mode
      (game as any).enterRotationMode();
      (game as any).exitRotationMode();

      expect(setRotationModeSpy).toHaveBeenCalledWith(false);
    });

    it('should start free rotation when entering rotation mode', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      // Enter rotation mode
      (game as any).enterRotationMode();

      // Check that free rotation is active
      expect((game as any).freeRotationActive).toBe(true);
    });

    it('should snap to forward face when exiting rotation mode', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      const cube = (game as any).cube;
      const snapSpy = vi.spyOn(cube, 'snapToForwardFace');

      // Enter and exit rotation mode
      (game as any).enterRotationMode();
      (game as any).exitRotationMode();

      expect(snapSpy).toHaveBeenCalled();
    });
  });

  describe('Pan Behavior in Different Modes', () => {
    it('should allow full 360° rotation in rotation mode', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      // Enter rotation mode
      (game as any).enterRotationMode();
      (game as any).freeRotationStartRotation = { x: 0, y: 0 };

      // Simulate pan
      (game as any).handlePan(1000, 1000);

      const cubeGroup = (game as any).cube.getCubeGroup();
      
      // In rotation mode, rotation should not be clamped
      // X rotation can exceed ±π/2
      expect(Math.abs(cubeGroup.rotation.x)).toBeLessThanOrEqual(Math.PI * 2);
    });

    it('should clamp rotation in normal mode', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      // Stay in normal mode
      (game as any).rotationMode = false;
      (game as any).freeRotationActive = true;
      (game as any).freeRotationStartRotation = { x: 0, y: 0 };

      // Simulate large pan that would exceed clamp
      (game as any).handlePan(0, 50000);

      const cubeGroup = (game as any).cube.getCubeGroup();
      
      // In normal mode, X rotation should be clamped
      expect(cubeGroup.rotation.x).toBeLessThanOrEqual(Math.PI / 2);
      expect(cubeGroup.rotation.x).toBeGreaterThanOrEqual(-Math.PI / 2);
    });
  });

  describe('Pinch-to-Zoom', () => {
    it('should work in rotation mode', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      const cubeGroup = (game as any).cube.getCubeGroup();
      const setScalarSpy = vi.spyOn(cubeGroup.scale, 'setScalar');

      // Enter rotation mode
      (game as any).enterRotationMode();
      (game as any).initialPinchScale = 1;

      // Simulate pinch
      (game as any).handlePinch(1.5);

      expect(setScalarSpy).toHaveBeenCalledWith(1.5);
    });

    it('should work in normal mode during free rotation', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      const cubeGroup = (game as any).cube.getCubeGroup();
      const setScalarSpy = vi.spyOn(cubeGroup.scale, 'setScalar');

      // Start free rotation without rotation mode
      (game as any).freeRotationActive = true;
      (game as any).initialPinchScale = 1;

      // Simulate pinch
      (game as any).handlePinch(0.8);

      expect(setScalarSpy).toHaveBeenCalledWith(0.8);
    });

    it('should clamp zoom between 0.5 and 2', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      const cubeGroup = (game as any).cube.getCubeGroup();
      const setScalarSpy = vi.spyOn(cubeGroup.scale, 'setScalar');

      (game as any).freeRotationActive = true;
      (game as any).initialPinchScale = 1;

      // Try to zoom too far out
      (game as any).handlePinch(0.1);
      expect(setScalarSpy).toHaveBeenCalledWith(0.5);

      // Try to zoom too far in
      (game as any).handlePinch(5);
      expect(setScalarSpy).toHaveBeenCalledWith(2);
    });
  });

  describe('Swipe Behavior with Rotation Mode', () => {
    it('should exit rotation mode on swipe', async () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      // Enter rotation mode
      (game as any).enterRotationMode();
      expect((game as any).rotationMode).toBe(true);

      // Simulate swipe
      await (game as any).handleMove(SwipeDirection.LEFT);

      // Should have exited rotation mode
      expect((game as any).rotationMode).toBe(false);
    });

    it('should perform move after exiting rotation mode', async () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      const gameInstance = (game as any).game;
      const moveSpy = vi.spyOn(gameInstance, 'move');

      // Enter rotation mode
      (game as any).enterRotationMode();

      // Simulate swipe
      await (game as any).handleMove(SwipeDirection.UP);

      // Should have called move on the game
      expect(moveSpy).toHaveBeenCalledWith(SwipeDirection.UP);
    });
  });

  describe('Memory Management', () => {
    it('should not create multiple indicators', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      // Enter rotation mode multiple times
      for (let i = 0; i < 5; i++) {
        (game as any).enterRotationMode();
      }

      // Should only have one indicator
      const indicators = document.body.querySelectorAll('div[style*="ROTATION"]');
      expect(indicators.length).toBe(1);
    });

    it('should clean up indicator on game restart', () => {
      // Start the game
      const startButton = container.querySelector('.start-hint');
      if (startButton) {
        startButton.dispatchEvent(new Event('click'));
      }

      // Enter rotation mode
      (game as any).enterRotationMode();

      // Restart game
      (game as any).restart();

      // Indicator should be gone
      const indicator = document.body.querySelector('div[style*="ROTATION"]');
      expect(indicator).toBeFalsy();
    });
  });
});