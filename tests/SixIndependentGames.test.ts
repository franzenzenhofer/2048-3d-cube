import { describe, it, expect, beforeEach } from 'vitest';
import { CubeGameV3Fixed, CubeFace, SwipeDirection } from '../src/game/CubeGameV3Fixed';

describe('Six Independent Games', () => {
  let game: CubeGameV3Fixed;

  beforeEach(() => {
    game = new CubeGameV3Fixed();
  });

  it('should play 6 independent 2048 games simultaneously', () => {
    // Each face should have its own independent grid
    const faces = Object.values(CubeFace);
    expect(faces.length).toBe(6);
    
    // Each face should start with 2 tiles
    faces.forEach(face => {
      const grid = game.getFaceGrid(face as CubeFace);
      const tileCount = grid.flat().filter(v => v > 0).length;
      expect(tileCount).toBe(2);
    });
  });

  it('should move tiles on ALL faces with the same swipe direction', () => {
    // Clear all faces for controlled test
    Object.values(CubeFace).forEach(face => {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(face as CubeFace, r, c, 0);
        }
      }
      // Place two tiles that will move right
      game.setTileForTesting(face as CubeFace, 0, 0, 2);
      game.setTileForTesting(face as CubeFace, 0, 1, 4);
    });
    
    // Swipe right
    const result = game.move(SwipeDirection.RIGHT);
    expect(result.moved).toBe(true);
    
    // Check that ALL faces moved their tiles right and spawned new ones
    Object.values(CubeFace).forEach(face => {
      const grid = game.getFaceGrid(face as CubeFace);
      // Check that row 0 has tiles (moved + spawned)
      const rowTiles = grid[0].filter(v => v > 0);
      expect(rowTiles.length).toBeGreaterThanOrEqual(2); // At least 2 tiles
      expect(rowTiles.length).toBeLessThanOrEqual(3); // At most 3 tiles (2 moved + 1 spawned)
      
      // The rightmost positions should have the moved tiles
      const rightTiles = [grid[0][2], grid[0][3]].filter(v => v > 0);
      expect(rightTiles.length).toBeGreaterThanOrEqual(2); // Both tiles moved right
    });
  });

  it('should spawn new tiles on ALL faces after a move', () => {
    // Clear and setup controlled state
    Object.values(CubeFace).forEach(face => {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(face as CubeFace, r, c, 0);
        }
      }
      // Just two tiles that can move
      game.setTileForTesting(face as CubeFace, 0, 0, 2);
      game.setTileForTesting(face as CubeFace, 0, 1, 2);
    });
    
    const result = game.move(SwipeDirection.LEFT);
    expect(result.moved).toBe(true);
    
    // Each face should now have exactly 2 tiles (merged + spawned)
    Object.values(CubeFace).forEach(face => {
      const grid = game.getFaceGrid(face as CubeFace);
      const tileCount = grid.flat().filter(v => v > 0).length;
      expect(tileCount).toBe(2); // One merged (4) + one spawned (2 or 4)
    });
  });

  it('should maintain independent game states for each face', () => {
    // Set up different patterns on each face
    game.setTileForTesting(CubeFace.FRONT, 0, 0, 2);
    game.setTileForTesting(CubeFace.FRONT, 0, 1, 2);
    
    game.setTileForTesting(CubeFace.BACK, 1, 0, 4);
    game.setTileForTesting(CubeFace.BACK, 1, 1, 4);
    
    game.setTileForTesting(CubeFace.LEFT, 2, 0, 8);
    game.setTileForTesting(CubeFace.LEFT, 2, 1, 8);
    
    // Move left - all faces should merge their tiles
    const result = game.move(SwipeDirection.LEFT);
    
    // Check merged values are correct for each face
    expect(game.getFaceGrid(CubeFace.FRONT)[0][0]).toBe(4);
    expect(game.getFaceGrid(CubeFace.BACK)[1][0]).toBe(8);
    expect(game.getFaceGrid(CubeFace.LEFT)[2][0]).toBe(16);
  });

  it('should have a combined score from all 6 games', () => {
    // Clear all faces
    Object.values(CubeFace).forEach(face => {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(face as CubeFace, r, c, 0);
        }
      }
    });
    
    // Set up mergeable tiles on each face
    Object.values(CubeFace).forEach(face => {
      game.setTileForTesting(face as CubeFace, 0, 0, 2);
      game.setTileForTesting(face as CubeFace, 0, 1, 2);
    });
    
    const initialScore = game.getScore();
    game.move(SwipeDirection.LEFT);
    
    // Score should increase by 4 points per face (6 faces * 4 = 24)
    expect(game.getScore()).toBe(initialScore + 24);
  });

  it('should only end when ALL 6 games are over', () => {
    // Fill 5 faces completely with unmergeable tiles
    const faces = Object.values(CubeFace);
    for (let i = 0; i < 5; i++) {
      let value = 2;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          game.setTileForTesting(faces[i] as CubeFace, r, c, value);
          value *= 2;
        }
      }
    }
    
    // Game should NOT be over - one face still has moves
    expect(game.isGameOver()).toBe(false);
    
    // Fill the last face
    let value = 2;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        game.setTileForTesting(faces[5] as CubeFace, r, c, value);
        value *= 2;
      }
    }
    
    // NOW the game should be over
    expect(game.isGameOver()).toBe(true);
  });

  it('should win if ANY face reaches 2048', () => {
    // Place 2048 on just one face
    game.setTileForTesting(CubeFace.TOP, 2, 2, 2048);
    
    // Should win even though other faces don't have 2048
    expect(game.hasWon()).toBe(true);
  });
});