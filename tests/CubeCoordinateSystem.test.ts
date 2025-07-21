import { describe, it, expect, beforeEach } from 'vitest';
import { CubeCoordinateSystem } from '../src/game/CubeCoordinateSystem';
import { CubeFace, SwipeDirection } from '../src/game/CubeGameV3Fixed';

describe('CubeCoordinateSystem', () => {
  let coordSystem: CubeCoordinateSystem;
  
  beforeEach(() => {
    coordSystem = new CubeCoordinateSystem();
  });
  
  describe('Direction mappings', () => {
    it('FRONT face should have identity mapping', () => {
      expect(coordSystem.getLocalDirection(CubeFace.FRONT, SwipeDirection.UP)).toBe(SwipeDirection.UP);
      expect(coordSystem.getLocalDirection(CubeFace.FRONT, SwipeDirection.DOWN)).toBe(SwipeDirection.DOWN);
      expect(coordSystem.getLocalDirection(CubeFace.FRONT, SwipeDirection.LEFT)).toBe(SwipeDirection.LEFT);
      expect(coordSystem.getLocalDirection(CubeFace.FRONT, SwipeDirection.RIGHT)).toBe(SwipeDirection.RIGHT);
    });
    
    it('BACK face should have reversed left/right', () => {
      expect(coordSystem.getLocalDirection(CubeFace.BACK, SwipeDirection.UP)).toBe(SwipeDirection.UP);
      expect(coordSystem.getLocalDirection(CubeFace.BACK, SwipeDirection.DOWN)).toBe(SwipeDirection.DOWN);
      expect(coordSystem.getLocalDirection(CubeFace.BACK, SwipeDirection.LEFT)).toBe(SwipeDirection.RIGHT);
      expect(coordSystem.getLocalDirection(CubeFace.BACK, SwipeDirection.RIGHT)).toBe(SwipeDirection.LEFT);
    });
    
    it('LEFT face should be rotated 90° clockwise', () => {
      expect(coordSystem.getLocalDirection(CubeFace.LEFT, SwipeDirection.UP)).toBe(SwipeDirection.RIGHT);
      expect(coordSystem.getLocalDirection(CubeFace.LEFT, SwipeDirection.DOWN)).toBe(SwipeDirection.LEFT);
      expect(coordSystem.getLocalDirection(CubeFace.LEFT, SwipeDirection.LEFT)).toBe(SwipeDirection.UP);
      expect(coordSystem.getLocalDirection(CubeFace.LEFT, SwipeDirection.RIGHT)).toBe(SwipeDirection.DOWN);
    });
    
    it('RIGHT face should be rotated 90° counter-clockwise', () => {
      expect(coordSystem.getLocalDirection(CubeFace.RIGHT, SwipeDirection.UP)).toBe(SwipeDirection.LEFT);
      expect(coordSystem.getLocalDirection(CubeFace.RIGHT, SwipeDirection.DOWN)).toBe(SwipeDirection.RIGHT);
      expect(coordSystem.getLocalDirection(CubeFace.RIGHT, SwipeDirection.LEFT)).toBe(SwipeDirection.DOWN);
      expect(coordSystem.getLocalDirection(CubeFace.RIGHT, SwipeDirection.RIGHT)).toBe(SwipeDirection.UP);
    });
    
    it('BOTTOM face should have inverted up/down', () => {
      expect(coordSystem.getLocalDirection(CubeFace.BOTTOM, SwipeDirection.UP)).toBe(SwipeDirection.DOWN);
      expect(coordSystem.getLocalDirection(CubeFace.BOTTOM, SwipeDirection.DOWN)).toBe(SwipeDirection.UP);
      expect(coordSystem.getLocalDirection(CubeFace.BOTTOM, SwipeDirection.LEFT)).toBe(SwipeDirection.LEFT);
      expect(coordSystem.getLocalDirection(CubeFace.BOTTOM, SwipeDirection.RIGHT)).toBe(SwipeDirection.RIGHT);
    });
  });
  
  describe('Movement detection', () => {
    it('should detect valid moves on FRONT face', () => {
      const grid = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      
      expect(coordSystem.canFaceMove(CubeFace.FRONT, grid, SwipeDirection.RIGHT)).toBe(true);
      expect(coordSystem.canFaceMove(CubeFace.FRONT, grid, SwipeDirection.DOWN)).toBe(true);
      expect(coordSystem.canFaceMove(CubeFace.FRONT, grid, SwipeDirection.LEFT)).toBe(false);
      expect(coordSystem.canFaceMove(CubeFace.FRONT, grid, SwipeDirection.UP)).toBe(false);
    });
    
    it('should detect valid moves on BACK face with reversed directions', () => {
      const grid = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      
      // Global LEFT should move tiles RIGHT on back face
      expect(coordSystem.canFaceMove(CubeFace.BACK, grid, SwipeDirection.LEFT)).toBe(true);
      // Global RIGHT should move tiles LEFT on back face
      expect(coordSystem.canFaceMove(CubeFace.BACK, grid, SwipeDirection.RIGHT)).toBe(false);
    });
    
    it('should detect merges correctly', () => {
      const grid = [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      
      expect(coordSystem.canFaceMove(CubeFace.FRONT, grid, SwipeDirection.LEFT)).toBe(true);
      expect(coordSystem.canFaceMove(CubeFace.FRONT, grid, SwipeDirection.RIGHT)).toBe(true);
    });
    
    it('should handle full rows correctly', () => {
      const grid = [
        [2, 4, 8, 16],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      
      // No same values adjacent, can't merge or move
      expect(coordSystem.canFaceMove(CubeFace.FRONT, grid, SwipeDirection.LEFT)).toBe(false);
      expect(coordSystem.canFaceMove(CubeFace.FRONT, grid, SwipeDirection.RIGHT)).toBe(false);
    });
  });
  
  describe('Complex scenarios', () => {
    it('should handle LEFT face tile at top-left moving "up" (which is RIGHT locally)', () => {
      const grid = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      
      // On LEFT face, global UP means local RIGHT
      expect(coordSystem.canFaceMove(CubeFace.LEFT, grid, SwipeDirection.UP)).toBe(true);
    });
    
    it('should handle RIGHT face tile at top-right moving "up" (which is LEFT locally)', () => {
      const grid = [
        [0, 0, 0, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      
      // On RIGHT face, global UP means local LEFT
      expect(coordSystem.canFaceMove(CubeFace.RIGHT, grid, SwipeDirection.UP)).toBe(true);
    });
  });
  
  describe('Debug output', () => {
    it('should provide debug information for each face', () => {
      const debug = coordSystem.debugFace(CubeFace.LEFT);
      expect(debug).toContain('LEFT:');
      expect(debug).toContain('UP → RIGHT');
      expect(debug).toContain('DOWN → LEFT');
      expect(debug).toContain('LEFT → UP');
      expect(debug).toContain('RIGHT → DOWN');
    });
  });
});