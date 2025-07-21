import { describe, it, expect, beforeEach } from 'vitest';
import { CubeGameV3Fixed, CubeFace } from '../src/game/CubeGameV3Fixed';
import { SwipeDirection } from '../src/game/CubeGame';

describe('Tile Sliding Rules - No Jumping Over Other Tiles', () => {
  let game: CubeGameV3Fixed;

  const clearFace = (face: CubeFace) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        game.setTileForTesting(face, r, c, 0);
      }
    }
  };

  beforeEach(() => {
    game = new CubeGameV3Fixed();
    // Clear all faces for controlled testing
    Object.values(CubeFace).forEach(face => clearFace(face as CubeFace));
  });

  describe('Tiles cannot jump over other tiles', () => {
    it('should NOT allow tile to jump over a different number when sliding left', () => {
      const face = CubeFace.FRONT;
      // Setup: [0, 2, 4, 8]
      game.setTileForTesting(face, 0, 0, 0);
      game.setTileForTesting(face, 0, 1, 2);
      game.setTileForTesting(face, 0, 2, 4);
      game.setTileForTesting(face, 0, 3, 8);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      const grid = result.gridStates.get(face)!;
      
      // Should be: [2, 4, 8, 0] - tiles slide but don't jump
      expect(grid[0][0]).toBe(2);
      expect(grid[0][1]).toBe(4);
      expect(grid[0][2]).toBe(8);
      expect(grid[0][3]).toBe(0);
    });

    it('should NOT allow tile to jump over a different number when sliding right', () => {
      const face = CubeFace.FRONT;
      // Setup: [8, 4, 2, 0]
      game.setTileForTesting(face, 0, 0, 8);
      game.setTileForTesting(face, 0, 1, 4);
      game.setTileForTesting(face, 0, 2, 2);
      game.setTileForTesting(face, 0, 3, 0);
      
      const result = game.moveWithoutSpawn(SwipeDirection.RIGHT);
      const grid = result.gridStates.get(face)!;
      
      // Should be: [0, 8, 4, 2] - tiles slide but don't jump
      expect(grid[0][0]).toBe(0);
      expect(grid[0][1]).toBe(8);
      expect(grid[0][2]).toBe(4);
      expect(grid[0][3]).toBe(2);
    });

    it('should NOT allow tile to jump when blocked by different value', () => {
      const face = CubeFace.FRONT;
      // Setup: [2, 0, 4, 2]
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 0);
      game.setTileForTesting(face, 0, 2, 4);
      game.setTileForTesting(face, 0, 3, 2);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      const grid = result.gridStates.get(face)!;
      
      // Should be: [2, 4, 2, 0] - the rightmost 2 CANNOT jump over 4
      expect(grid[0][0]).toBe(2);
      expect(grid[0][1]).toBe(4);
      expect(grid[0][2]).toBe(2);
      expect(grid[0][3]).toBe(0);
    });

    it('should stop at the first obstacle when moving up', () => {
      const face = CubeFace.FRONT;
      // Setup column 0: [0, 2, 4, 8] (top to bottom)
      game.setTileForTesting(face, 0, 0, 0);
      game.setTileForTesting(face, 1, 0, 2);
      game.setTileForTesting(face, 2, 0, 4);
      game.setTileForTesting(face, 3, 0, 8);
      
      const result = game.moveWithoutSpawn(SwipeDirection.UP);
      const grid = result.gridStates.get(face)!;
      
      // Should be: [2, 4, 8, 0] - no jumping
      expect(grid[0][0]).toBe(2);
      expect(grid[1][0]).toBe(4);
      expect(grid[2][0]).toBe(8);
      expect(grid[3][0]).toBe(0);
    });
  });

  describe('Tiles can slide through empty spaces', () => {
    it('should slide through multiple empty spaces', () => {
      const face = CubeFace.FRONT;
      // Setup: [2, 0, 0, 0]
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 0);
      game.setTileForTesting(face, 0, 2, 0);
      game.setTileForTesting(face, 0, 3, 0);
      
      const result = game.moveWithoutSpawn(SwipeDirection.RIGHT);
      const grid = result.gridStates.get(face)!;
      
      // Should be: [0, 0, 0, 2] - slides all the way
      expect(grid[0][0]).toBe(0);
      expect(grid[0][1]).toBe(0);
      expect(grid[0][2]).toBe(0);
      expect(grid[0][3]).toBe(2);
    });

    it('should slide until hitting an obstacle', () => {
      const face = CubeFace.FRONT;
      // Setup: [2, 0, 0, 4]
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 0);
      game.setTileForTesting(face, 0, 2, 0);
      game.setTileForTesting(face, 0, 3, 4);
      
      const result = game.moveWithoutSpawn(SwipeDirection.RIGHT);
      const grid = result.gridStates.get(face)!;
      
      // Should be: [0, 0, 2, 4] - 2 slides right but stops before 4
      expect(grid[0][0]).toBe(0);
      expect(grid[0][1]).toBe(0);
      expect(grid[0][2]).toBe(2);
      expect(grid[0][3]).toBe(4);
    });
  });

  describe('Merging follows sliding rules', () => {
    it('should merge when sliding into same value', () => {
      const face = CubeFace.FRONT;
      // Setup: [2, 0, 0, 2]
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 0);
      game.setTileForTesting(face, 0, 2, 0);
      game.setTileForTesting(face, 0, 3, 2);
      
      const result = game.moveWithoutSpawn(SwipeDirection.RIGHT);
      const grid = result.gridStates.get(face)!;
      
      // Should be: [0, 0, 0, 4] - 2 slides right and merges
      expect(grid[0][0]).toBe(0);
      expect(grid[0][1]).toBe(0);
      expect(grid[0][2]).toBe(0);
      expect(grid[0][3]).toBe(4);
    });

    it('should NOT merge when blocked by different value', () => {
      const face = CubeFace.FRONT;
      // Setup: [2, 0, 4, 2]
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 0);
      game.setTileForTesting(face, 0, 2, 4);
      game.setTileForTesting(face, 0, 3, 2);
      
      const result = game.moveWithoutSpawn(SwipeDirection.RIGHT);
      const grid = result.gridStates.get(face)!;
      
      // Should be: [0, 2, 4, 2] - left 2 can't reach right 2
      expect(grid[0][0]).toBe(0);
      expect(grid[0][1]).toBe(2);
      expect(grid[0][2]).toBe(4);
      expect(grid[0][3]).toBe(2);
    });

    it('should handle complex sliding scenarios correctly', () => {
      const face = CubeFace.FRONT;
      // Setup: [4, 2, 0, 2]
      game.setTileForTesting(face, 0, 0, 4);
      game.setTileForTesting(face, 0, 1, 2);
      game.setTileForTesting(face, 0, 2, 0);
      game.setTileForTesting(face, 0, 3, 2);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      const grid = result.gridStates.get(face)!;
      
      // Should be: [4, 4, 0, 0] - the 2s merge after sliding
      expect(grid[0][0]).toBe(4);
      expect(grid[0][1]).toBe(4);
      expect(grid[0][2]).toBe(0);
      expect(grid[0][3]).toBe(0);
    });
  });

  describe('No movement when blocked', () => {
    it('should not move when all tiles are blocked', () => {
      const face = CubeFace.FRONT;
      // Setup: [2, 4, 8, 16] - all different
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 4);
      game.setTileForTesting(face, 0, 2, 8);
      game.setTileForTesting(face, 0, 3, 16);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      const grid = result.gridStates.get(face)!;
      
      // Should remain: [2, 4, 8, 16]
      expect(grid[0][0]).toBe(2);
      expect(grid[0][1]).toBe(4);
      expect(grid[0][2]).toBe(8);
      expect(grid[0][3]).toBe(16);
      expect(result.moved).toBe(false);
    });
  });
});