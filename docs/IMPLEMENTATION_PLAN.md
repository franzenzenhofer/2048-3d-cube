# Implementation Plan: Rotation-Aware 3D 2048

## 📋 Overview

Transform the current 6-independent-games model into a rotation-aware system where each face's coordinate system changes based on cube orientation.

## 🏗️ Architecture Changes

### 1. Core Data Structures

```typescript
// Current cube orientation in 3D space
interface CubeOrientation {
  // Rotation angles around each axis
  rotationX: number;  // Pitch
  rotationY: number;  // Yaw
  rotationZ: number;  // Roll
  
  // Which face is currently front-facing
  frontFace: CubeFace;
  
  // Orientation of the front face (0, 90, 180, 270 degrees)
  frontFaceRotation: number;
}

// Orientation state for each face
interface FaceOrientationState {
  face: CubeFace;
  // Mapping from global directions to local directions
  directionMap: Map<SwipeDirection, SwipeDirection>;
  // Visual rotation for rendering
  visualRotation: number;
}

// Enhanced game state
interface RotationAwareCubeGame {
  faces: Map<CubeFace, number[][]>;
  orientation: CubeOrientation;
  faceOrientations: Map<CubeFace, FaceOrientationState>;
  score: number;
  moveHistory: RotationAwareMoveHistory[];
}
```

### 2. Rotation Transformation System

```typescript
class RotationTransformationEngine {
  // Calculate how each face interprets directions based on cube orientation
  calculateFaceOrientations(
    cubeOrientation: CubeOrientation
  ): Map<CubeFace, FaceOrientationState>;
  
  // Transform global swipe to local direction for a face
  transformSwipeDirection(
    globalSwipe: SwipeDirection,
    targetFace: CubeFace,
    cubeOrientation: CubeOrientation
  ): SwipeDirection;
  
  // Update orientations after cube rotation
  updateOrientationsAfterRotation(
    previousOrientation: CubeOrientation,
    rotation: CubeRotation
  ): CubeOrientation;
}
```

### 3. Face-Specific Coordinate Systems

Each face needs to track its own coordinate system:

```typescript
class FaceCoordinateSystem {
  private face: CubeFace;
  private baseOrientation: Matrix4;  // Original orientation
  private currentOrientation: Matrix4;  // After rotations
  
  // Convert global direction to local
  globalToLocal(globalDir: SwipeDirection): SwipeDirection;
  
  // Update after cube rotation
  applyRotation(rotation: CubeRotation): void;
}
```

## 📐 Mathematical Implementation

### Rotation Matrices

Define rotation matrices for each type of cube rotation:

```typescript
const ROTATION_MATRICES = {
  // Rotate around Y-axis (left/right swipes)
  Y_POSITIVE_90: new Matrix4().makeRotationY(Math.PI / 2),
  Y_NEGATIVE_90: new Matrix4().makeRotationY(-Math.PI / 2),
  
  // Rotate around X-axis (up/down swipes)
  X_POSITIVE_90: new Matrix4().makeRotationX(Math.PI / 2),
  X_NEGATIVE_90: new Matrix4().makeRotationX(-Math.PI / 2),
};
```

### Direction Vectors

Represent directions as 3D vectors:

```typescript
const DIRECTION_VECTORS = {
  UP: new Vector3(0, 1, 0),
  DOWN: new Vector3(0, -1, 0),
  LEFT: new Vector3(-1, 0, 0),
  RIGHT: new Vector3(1, 0, 0),
};
```

### Transformation Algorithm

```typescript
function transformDirection(
  globalDirection: SwipeDirection,
  faceNormal: Vector3,
  faceUp: Vector3,
  cubeRotation: Matrix4
): SwipeDirection {
  // 1. Get direction vector
  const dirVector = DIRECTION_VECTORS[globalDirection].clone();
  
  // 2. Apply cube rotation
  dirVector.applyMatrix4(cubeRotation);
  
  // 3. Project onto face's local coordinate system
  const faceRight = new Vector3().crossVectors(faceNormal, faceUp);
  
  // 4. Calculate dot products to find closest local direction
  const dots = {
    UP: dirVector.dot(faceUp),
    DOWN: dirVector.dot(faceUp.clone().negate()),
    RIGHT: dirVector.dot(faceRight),
    LEFT: dirVector.dot(faceRight.clone().negate()),
  };
  
  // 5. Return direction with highest dot product
  return Object.entries(dots).reduce((a, b) => 
    dots[a[0]] > dots[b[0]] ? a : b
  )[0] as SwipeDirection;
}
```

