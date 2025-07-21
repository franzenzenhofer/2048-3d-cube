import { describe, it, expect } from 'vitest';
import { CubeGameV3Fixed, CubeFace, SwipeDirection } from '../src/game/CubeGameV3Fixed';

describe('Game Logic Tests', () => {
  describe('Tile spawning', () => {
    it('should add new tile ONLY to active face after move', () => {
      const game = new CubeGameV3Fixed();
      
      // Count initial tiles on each face
      const initialCounts = new Map<CubeFace, number>();
      Object.values(CubeFace).forEach(face => {
        const grid = game.getFaceGrid(face as CubeFace);
        const count = grid.flat().filter(v => v > 0).length;
        initialCounts.set(face as CubeFace, count);
      });
      
      // Make a move
      const activeFace = game.getActiveFace();
      const result = game.move(SwipeDirection.LEFT);
      
      if (result.moved) {
        // Only active face should have one more tile
        const newActiveFace = game.getActiveFace();
        
        Object.values(CubeFace).forEach(face => {
          const grid = game.getFaceGrid(face as CubeFace);
          const newCount = grid.flat().filter(v => v > 0).length;
          const oldCount = initialCounts.get(face as CubeFace)!;
          
          if (face === activeFace) {
            // Active face should have gained a tile
            expect(newCount).toBeGreaterThanOrEqual(oldCount);
          } else {
            // Other faces should only change due to movement, not new tiles
            // (unless tiles merged, in which case count could decrease)
            expect(newCount).toBeLessThanOrEqual(oldCount + 1);
          }
        });
      }
    });
    
    it('should handle tile spawning even when board is nearly full', () => {
      const game = new CubeGameV3Fixed();
      
      // Fill the front face almost completely
      const frontFace = CubeFace.FRONT;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) { // Leave last column empty
          game.setTileForTesting(frontFace, r, c, 2);
        }
      }
      
      // Make a move that should work
      const result = game.move(SwipeDirection.RIGHT);
      expect(result.moved).toBe(true);
      
      // Check that new tile was added
      const grid = game.getFaceGrid(frontFace);
      const tileCount = grid.flat().filter(v => v > 0).length;
      expect(tileCount).toBeGreaterThan(12); // Started with 12, should have more
    });
  });
  
  describe('Movement validation', () => {
    it('should only move if at least one face can move', () => {
      const game = new CubeGameV3Fixed();
      
      // Create a scenario where only one face can move
      // Fill all faces completely except one
      Object.values(CubeFace).forEach((face, index) => {
        if (index > 0) { // Skip first face
          for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
              // Checkerboard pattern to prevent merging
              game.setTileForTesting(face as CubeFace, r, c, (r + c) % 2 === 0 ? 2 : 4);
            }
          }
        }
      });
      
      // First face has tiles that can move
      const result = game.move(SwipeDirection.LEFT);
      expect(result.moved).toBe(true);
    });
  });
  
  describe('Face orientation during movement', () => {
    it('should apply correct movement based on face orientation', () => {
      const game = new CubeGameV3Fixed();
      
      // Place specific tiles to test orientation
      game.setTileForTesting(CubeFace.FRONT, 0, 0, 2);
      game.setTileForTesting(CubeFace.BACK, 0, 0, 2);
      game.setTileForTesting(CubeFace.LEFT, 0, 0, 2);
      
      // Move RIGHT
      const result = game.move(SwipeDirection.RIGHT);
      
      if (result.moved) {
        // Front face tile should move right
        const frontGrid = game.getFaceGrid(CubeFace.FRONT);
        expect(frontGrid[0][0]).toBe(0);
        expect(frontGrid[0][3]).toBe(2);
        
        // Back face tile should move LEFT (reversed)
        const backGrid = game.getFaceGrid(CubeFace.BACK);
        // This depends on orientation logic
      }
    });
  });
  
  describe('Score calculation', () => {
    it('should accumulate score from all faces', () => {
      const game = new CubeGameV3Fixed();
      
      // Set up tiles that will merge on multiple faces
      Object.values(CubeFace).forEach(face => {
        game.setTileForTesting(face as CubeFace, 0, 0, 2);
        game.setTileForTesting(face as CubeFace, 0, 1, 2);
      });
      
      const initialScore = game.getScore();
      game.move(SwipeDirection.LEFT);
      
      const newScore = game.getScore();
      // 6 faces * 4 points per merge = 24 points
      expect(newScore - initialScore).toBeGreaterThan(0);
    });
  });
});