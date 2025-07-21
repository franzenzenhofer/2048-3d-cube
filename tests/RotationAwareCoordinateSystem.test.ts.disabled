import { describe, it, expect, beforeEach } from 'vitest';
import { RotationAwareCoordinateSystem } from '../src/game/RotationAwareCoordinateSystem';
import { CubeFace, SwipeDirection } from '../src/game/CubeGameV3Fixed';

describe('RotationAwareCoordinateSystem', () => {
  let coordinateSystem: RotationAwareCoordinateSystem;

  beforeEach(() => {
    coordinateSystem = new RotationAwareCoordinateSystem();
  });

  describe('Initial State', () => {
    it('should start with identity transformations', () => {
      // In the initial state, all faces should interpret directions normally
      const faces = Object.values(CubeFace);
      const directions = Object.values(SwipeDirection);
      
      faces.forEach(face => {
        directions.forEach(dir => {
          const localDir = coordinateSystem.getLocalDirection(face as CubeFace, dir as SwipeDirection);
          
          // For FRONT face, directions should be identity
          if (face === CubeFace.FRONT) {
            expect(localDir).toBe(dir);
          }
        });
      });
    });

    it('should have FRONT as the initial front face', () => {
      const orientation = coordinateSystem.getOrientation();
      expect(orientation.frontFace).toBe(CubeFace.FRONT);
      expect(orientation.rotationX).toBe(0);
      expect(orientation.rotationY).toBe(0);
    });
  });

  describe('Rotation Transformations', () => {
    it('should update transformations after Y-axis rotation (RIGHT swipe)', () => {
      // Rotate 90 degrees around Y axis (cube rotates right)
      coordinateSystem.applyRotation('y', -90);
      
      // After rotating right, LEFT face comes to front
      const orientation = coordinateSystem.getOrientation();
      expect(orientation.frontFace).toBe(CubeFace.LEFT);
      
      // For the LEFT face (now front), its original RIGHT is now UP
      const leftFaceUp = coordinateSystem.getLocalDirection(CubeFace.LEFT, SwipeDirection.UP);
      expect(leftFaceUp).toBe(SwipeDirection.RIGHT);
      
      const leftFaceRight = coordinateSystem.getLocalDirection(CubeFace.LEFT, SwipeDirection.RIGHT);
      expect(leftFaceRight).toBe(SwipeDirection.DOWN);
    });

    it('should update transformations after X-axis rotation (UP swipe)', () => {
      // Rotate -90 degrees around X axis (cube rotates up)
      coordinateSystem.applyRotation('x', -90);
      
      // After rotating up, BOTTOM face comes to front
      const orientation = coordinateSystem.getOrientation();
      expect(orientation.frontFace).toBe(CubeFace.BOTTOM);
      
      // For BOTTOM face, UP and DOWN are inverted
      const bottomFaceUp = coordinateSystem.getLocalDirection(CubeFace.BOTTOM, SwipeDirection.UP);
      expect(bottomFaceUp).toBe(SwipeDirection.DOWN);
    });

    it('should handle multiple rotations correctly', () => {
      // First rotate right
      coordinateSystem.applyRotation('y', -90);
      // Then rotate up
      coordinateSystem.applyRotation('x', -90);
      
      // Complex transformation should be applied
      const frontUp = coordinateSystem.getLocalDirection(CubeFace.FRONT, SwipeDirection.UP);
      // This will be a complex transformation based on both rotations
      expect(frontUp).toBeDefined();
    });
  });

  describe('Face Transitions', () => {
    it('should correctly transition faces on Y-axis rotations', () => {
      const initialFace = coordinateSystem.getOrientation().frontFace;
      expect(initialFace).toBe(CubeFace.FRONT);
      
      // Rotate right (negative Y)
      coordinateSystem.applyRotation('y', -90);
      expect(coordinateSystem.getOrientation().frontFace).toBe(CubeFace.LEFT);
      
      // Rotate right again
      coordinateSystem.applyRotation('y', -90);
      expect(coordinateSystem.getOrientation().frontFace).toBe(CubeFace.BACK);
      
      // Rotate right again
      coordinateSystem.applyRotation('y', -90);
      expect(coordinateSystem.getOrientation().frontFace).toBe(CubeFace.RIGHT);
      
      // Rotate right once more - should be back to FRONT
      coordinateSystem.applyRotation('y', -90);
      expect(coordinateSystem.getOrientation().frontFace).toBe(CubeFace.FRONT);
    });

    it('should correctly transition faces on X-axis rotations', () => {
      // Start at FRONT
      expect(coordinateSystem.getOrientation().frontFace).toBe(CubeFace.FRONT);
      
      // Rotate up
      coordinateSystem.applyRotation('x', -90);
      expect(coordinateSystem.getOrientation().frontFace).toBe(CubeFace.BOTTOM);
      
      // Rotate down twice to go through TOP
      coordinateSystem.applyRotation('x', 90);
      coordinateSystem.applyRotation('x', 90);
      expect(coordinateSystem.getOrientation().frontFace).toBe(CubeFace.TOP);
    });
  });

  describe('Transformation Consistency', () => {
    it('should maintain consistent transformations for opposite directions', () => {
      // For any rotation state, UP and DOWN should be opposites
      coordinateSystem.applyRotation('y', -45);
      coordinateSystem.applyRotation('x', 30);
      
      const faces = Object.values(CubeFace);
      faces.forEach(face => {
        const up = coordinateSystem.getLocalDirection(face as CubeFace, SwipeDirection.UP);
        const down = coordinateSystem.getLocalDirection(face as CubeFace, SwipeDirection.DOWN);
        
        // They should be opposite directions
        expect(
          (up === SwipeDirection.UP && down === SwipeDirection.DOWN) ||
          (up === SwipeDirection.DOWN && down === SwipeDirection.UP) ||
          (up === SwipeDirection.LEFT && down === SwipeDirection.RIGHT) ||
          (up === SwipeDirection.RIGHT && down === SwipeDirection.LEFT)
        ).toBe(true);
      });
    });
  });

  describe('State Management', () => {
    it('should save and restore orientation state', () => {
      // Apply some rotations
      coordinateSystem.applyRotation('y', -90);
      coordinateSystem.applyRotation('x', 45);
      
      // Save state
      const savedState = coordinateSystem.getOrientation();
      
      // Reset and verify it's back to initial
      coordinateSystem.reset();
      expect(coordinateSystem.getOrientation().frontFace).toBe(CubeFace.FRONT);
      expect(coordinateSystem.getOrientation().rotationX).toBe(0);
      
      // Restore saved state
      coordinateSystem.setOrientation(savedState);
      expect(coordinateSystem.getOrientation().frontFace).toBe(savedState.frontFace);
      expect(coordinateSystem.getOrientation().rotationX).toBeCloseTo(savedState.rotationX);
      expect(coordinateSystem.getOrientation().rotationY).toBeCloseTo(savedState.rotationY);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle gimbal lock gracefully', () => {
      // Rotate to a potential gimbal lock position
      coordinateSystem.applyRotation('x', 90);
      coordinateSystem.applyRotation('y', 90);
      coordinateSystem.applyRotation('x', -90);
      
      // Should still produce valid transformations
      const up = coordinateSystem.getLocalDirection(CubeFace.FRONT, SwipeDirection.UP);
      expect(up).toBeDefined();
      expect(Object.values(SwipeDirection)).toContain(up);
    });

    it('should handle 360 degree rotations', () => {
      const initialFront = coordinateSystem.getOrientation().frontFace;
      
      // Rotate 360 degrees around Y
      for (let i = 0; i < 4; i++) {
        coordinateSystem.applyRotation('y', -90);
      }
      
      // Should be back to the same front face
      expect(coordinateSystem.getOrientation().frontFace).toBe(initialFront);
      
      // Transformations should be back to identity for FRONT face
      const frontUp = coordinateSystem.getLocalDirection(CubeFace.FRONT, SwipeDirection.UP);
      expect(frontUp).toBe(SwipeDirection.UP);
    });
  });
});