## 🎮 Gameplay Flow

### Move Sequence

1. **Player swipes** in a global direction
2. **For each face**, calculate local direction based on:
   - Face's position on cube
   - Current cube orientation
   - Global swipe direction
3. **Move tiles** on each face according to its local direction
4. **Spawn new tiles** on each face
5. **Rotate cube** to show new front face
6. **Update orientation tracking** for next move

### Visual Feedback

Show players how directions map:

```typescript
interface DirectionIndicator {
  face: CubeFace;
  arrows: {
    up: { direction: SwipeDirection; opacity: number };
    down: { direction: SwipeDirection; opacity: number };
    left: { direction: SwipeDirection; opacity: number };
    right: { direction: SwipeDirection; opacity: number };
  };
}
```

## 🧪 Testing Strategy

### Unit Tests

1. **Transformation Accuracy**
   - Test all 576 possible direction transformations
   - Verify matrices produce correct results

2. **Orientation Tracking**
   - Ensure orientation updates correctly after rotations
   - Verify face coordinate systems remain consistent

3. **Edge Cases**
   - Multiple rotations in sequence
   - Full 360° rotations
   - Gimbal lock scenarios

### Integration Tests

1. **Gameplay Scenarios**
   - Complex rotation sequences
   - Verify tiles move correctly on all faces
   - Score calculation across transformed moves

2. **Visual Verification**
   - Screenshot tests for different orientations
   - Ensure visual matches logical state

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Implement CubeOrientation tracking
- [ ] Create RotationTransformationEngine
- [ ] Add direction transformation logic
- [ ] Unit tests for transformations

### Phase 2: Integration (Week 2)
- [ ] Integrate with existing game logic
- [ ] Update move processing for transformations
- [ ] Modify cube rotation animations
- [ ] Integration tests

### Phase 3: UI/UX (Week 3)
- [ ] Add orientation indicators
- [ ] Implement direction preview
- [ ] Create tutorial for complex mechanics
- [ ] User testing and feedback

### Phase 4: Polish (Week 4)
- [ ] Performance optimization
- [ ] Difficulty modes
- [ ] Achievement system
- [ ] Final testing and deployment

## ⚡ Performance Considerations

### Optimization Strategies

1. **Precompute Transformations**
   ```typescript
   // Cache all 576 transformations at startup
   const TRANSFORMATION_CACHE = precomputeAllTransformations();
   ```

2. **Lazy Evaluation**
   - Only calculate transformations for faces with valid moves
   - Skip complex math for faces that can't move

3. **WebGL Acceleration**
   - Use GPU for matrix operations
   - Parallel transformation calculations

### Memory Management

- Reuse matrix objects
- Pool vector objects
- Minimize allocations in hot paths

## 🎯 Success Metrics

1. **Performance**: 60fps during all animations
2. **Accuracy**: 100% correct transformations
3. **Playability**: Users can understand system within 10 minutes
4. **Engagement**: Average session time > 15 minutes

## 🚨 Risk Mitigation

### Complexity Risk
- **Mitigation**: Gradual difficulty modes
- **Fallback**: Option to play without rotation awareness

### Performance Risk
- **Mitigation**: Aggressive caching and optimization
- **Fallback**: Reduce visual fidelity on weak devices

### User Confusion Risk
- **Mitigation**: Comprehensive tutorial system
- **Fallback**: Traditional mode available

## 📝 Documentation Requirements

1. **Code Documentation**
   - Every transformation documented
   - Visual diagrams in comments
   - Example scenarios

2. **User Documentation**
   - Interactive tutorial
   - Strategy guide
   - Video explanations

3. **Developer Documentation**
   - Architecture diagrams
   - Mathematical proofs
   - Debugging guide

## 🎮 Final Thoughts

This implementation will create the most complex puzzle game ever made. The combination of:
- 6 simultaneous games
- 3D spatial reasoning
- Dynamic coordinate systems
- Rotation transformations

Creates a unique challenge that pushes the boundaries of human spatial cognition!