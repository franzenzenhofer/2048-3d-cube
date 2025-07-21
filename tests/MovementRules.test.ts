import { describe, it, expect, beforeEach } from 'vitest';
import { CubeGameV3Fixed, CubeFace, SwipeDirection } from '../src/game/CubeGameV3Fixed';

describe('2048 Movement and Merging Rules', () => {
  let game: CubeGameV3Fixed;
  
  beforeEach(() => {
    game = new CubeGameV3Fixed();
  });
  
  describe('Basic movement rules', () => {
    it('should slide tiles to the edge when moving', () => {
      // Clear front face for testing
      const face = CubeFace.FRONT;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(face, r, c, 0);
        }
      }
      
      // Place tiles with gaps
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 2, 4);
      game.setTileForTesting(face, 0, 3, 8);
      
      game.move(SwipeDirection.LEFT);
      
      const grid = game.getFaceGrid(face);
      // Tiles should slide to the left edge
      expect(grid[0][0]).toBe(2);
      expect(grid[0][1]).toBe(4);
      expect(grid[0][2]).toBe(8);
      expect(grid[0][3]).toBe(0);
    });
    
    it('should not move tiles if they cannot move', () => {
      const face = CubeFace.FRONT;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(face, r, c, 0);
        }
      }
      
      // Tiles already at left edge
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 4);
      
      const gridBefore = JSON.parse(JSON.stringify(game.getFaceGrid(face)));
      const result = game.move(SwipeDirection.LEFT);
      const gridAfter = game.getFaceGrid(face);
      
      // No movement should occur
      expect(gridAfter[0][0]).toBe(2);
      expect(gridAfter[0][1]).toBe(4);
    });
  });
  
  describe('Merging rules', () => {
    it('should merge two identical adjacent tiles', () => {
      const face = CubeFace.FRONT;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(face, r, c, 0);
        }
      }
      
      // Two 2s should merge into 4
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 2);
      
      const scoreBefore = game.getScore();
      game.move(SwipeDirection.LEFT);
      
      const grid = game.getFaceGrid(face);
      expect(grid[0][0]).toBe(4);
      expect(grid[0][1]).toBe(0);
      
      // Score should increase by merge value
      expect(game.getScore()).toBe(scoreBefore + 4);
    });
    
    it('should not merge a tile twice in the same move', () => {
      const face = CubeFace.FRONT;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(face, r, c, 0);
        }
      }
      
      // Three 2s in a row
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 2);
      game.setTileForTesting(face, 0, 2, 2);
      
      game.move(SwipeDirection.LEFT);
      
      const grid = game.getFaceGrid(face);
      // Should merge first two 2s into 4, third 2 slides
      expect(grid[0][0]).toBe(4);
      expect(grid[0][1]).toBe(2);
      expect(grid[0][2]).toBe(0);
    });
    
    it('should handle four identical tiles correctly', () => {
      const face = CubeFace.FRONT;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(face, r, c, 0);
        }
      }
      
      // Four 2s in a row
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 2);
      game.setTileForTesting(face, 0, 2, 2);
      game.setTileForTesting(face, 0, 3, 2);
      
      game.move(SwipeDirection.LEFT);
      
      const grid = game.getFaceGrid(face);
      // Should merge into two 4s
      expect(grid[0][0]).toBe(4);
      expect(grid[0][1]).toBe(4);
      expect(grid[0][2]).toBe(0);
      expect(grid[0][3]).toBe(0);
    });
    
    it('should merge from farthest position when moving', () => {
      const face = CubeFace.FRONT;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(face, r, c, 0);
        }
      }
      
      // Gap between identical tiles
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 3, 2);
      
      game.move(SwipeDirection.LEFT);
      
      const grid = game.getFaceGrid(face);
      // Should merge at leftmost position
      expect(grid[0][0]).toBe(4);
      expect(grid[0][1]).toBe(0);
      expect(grid[0][2]).toBe(0);
      expect(grid[0][3]).toBe(0);
    });
  });
  
  describe('Complex movement scenarios', () => {
    it('should handle mixed tiles and merges correctly', () => {
      const face = CubeFace.FRONT;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(face, r, c, 0);
        }
      }
      
      // Complex scenario: 2, 2, 4, 8
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 2);
      game.setTileForTesting(face, 0, 2, 4);
      game.setTileForTesting(face, 0, 3, 8);
      
      game.move(SwipeDirection.LEFT);
      
      const grid = game.getFaceGrid(face);
      // 2+2=4, then 4,4,8 slide left
      expect(grid[0][0]).toBe(4);
      expect(grid[0][1]).toBe(4);
      expect(grid[0][2]).toBe(8);
      expect(grid[0][3]).toBe(0);
    });
    
    it('should handle vertical movements correctly', () => {
      const face = CubeFace.FRONT;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(face, r, c, 0);
        }
      }
      
      // Vertical column with mergeable tiles
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 1, 0, 2);
      game.setTileForTesting(face, 3, 0, 4);
      
      game.move(SwipeDirection.UP);
      
      const grid = game.getFaceGrid(face);
      // Should merge 2s at top, 4 slides up
      expect(grid[0][0]).toBe(4);
      expect(grid[1][0]).toBe(4);
      expect(grid[2][0]).toBe(0);
      expect(grid[3][0]).toBe(0);
    });
  });
  
  describe('Score calculation', () => {
    it('should add merged tile value to score', () => {
      const face = CubeFace.FRONT;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(face, r, c, 0);
        }
      }
      
      // Multiple merges
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 2);
      game.setTileForTesting(face, 1, 0, 4);
      game.setTileForTesting(face, 1, 1, 4);
      
      const scoreBefore = game.getScore();
      game.move(SwipeDirection.LEFT);
      
      // Should get 4 points from 2+2 and 8 points from 4+4
      expect(game.getScore()).toBe(scoreBefore + 4 + 8);
    });
  });
  
  describe('Game state validation', () => {
    it('should detect when no moves are possible', () => {
      // Fill board with alternating values
      const face = CubeFace.FRONT;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          // Checkerboard pattern with different values
          const value = ((r + c) % 2 === 0) ? 2 : 4;
          game.setTileForTesting(face, r, c, value * (r + 1) * (c + 1));
        }
      }
      
      // Verify no moves are possible
      const canMove = game.canAnyFaceMove(SwipeDirection.LEFT) ||
                     game.canAnyFaceMove(SwipeDirection.RIGHT) ||
                     game.canAnyFaceMove(SwipeDirection.UP) ||
                     game.canAnyFaceMove(SwipeDirection.DOWN);
      
      expect(canMove).toBe(false);
    });
    
    it('should detect win condition (2048 tile)', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 0, 2048);
      
      expect(game.hasWon()).toBe(true);
    });
  });
});