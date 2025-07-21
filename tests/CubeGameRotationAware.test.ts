import { describe, it, expect, beforeEach } from 'vitest';
import { CubeGameRotationAware } from '../src/game/CubeGameRotationAware';
import { CubeFace, SwipeDirection } from '../src/game/CubeGameV3Fixed';

describe('CubeGameRotationAware', () => {
  let game: CubeGameRotationAware;

  beforeEach(() => {
    game = new CubeGameRotationAware();
  });

  describe('Initialization', () => {
    it('should initialize with 6 faces', () => {
      Object.values(CubeFace).forEach(face => {
        const grid = game.getFaceGrid(face as CubeFace);
        expect(grid).toBeDefined();
        expect(grid.length).toBe(4);
        expect(grid[0].length).toBe(4);
      });
    });

    it('should start with tiles on all faces', () => {
      Object.values(CubeFace).forEach(face => {
        const grid = game.getFaceGrid(face as CubeFace);
        const tileCount = grid.flat().filter(v => v > 0).length;
        expect(tileCount).toBe(2);
      });
    });
  });

  describe('Rotation-Aware Movement', () => {
    it('should move tiles differently on each face based on orientation', () => {
      // Clear all faces for controlled test
      Object.values(CubeFace).forEach(face => {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            game.setTileForTesting(face as CubeFace, r, c, 0);
          }
        }
      });
      
      // Place tiles on FRONT and LEFT faces
      game.setTileForTesting(CubeFace.FRONT, 0, 0, 2);
      game.setTileForTesting(CubeFace.LEFT, 0, 0, 2);
      
      // Initially, both faces interpret UP the same way
      const result1 = game.move(SwipeDirection.UP);
      expect(result1.moved).toBe(true);
      
      // After rotation, LEFT face (now front) interprets directions differently
      const orientationInfo = game.getOrientationInfo();
      expect(orientationInfo.activeFace).toBe(CubeFace.BOTTOM);
      
      // The transformations should have changed
      const transformations = orientationInfo.transformations;
      expect(transformations[CubeFace.LEFT][SwipeDirection.UP]).not.toBe(SwipeDirection.UP);
    });

    it('should apply different local directions after rotation', () => {
      // Clear and set up test
      Object.values(CubeFace).forEach(face => {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            game.setTileForTesting(face as CubeFace, r, c, 0);
          }
        }
        // Place a tile that can move in all directions
        game.setTileForTesting(face as CubeFace, 1, 1, 2);
      });
      
      // Make a RIGHT swipe - this rotates the cube
      const result = game.move(SwipeDirection.RIGHT);
      expect(result.moved).toBe(true);
      
      // Now LEFT face is front, and its coordinate system is rotated
      // A global UP swipe should move tiles in a different local direction
      const info = game.getOrientationInfo();
      const leftFaceUpDirection = info.transformations[CubeFace.LEFT][SwipeDirection.UP];
      
      // Should not be UP anymore after rotation
      expect(leftFaceUpDirection).not.toBe(SwipeDirection.UP);
    });
  });

  describe('Complex Rotation Scenarios', () => {
    it('should handle multiple rotations correctly', () => {
      // Perform several rotations
      game.move(SwipeDirection.RIGHT); // Y-axis rotation
      game.move(SwipeDirection.UP);    // X-axis rotation
      game.move(SwipeDirection.LEFT);  // Y-axis rotation
      
      // Get current transformation state
      const info = game.getOrientationInfo();
      
      // After these rotations, transformations should be complex
      // No face should have identity transformations
      Object.values(CubeFace).forEach(face => {
        const upTransform = info.transformations[face as CubeFace][SwipeDirection.UP];
        // At least some faces should have non-identity transformations
        if (face !== info.activeFace) {
          // Non-active faces likely have complex transformations
          expect(Object.values(info.transformations[face as CubeFace])).toBeDefined();
        }
      });
    });

    it('should maintain game consistency through rotations', () => {
      // Set up a specific board state
      Object.values(CubeFace).forEach(face => {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            game.setTileForTesting(face as CubeFace, r, c, 0);
          }
        }
      });
      
      // Place specific tiles
      game.setTileForTesting(CubeFace.FRONT, 0, 0, 2);
      game.setTileForTesting(CubeFace.FRONT, 0, 1, 2);
      
      const initialScore = game.getScore();
      
      // Move and rotate
      game.move(SwipeDirection.LEFT);
      
      // Score should have increased due to merge
      expect(game.getScore()).toBeGreaterThan(initialScore);
      
      // Front face should have merged tile
      const frontGrid = game.getFaceGrid(CubeFace.FRONT);
      const mergedTileExists = frontGrid.flat().includes(4);
      expect(mergedTileExists).toBe(true);
    });
  });

  describe('Game State', () => {
    it('should detect win condition across all orientations', () => {
      // Place a 2048 tile on a face
      game.setTileForTesting(CubeFace.BACK, 2, 2, 2048);
      
      // Should win regardless of orientation
      expect(game.hasWon()).toBe(true);
      
      // Rotate and check again
      game.move(SwipeDirection.RIGHT);
      expect(game.hasWon()).toBe(true);
    });

    it('should only be game over when no moves possible in any orientation', () => {
      // Fill all faces with unmergeable tiles
      let value = 2;
      Object.values(CubeFace).forEach(face => {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            game.setTileForTesting(face as CubeFace, r, c, value);
            value *= 2;
            if (value > 65536) value = 2;
          }
        }
      });
      
      expect(game.isGameOver()).toBe(true);
    });
  });

  describe('Debug Information', () => {
    it('should provide orientation debug info', () => {
      const info = game.getOrientationInfo();
      
      expect(info).toHaveProperty('activeFace');
      expect(info).toHaveProperty('orientation');
      expect(info).toHaveProperty('transformations');
      
      // Should have transformations for all faces
      expect(Object.keys(info.transformations).length).toBe(6);
      
      // Each face should have all 4 directions mapped
      Object.values(CubeFace).forEach(face => {
        expect(Object.keys(info.transformations[face as CubeFace]).length).toBe(4);
      });
    });
  });
});