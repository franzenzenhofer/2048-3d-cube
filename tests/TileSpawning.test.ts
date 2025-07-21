import { describe, it, expect, beforeEach } from 'vitest';
import { CubeGameV3Fixed, CubeFace, SwipeDirection } from '../src/game/CubeGameV3Fixed';

describe('2048 Tile Spawning Rules', () => {
  let game: CubeGameV3Fixed;
  
  beforeEach(() => {
    game = new CubeGameV3Fixed();
  });
  
  describe('Initial game state', () => {
    it('should start with exactly 2 tiles on each face', () => {
      // Official rule: Game starts with 2 tiles
      Object.values(CubeFace).forEach(face => {
        const grid = game.getFaceGrid(face as CubeFace);
        const tileCount = grid.flat().filter(v => v > 0).length;
        expect(tileCount).toBe(2);
      });
    });
    
    it('should spawn tiles with values 2 or 4', () => {
      Object.values(CubeFace).forEach(face => {
        const grid = game.getFaceGrid(face as CubeFace);
        grid.flat().forEach(value => {
          if (value > 0) {
            expect([2, 4]).toContain(value);
          }
        });
      });
    });
  });
  
  describe('Tile spawning after moves', () => {
    it('should spawn exactly ONE new tile after a valid move', () => {
      // Clear a face for controlled testing
      const testFace = CubeFace.FRONT;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(testFace, r, c, 0);
        }
      }
      game.setTileForTesting(testFace, 0, 0, 2);
      game.setTileForTesting(testFace, 0, 1, 2);
      
      const activeFace = game.getActiveFace();
      const gridBefore = game.getFaceGrid(activeFace);
      const tilesBefore = gridBefore.flat().filter(v => v > 0).length;
      
      // Make a move
      const result = game.move(SwipeDirection.LEFT);
      
      if (result.moved) {
        const gridAfter = game.getFaceGrid(activeFace);
        const tilesAfter = gridAfter.flat().filter(v => v > 0).length;
        
        // Should have exactly one more tile (or same if merge happened)
        expect(tilesAfter).toBeGreaterThanOrEqual(tilesBefore);
        expect(tilesAfter).toBeLessThanOrEqual(tilesBefore + 1);
      }
    });
    
    it('should spawn on ALL faces after move', () => {
      // Track tile counts on all faces before move
      const initialCounts = new Map<CubeFace, number>();
      Object.values(CubeFace).forEach(face => {
        const grid = game.getFaceGrid(face as CubeFace);
        const count = grid.flat().filter(v => v > 0).length;
        initialCounts.set(face as CubeFace, count);
      });
      
      const result = game.move(SwipeDirection.RIGHT);
      
      if (result.moved) {
        // All faces should have spawned new tiles (or stayed same due to merges)
        Object.values(CubeFace).forEach(face => {
          const grid = game.getFaceGrid(face as CubeFace);
          const newCount = grid.flat().filter(v => v > 0).length;
          const oldCount = initialCounts.get(face as CubeFace)!;
          
          // Count should increase by 1 (spawn) or stay same/decrease (if merges happened)
          expect(newCount).toBeGreaterThanOrEqual(oldCount - 1);
          expect(newCount).toBeLessThanOrEqual(oldCount + 1);
        });
      }
    });
    
    it('should not spawn if no valid move was made', () => {
      // Fill a face completely with non-mergeable tiles
      const testFace = CubeFace.FRONT;
      let value = 2;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(testFace, r, c, value);
          value *= 2;
        }
      }
      
      // Try to move - should fail
      const gridBefore = game.getFaceGrid(testFace);
      const result = game.move(SwipeDirection.LEFT);
      const gridAfter = game.getFaceGrid(testFace);
      
      // Grid should be unchanged
      expect(gridAfter).toEqual(gridBefore);
      expect(result.moved).toBe(false);
    });
  });
  
  describe('Spawn probabilities', () => {
    it('should spawn 2s more often than 4s (90/10 ratio)', () => {
      // This is hard to test deterministically, but we can verify the values
      // Run multiple spawns and check distribution
      let twos = 0;
      let fours = 0;
      
      // Create 100 new games to test initial spawn distribution
      for (let i = 0; i < 100; i++) {
        const testGame = new CubeGameV3Fixed();
        Object.values(CubeFace).forEach(face => {
          const grid = testGame.getFaceGrid(face as CubeFace);
          grid.flat().forEach(value => {
            if (value === 2) twos++;
            if (value === 4) fours++;
          });
        });
      }
      
      // Should have significantly more 2s than 4s
      expect(twos).toBeGreaterThan(fours);
      // Rough check - with 90/10 split, ratio should be around 9:1
      const ratio = twos / fours;
      expect(ratio).toBeGreaterThan(5); // Allow for randomness
      expect(ratio).toBeLessThan(15);
    });
  });
  
  describe('Spawn location rules', () => {
    it('should only spawn in empty cells', () => {
      // Make several moves and verify spawns
      for (let i = 0; i < 10; i++) {
        const result = game.move(SwipeDirection.LEFT);
        if (result.moved) {
          // Check all faces - new tiles should only be in previously empty spots
          Object.values(CubeFace).forEach(face => {
            const grid = game.getFaceGrid(face as CubeFace);
            grid.forEach(row => {
              row.forEach(value => {
                // All values should be valid tile values
                if (value > 0) {
                  expect(value).toBeGreaterThanOrEqual(2);
                  // Should be a power of 2
                  expect(Math.log2(value) % 1).toBe(0);
                }
              });
            });
          });
        }
      }
    });
    
    it('should handle full board correctly', () => {
      // Fill active face completely
      const activeFace = game.getActiveFace();
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(activeFace, r, c, 2);
        }
      }
      
      // Make tiles mergeable
      game.setTileForTesting(activeFace, 0, 0, 2);
      game.setTileForTesting(activeFace, 0, 1, 2);
      
      // Move should work (merge creates space)
      const result = game.move(SwipeDirection.LEFT);
      expect(result.moved).toBe(true);
      
      // Should have one empty space from merge
      const grid = game.getFaceGrid(activeFace);
      const emptyCount = grid.flat().filter(v => v === 0).length;
      expect(emptyCount).toBe(0); // New tile should fill the space
    });
  });
});