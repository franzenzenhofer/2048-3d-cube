import * as THREE from 'three';
import { CubeFace, SwipeDirection } from './CubeGameV3Fixed';

/**
 * Rotation-Aware Coordinate System for 3D 2048
 * 
 * This system tracks how each face interprets swipe directions based on 
 * the cube's current orientation in 3D space. After each rotation, what 
 * constitutes "up", "down", "left", and "right" changes for each face.
 * 
 * The complexity comes from:
 * 1. Each face has its own local coordinate system
 * 2. The cube can be in 24 different orientations
 * 3. Global swipes must be transformed to each face's local space
 */

export interface CubeOrientation {
  // Current rotation angles in radians
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  
  // Which face is currently front-facing
  frontFace: CubeFace;
  
  // Accumulated rotation matrix
  rotationMatrix: THREE.Matrix4;
}

export class RotationAwareCoordinateSystem {
  private orientation: CubeOrientation;
  
  // Base orientations for each face (when cube is unrotated)
  private readonly faceBaseOrientations: Map<CubeFace, {
    normal: THREE.Vector3;
    up: THREE.Vector3;
    right: THREE.Vector3;
  }>;
  
  // Direction vectors in 3D space
  private readonly directionVectors: Map<SwipeDirection, THREE.Vector3>;
  
  constructor() {
    this.orientation = {
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      frontFace: CubeFace.FRONT,
      rotationMatrix: new THREE.Matrix4().identity()
    };
    
    this.faceBaseOrientations = this.initializeFaceOrientations();
    this.directionVectors = this.initializeDirectionVectors();
  }
  
