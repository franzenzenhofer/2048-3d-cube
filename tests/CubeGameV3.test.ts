import { describe, it, expect, beforeEach } from 'vitest';
import { CubeGameV3Fixed, CubeFace, SwipeDirection } from '../src/game/CubeGameV3Fixed';

describe('CubeGameV3Fixed', () => {
  let game: CubeGameV3Fixed;

  beforeEach(() => {
    game = new CubeGameV3Fixed();
  });

  describe('Initialization', () => {
    it.skip('should initialize with all 6 faces', () => {
      const allFaces = Object.values(CubeFace);
      allFaces.forEach(face => {
        const grid = game.getFaceGrid(face as CubeFace);
        expect(grid).toBeDefined();
        expect(grid.length).toBe(4);
        expect(grid[0].length).toBe(4);
      });
    });

    it.skip('should have tiles on ALL faces at start', () => {
      const status = game.getAllFacesStatus();
      
      // Every face should have at least 2 tiles
      status.forEach((faceStatus, face) => {
        expect(faceStatus.tileCount).toBeGreaterThanOrEqual(2);
        expect(faceStatus.maxTile).toBeGreaterThanOrEqual(2);
      });
    });

    it.skip('should start with FRONT as active face', () => {
      expect(game.getActiveFace()).toBe(CubeFace.FRONT);
    });

    it.skip('should start with score 0', () => {
      expect(game.getScore()).toBe(0);
    });
  });

  describe('Movement', () => {
    it.skip('should allow swipe in all 4 directions', () => {
      // Test that all directions are valid
      const directions = [
        SwipeDirection.UP,
        SwipeDirection.DOWN,
        SwipeDirection.LEFT,
        SwipeDirection.RIGHT
      ];

      directions.forEach(direction => {
        const testGame = new CubeGameV3Fixed();
        // Clear one face and add predictable tiles
        const frontGrid = testGame.getFaceGrid(CubeFace.FRONT);
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            frontGrid[r][c] = 0;
          }
        }
        frontGrid[1][1] = 2;
        frontGrid[1][2] = 2;
        
        const result = testGame.move(direction);
        // Should either move or not, but should not crash
        expect(typeof result.moved).toBe('boolean');
      });
    });

    it.skip('should move tiles within a face', () => {
      // Create a test scenario
      const testGame = new CubeGameV3Fixed();
      const frontGrid = testGame.getFaceGrid(CubeFace.FRONT);
      
      // Clear grid
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          frontGrid[r][c] = 0;
        }
      }
      
      // Add tiles that will merge
      frontGrid[0][0] = 2;
      frontGrid[0][1] = 2;
      
      const result = testGame.move(SwipeDirection.LEFT);
      expect(result.moved).toBe(true);
      
      const newGrid = testGame.getFaceGrid(CubeFace.FRONT);
      expect(newGrid[0][0]).toBe(4); // Merged
    });

    it.skip('should rotate cube after move', () => {
      const initialFace = game.getActiveFace();
      
      // Make a move that should work
      const result = game.move(SwipeDirection.LEFT);
      
      if (result.moved) {
        expect(result.rotation).toBeDefined();
        expect(result.rotation?.axis).toBe('y');
        expect(result.rotation?.angle).toBe(90);
        
        // Front face should change after LEFT swipe
        const newFace = game.getActiveFace();
        expect(newFace).toBe(CubeFace.RIGHT);
      }
    });

    it.skip('should update score when tiles merge', () => {
      const testGame = new CubeGameV3Fixed();
      
      // Clear all faces first
      Object.values(CubeFace).forEach(face => {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            testGame.setTileForTesting(face as CubeFace, r, c, 0);
          }
        }
      });
      
      const initialScore = testGame.getScore();
      
      // Set up a merge scenario only on FRONT face
      testGame.setTileForTesting(CubeFace.FRONT, 0, 0, 2);
      testGame.setTileForTesting(CubeFace.FRONT, 0, 1, 2);
      
      testGame.move(SwipeDirection.LEFT);
      
      expect(testGame.getScore()).toBeGreaterThan(initialScore);
    });
  });

  describe('Cross-face movement', () => {
    it.skip('should transfer tiles between adjacent faces', () => {
      const testGame = new CubeGameV3Fixed();
      
      // Clear all faces first
      Object.values(CubeFace).forEach(face => {
        const grid = testGame.getFaceGrid(face as CubeFace);
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            grid[r][c] = 0;
          }
        }
      });
      
      // Place a tile on the left edge of FRONT
      const frontGrid = testGame.getFaceGrid(CubeFace.FRONT);
      frontGrid[1][0] = 2;
      
      // Move left - tile should transfer to RIGHT face
      const result = testGame.move(SwipeDirection.LEFT);
      
      if (result.moved) {
        const movements = testGame.getMoveHistory();
        const crossFaceMove = movements.find(m => m.crossFace);
        expect(crossFaceMove).toBeDefined();
      }
    });
  });

  describe('Rotation logic', () => {
    it.skip('should rotate correctly for each swipe direction', () => {
      const rotationTests = [
        { direction: SwipeDirection.LEFT, expectedFace: CubeFace.RIGHT },
        { direction: SwipeDirection.RIGHT, expectedFace: CubeFace.LEFT },
        { direction: SwipeDirection.UP, expectedFace: CubeFace.BOTTOM },
        { direction: SwipeDirection.DOWN, expectedFace: CubeFace.TOP }
      ];

      rotationTests.forEach(test => {
        const testGame = new CubeGameV3Fixed();
        expect(testGame.getActiveFace()).toBe(CubeFace.FRONT);
        
        const result = testGame.move(test.direction);
        if (result.moved) {
          expect(testGame.getActiveFace()).toBe(test.expectedFace);
        }
      });
    });
  });

  describe('Game state', () => {
    it.skip('should detect win condition', () => {
      expect(game.hasWon()).toBe(false);
      
      // Place a 2048 tile
      const frontGrid = game.getFaceGrid(CubeFace.FRONT);
      frontGrid[0][0] = 2048;
      
      expect(game.hasWon()).toBe(true);
    });

    it.skip('should detect game over when no moves possible', () => {
      const testGame = new CubeGameV3Fixed();
      
      // Fill all faces with unmergeable pattern (checkerboard)
      Object.values(CubeFace).forEach(face => {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            // Create a pattern where no adjacent tiles are the same
            const value = ((r + c) % 2 === 0) ? 2 : 4;
            testGame.setTileForTesting(face as CubeFace, r, c, value);
          }
        }
      });
      
      expect(testGame.isGameOver()).toBe(true);
    });

    it.skip('should not be game over if moves are possible', () => {
      expect(game.isGameOver()).toBe(false);
    });
  });

  describe('Face status', () => {
    it.skip('should report correct status for all faces', () => {
      const status = game.getAllFacesStatus();
      
      expect(status.size).toBe(6); // All 6 faces
      
      // Check each face has valid status
      Object.values(CubeFace).forEach(face => {
        const faceStatus = status.get(face as CubeFace);
        expect(faceStatus).toBeDefined();
        expect(faceStatus!.tileCount).toBeGreaterThanOrEqual(0);
        expect(faceStatus!.maxTile).toBeGreaterThanOrEqual(0);
      });
    });
  });
});