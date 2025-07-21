import { describe, it, expect } from 'vitest';
import { CubeGameV3Fixed, CubeFace } from '../src/game/CubeGameV3Fixed';
import { SwipeDirection } from '../src/game/CubeGame';

describe('2048 Core Rules', () => {
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
    // IMPORTANT: Clear faces AFTER construction to remove initial tiles
    Object.values(CubeFace).forEach(face => clearFace(face as CubeFace));
  });

  describe('Rule 1: Tile Movement', () => {
    it('should slide tiles as far as possible', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 3, 2);
      game.setTileForTesting(face, 0, 2, 0);
      game.setTileForTesting(face, 0, 1, 0);
      game.setTileForTesting(face, 0, 0, 0);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      
      const grid = result.gridStates.get(face)!;
      expect(grid[0][0]).toBe(2);
      expect(grid[0][1]).toBe(0);
      expect(grid[0][2]).toBe(0);
      expect(grid[0][3]).toBe(0);
    });

    it('should stop tiles at board edge', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 0, 2);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      
      const grid = result.gridStates.get(face)!;
      expect(grid[0][0]).toBe(2); // Stays at edge
    });

    it('should stop tiles when blocked by different value', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 0, 4);
      game.setTileForTesting(face, 0, 1, 2);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      
      const grid = result.gridStates.get(face)!;
      expect(grid[0][0]).toBe(4);
      expect(grid[0][1]).toBe(2);
    });
  });

  describe('Rule 2: Tile Merging', () => {
    it('should merge two identical tiles', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 2);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      
      const grid = result.gridStates.get(face)!;
      expect(grid[0][0]).toBe(4);
      expect(grid[0][1]).toBe(0);
    });

    it('should merge only once per move - case 1: [2,2,2,0]', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 2);
      game.setTileForTesting(face, 0, 2, 2);
      game.setTileForTesting(face, 0, 3, 0);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      
      const grid = result.gridStates.get(face)!;
      expect(grid[0][0]).toBe(4); // First two merge
      expect(grid[0][1]).toBe(2); // Third one slides
      expect(grid[0][2]).toBe(0);
      expect(grid[0][3]).toBe(0);
    });

    it('should merge only once per move - case 2: [2,2,2,2]', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 2);
      game.setTileForTesting(face, 0, 2, 2);
      game.setTileForTesting(face, 0, 3, 2);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      
      const grid = result.gridStates.get(face)!;
      expect(grid[0][0]).toBe(4); // First pair merges
      expect(grid[0][1]).toBe(4); // Second pair merges
      expect(grid[0][2]).toBe(0);
      expect(grid[0][3]).toBe(0);
    });

    it('should not merge already-merged tiles', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 2);
      game.setTileForTesting(face, 0, 2, 4);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      
      const grid = result.gridStates.get(face)!;
      expect(grid[0][0]).toBe(4); // 2+2=4
      expect(grid[0][1]).toBe(4); // Original 4 slides
      expect(grid[0][2]).toBe(0);
      // The merged 4 should NOT merge with the original 4
    });
  });

  describe('Rule 3: Movement Direction Priority', () => {
    it('should merge from movement direction - LEFT', () => {
      const face = CubeFace.FRONT;
      // Set up: [0,2,2,4]
      game.setTileForTesting(face, 0, 0, 0);
      game.setTileForTesting(face, 0, 1, 2);
      game.setTileForTesting(face, 0, 2, 2);
      game.setTileForTesting(face, 0, 3, 4);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      
      const grid = result.gridStates.get(face)!;
      expect(grid[0][0]).toBe(4); // 2+2
      expect(grid[0][1]).toBe(4); // Original 4
      expect(grid[0][2]).toBe(0);
      expect(grid[0][3]).toBe(0);
    });

    it('should merge from movement direction - RIGHT', () => {
      const face = CubeFace.FRONT;
      // Set up: [4,2,2,0]
      game.setTileForTesting(face, 0, 0, 4);
      game.setTileForTesting(face, 0, 1, 2);
      game.setTileForTesting(face, 0, 2, 2);
      game.setTileForTesting(face, 0, 3, 0);
      
      const result = game.moveWithoutSpawn(SwipeDirection.RIGHT);
      
      const grid = result.gridStates.get(face)!;
      expect(grid[0][0]).toBe(0);
      expect(grid[0][1]).toBe(0);
      expect(grid[0][2]).toBe(4); // Original 4
      expect(grid[0][3]).toBe(4); // 2+2
    });
  });

  describe('Rule 4: Complex Scenarios', () => {
    it('should handle [2,2,4,4] correctly when swiping left', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 2);
      game.setTileForTesting(face, 0, 2, 4);
      game.setTileForTesting(face, 0, 3, 4);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      
      const grid = result.gridStates.get(face)!;
      expect(grid[0][0]).toBe(4); // 2+2
      expect(grid[0][1]).toBe(8); // 4+4
      expect(grid[0][2]).toBe(0);
      expect(grid[0][3]).toBe(0);
    });

    it('should handle gaps correctly: [2,0,2,0]', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 0);
      game.setTileForTesting(face, 0, 2, 2);
      game.setTileForTesting(face, 0, 3, 0);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      
      const grid = result.gridStates.get(face)!;
      // Log actual grid state for debugging
      console.log('Grid after move:', grid[0]);
      expect(grid[0][0]).toBe(4); // Tiles slide together and merge
      expect(grid[0][1]).toBe(0);
      expect(grid[0][2]).toBe(0);
      expect(grid[0][3]).toBe(0);
    });

    it('should not allow movement when blocked: [2,4,2,4]', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 4);
      game.setTileForTesting(face, 0, 2, 2);
      game.setTileForTesting(face, 0, 3, 4);
      
      const result = game.moveWithoutSpawn(SwipeDirection.LEFT);
      
      const grid = result.gridStates.get(face)!;
      // Nothing should move
      expect(grid[0][0]).toBe(2);
      expect(grid[0][1]).toBe(4);
      expect(grid[0][2]).toBe(2);
      expect(grid[0][3]).toBe(4);
      expect(result.moved).toBe(false);
    });
  });

  describe('Rule 5: Valid Move Detection', () => {
    it('should detect when moves are possible', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 0);
      
      expect(game.canAnyFaceMove(SwipeDirection.LEFT)).toBe(false); // Can't move left
      expect(game.canAnyFaceMove(SwipeDirection.RIGHT)).toBe(true); // Can move right
    });

    it('should detect when merges are possible', () => {
      const face = CubeFace.FRONT;
      game.setTileForTesting(face, 0, 0, 2);
      game.setTileForTesting(face, 0, 1, 2);
      
      expect(game.canAnyFaceMove(SwipeDirection.LEFT)).toBe(true); // Can merge
    });
  });
});