  private initializeFaceOrientations() {
    const orientations = new Map();
    
    // FRONT face (looking at +Z)
    orientations.set(CubeFace.FRONT, {
      normal: new THREE.Vector3(0, 0, 1),
      up: new THREE.Vector3(0, 1, 0),
      right: new THREE.Vector3(1, 0, 0)
    });
    
    // BACK face (looking at -Z)
    orientations.set(CubeFace.BACK, {
      normal: new THREE.Vector3(0, 0, -1),
      up: new THREE.Vector3(0, 1, 0),
      right: new THREE.Vector3(-1, 0, 0)  // Right is flipped when looking through
    });
    
    // LEFT face (looking at -X)
    orientations.set(CubeFace.LEFT, {
      normal: new THREE.Vector3(-1, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      right: new THREE.Vector3(0, 0, -1)
    });
    
    // RIGHT face (looking at +X)
    orientations.set(CubeFace.RIGHT, {
      normal: new THREE.Vector3(1, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      right: new THREE.Vector3(0, 0, 1)
    });
    
    // TOP face (looking at +Y)
    orientations.set(CubeFace.TOP, {
      normal: new THREE.Vector3(0, 1, 0),
      up: new THREE.Vector3(0, 0, -1),
      right: new THREE.Vector3(1, 0, 0)
    });
    
    // BOTTOM face (looking at -Y)
    orientations.set(CubeFace.BOTTOM, {
      normal: new THREE.Vector3(0, -1, 0),
      up: new THREE.Vector3(0, 0, 1),
      right: new THREE.Vector3(1, 0, 0)
    });
    
    return orientations;
  }
  
  private initializeDirectionVectors() {
    return new Map([
      [SwipeDirection.UP, new THREE.Vector3(0, 1, 0)],
      [SwipeDirection.DOWN, new THREE.Vector3(0, -1, 0)],
      [SwipeDirection.LEFT, new THREE.Vector3(-1, 0, 0)],
      [SwipeDirection.RIGHT, new THREE.Vector3(1, 0, 0)]
    ]);
  }
  
  /**
   * Transform a global swipe direction to a face's local direction
   * based on the current cube orientation
   */
  public getLocalDirection(
    face: CubeFace, 
    globalSwipe: SwipeDirection
  ): SwipeDirection {
    // Get the global direction vector
    const globalDir = this.directionVectors.get(globalSwipe)!.clone();
    
    // Get the face's base orientation
    const faceOrientation = this.faceBaseOrientations.get(face)!;
    
    // Apply the cube's rotation to the face's orientation vectors
    const rotatedUp = faceOrientation.up.clone()
      .applyMatrix4(this.orientation.rotationMatrix);
    const rotatedRight = faceOrientation.right.clone()
      .applyMatrix4(this.orientation.rotationMatrix);
    
    // Calculate dot products to find which local direction 
    // best matches the global swipe
    const dots = {
      [SwipeDirection.UP]: globalDir.dot(rotatedUp),
      [SwipeDirection.DOWN]: -globalDir.dot(rotatedUp),
      [SwipeDirection.RIGHT]: globalDir.dot(rotatedRight),
      [SwipeDirection.LEFT]: -globalDir.dot(rotatedRight)
    };
    
    // Return the direction with the highest dot product
    let maxDot = -Infinity;
    let bestDirection = SwipeDirection.UP;
    
    for (const [dir, dot] of Object.entries(dots)) {
      if (dot > maxDot) {
        maxDot = dot;
        bestDirection = dir as SwipeDirection;
      }
    }
    
    console.log(`Face ${face}: Global ${globalSwipe} → Local ${bestDirection}`);
    return bestDirection;
  }
  
  /**
   * Update the cube's orientation after a rotation
   */
  public applyRotation(axis: 'x' | 'y', angle: number): void {
    const rotationMatrix = new THREE.Matrix4();
    const angleRad = angle * Math.PI / 180;
    
    if (axis === 'x') {
      rotationMatrix.makeRotationX(angleRad);
      this.orientation.rotationX += angleRad;
    } else {
      rotationMatrix.makeRotationY(angleRad);
      this.orientation.rotationY += angleRad;
    }
    
    // Update the accumulated rotation matrix
    this.orientation.rotationMatrix.premultiply(rotationMatrix);
    
    // Determine new front face based on rotation
    this.updateFrontFace(axis, angle);
    
    console.log(`Cube rotated ${angle}° around ${axis}-axis`);
    console.log(`New front face: ${this.orientation.frontFace}`);
  }
  
  private updateFrontFace(axis: 'x' | 'y', angle: number): void {
    // This is simplified - in reality we'd calculate which face
    // is most aligned with the viewing direction
    const current = this.orientation.frontFace;
    
    if (axis === 'y') {
      if (angle > 0) {
        // Rotating right
        this.orientation.frontFace = this.getNextFaceY(current, 1);
      } else {
        // Rotating left
        this.orientation.frontFace = this.getNextFaceY(current, -1);
      }
    } else {
      if (angle > 0) {
        // Rotating down
        this.orientation.frontFace = this.getNextFaceX(current, 1);
      } else {
        // Rotating up
        this.orientation.frontFace = this.getNextFaceX(current, -1);
      }
    }
  }
  
  private getNextFaceY(current: CubeFace, direction: number): CubeFace {
    const cycle = [CubeFace.FRONT, CubeFace.RIGHT, CubeFace.BACK, CubeFace.LEFT];
    const index = cycle.indexOf(current);
    if (index === -1) return current; // TOP/BOTTOM don't change with Y rotation
    const newIndex = (index + direction + 4) % 4;
    return cycle[newIndex];
  }
  
  private getNextFaceX(current: CubeFace, direction: number): CubeFace {
    const transitions: Record<CubeFace, { up: CubeFace; down: CubeFace }> = {
      [CubeFace.FRONT]: { up: CubeFace.BOTTOM, down: CubeFace.TOP },
      [CubeFace.BACK]: { up: CubeFace.TOP, down: CubeFace.BOTTOM },
      [CubeFace.LEFT]: { up: CubeFace.BOTTOM, down: CubeFace.TOP },
      [CubeFace.RIGHT]: { up: CubeFace.BOTTOM, down: CubeFace.TOP },
      [CubeFace.TOP]: { up: CubeFace.FRONT, down: CubeFace.BACK },
      [CubeFace.BOTTOM]: { up: CubeFace.BACK, down: CubeFace.FRONT }
    };
    
    return direction > 0 ? transitions[current].down : transitions[current].up;
  }
  
  /**
   * Debug method to visualize current transformations
   */
  public debugTransformations(): void {
    console.log('\n=== Current Rotation-Aware Transformations ===');
    console.log(`Front Face: ${this.orientation.frontFace}`);
    console.log(`Rotation: X=${this.orientation.rotationX.toFixed(2)}, Y=${this.orientation.rotationY.toFixed(2)}`);
    
    const faces = Object.values(CubeFace);
    const directions = Object.values(SwipeDirection);
    
    for (const face of faces) {
      console.log(`\n${face}:`);
      for (const dir of directions) {
        const localDir = this.getLocalDirection(face as CubeFace, dir as SwipeDirection);
        console.log(`  ${dir} → ${localDir}`);
      }
    }
  }
  
  /**
   * Reset orientation to default
   */
  public reset(): void {
    this.orientation = {
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      frontFace: CubeFace.FRONT,
      rotationMatrix: new THREE.Matrix4().identity()
    };
  }
  
  /**
   * Get current orientation for saving/loading
   */
  public getOrientation(): CubeOrientation {
    return { ...this.orientation };
  }
  
  /**
   * Set orientation for loading saved games
   */
  public setOrientation(orientation: CubeOrientation): void {
    this.orientation = { ...orientation };
    // Recreate matrix from angles if needed
    if (!this.orientation.rotationMatrix) {
      this.orientation.rotationMatrix = new THREE.Matrix4()
        .makeRotationX(this.orientation.rotationX)
        .multiply(new THREE.Matrix4().makeRotationY(this.orientation.rotationY));
    }
  }
}