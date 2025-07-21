import { describe, it, expect, beforeEach } from 'vitest';
import { CubeGame, CubeFace, SwipeDirection } from '../src/game/CubeGame';

describe('CubeGame', () => {
  let game: CubeGame;

  beforeEach(() => {
    game = new CubeGame();
  });

  describe('Initialization', () => {
    it('should start with 3 unlocked faces', () => {
      const unlockedFaces = game.getUnlockedFaces();
      expect(unlockedFaces).toHaveLength(3);
      expect(unlockedFaces).toContain(CubeFace.FRONT);
      expect(unlockedFaces).toContain(CubeFace.LEFT);
      expect(unlockedFaces).toContain(CubeFace.RIGHT);
    });

    it('should start with score 0', () => {
      expect(game.getScore()).toBe(0);
    });

    it('should have 2 initial tiles on unlocked faces', () => {
      let tileCount = 0;
      game.getUnlockedFaces().forEach(face => {
        const grid = game.getFaceGrid(face);
        tileCount += grid.flat().filter(val => val > 0).length;
      });
      expect(tileCount).toBe(2);
    });

    it('should create 6 faces total', () => {
      // Check all faces exist by getting their grids
      Object.values(CubeFace).forEach(face => {
        const grid = game.getFaceGrid(face as CubeFace);
        expect(grid).toBeDefined();
        expect(grid.length).toBe(4);
        expect(grid[0].length).toBe(4);
      });
    });
  });

  describe('Movement', () => {
    it('should move tiles within a face', () => {
      // Set up a simple scenario
      const frontGrid = game.getFaceGrid(CubeFace.FRONT);
      // Clear the grid first
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          frontGrid[r][c] = 0;
        }
      }
      // Add test tiles
      frontGrid[0][0] = 2;
      frontGrid[0][1] = 2;
      
      const moved = game.move(SwipeDirection.LEFT);
      expect(moved).toBe(true);
      
      const newGrid = game.getFaceGrid(CubeFace.FRONT);
      expect(newGrid[0][0]).toBe(4); // Merged
      expect(newGrid[0][1]).toBe(0); // Empty
    });

    it('should update score when tiles merge', () => {
      const initialScore = game.getScore();
      
      // Force a merge scenario
      const frontGrid = game.getFaceGrid(CubeFace.FRONT);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          frontGrid[r][c] = 0;
        }
      }
      frontGrid[0][0] = 2;
      frontGrid[0][1] = 2;
      
      game.move(SwipeDirection.LEFT);
      
      expect(game.getScore()).toBe(initialScore + 4);
    });

    it('should return false when no moves are possible in a direction', () => {
      // Fill a face completely to one side
      const frontGrid = game.getFaceGrid(CubeFace.FRONT);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          frontGrid[r][c] = 0;
        }
      }
      // Put different values on the left edge
      frontGrid[0][0] = 2;
      frontGrid[1][0] = 4;
      frontGrid[2][0] = 8;
      frontGrid[3][0] = 16;
      
      const moved = game.move(SwipeDirection.LEFT);
      expect(moved).toBe(false);
    });
  });

  describe('Face Unlocking', () => {
    it('should unlock TOP face at 512 points', () => {
      // Manually set score just below threshold
      (game as any).score = 500;
      expect(game.getUnlockedFaces()).not.toContain(CubeFace.TOP);
      
      // Trigger score increase
      (game as any).score = 512;
      (game as any).checkUnlocks();
      
      expect(game.getUnlockedFaces()).toContain(CubeFace.TOP);
    });

    it('should unlock BOTTOM face at 2048 points', () => {
      (game as any).score = 2048;
      (game as any).checkUnlocks();
      
      expect(game.getUnlockedFaces()).toContain(CubeFace.BOTTOM);
    });

    it('should unlock BACK face at 8192 points', () => {
      (game as any).score = 8192;
      (game as any).checkUnlocks();
      
      expect(game.getUnlockedFaces()).toContain(CubeFace.BACK);
    });
  });

  describe('Game State', () => {
    it('should detect win condition when 2048 is reached', () => {
      expect(game.hasWon()).toBe(false);
      
      // Place a 2048 tile
      const frontGrid = game.getFaceGrid(CubeFace.FRONT);
      frontGrid[0][0] = 2048;
      
      expect(game.hasWon()).toBe(true);
    });

    it('should detect game over when no moves possible', () => {
      // Fill all unlocked faces with unmergeable tiles
      game.getUnlockedFaces().forEach(face => {
        const grid = game.getFaceGrid(face);
        let value = 2;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            grid[r][c] = value;
            value = value === 2 ? 4 : 2;
          }
        }
      });
      
      expect(game.isGameOver()).toBe(true);
    });

    it('should not be game over if empty cells exist', () => {
      const frontGrid = game.getFaceGrid(CubeFace.FRONT);
      frontGrid[0][0] = 0; // Ensure at least one empty cell
      
      expect(game.isGameOver()).toBe(false);
    });
  });

  describe('View Angle Calculation', () => {
    it('should return default angle when no moves made', () => {
      const angle = game.getOptimalViewAngle();
      expect(angle).toEqual({ x: -25, y: 30 });
    });

    it('should adjust angle based on affected faces', () => {
      // Simulate movement history affecting TOP face
      (game as any).moveHistory = [
        { toFace: CubeFace.TOP, fromFace: CubeFace.FRONT }
      ];
      
      const angle = game.getOptimalViewAngle();
      expect(angle.x).toBe(-30);
      expect(angle.y).toBe(45);
    });
  });
});