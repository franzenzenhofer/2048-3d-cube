import { CubeFace, SwipeDirection } from './CubeGameV3Fixed';

export interface FaceOrientation {
  face: CubeFace;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

export class CubeRotationSystem {
  private currentForwardFace: CubeFace = CubeFace.FRONT;
  
  // Define the base rotations for each face when it's forward-facing
  private readonly faceOrientations: Map<CubeFace, FaceOrientation> = new Map([
    [CubeFace.FRONT, { face: CubeFace.FRONT, rotationX: 0, rotationY: 0, rotationZ: 0 }],
    [CubeFace.BACK, { face: CubeFace.BACK, rotationX: 0, rotationY: 180, rotationZ: 0 }],
    [CubeFace.LEFT, { face: CubeFace.LEFT, rotationX: 0, rotationY: -90, rotationZ: 0 }],
    [CubeFace.RIGHT, { face: CubeFace.RIGHT, rotationX: 0, rotationY: 90, rotationZ: 0 }],
    [CubeFace.TOP, { face: CubeFace.TOP, rotationX: -90, rotationY: 0, rotationZ: 0 }],
    [CubeFace.BOTTOM, { face: CubeFace.BOTTOM, rotationX: 90, rotationY: 0, rotationZ: 0 }]
  ]);

  // Define face adjacency for each face
  private readonly faceAdjacency: Map<CubeFace, { [key in SwipeDirection]: CubeFace }> = new Map([
    [CubeFace.FRONT, {
      [SwipeDirection.UP]: CubeFace.TOP,
      [SwipeDirection.DOWN]: CubeFace.BOTTOM,
      [SwipeDirection.LEFT]: CubeFace.LEFT,
      [SwipeDirection.RIGHT]: CubeFace.RIGHT
    }],
    [CubeFace.BACK, {
      [SwipeDirection.UP]: CubeFace.TOP,
      [SwipeDirection.DOWN]: CubeFace.BOTTOM,
      [SwipeDirection.LEFT]: CubeFace.RIGHT,  // Reversed because we're looking from behind
      [SwipeDirection.RIGHT]: CubeFace.LEFT
    }],
    [CubeFace.LEFT, {
      [SwipeDirection.UP]: CubeFace.TOP,
      [SwipeDirection.DOWN]: CubeFace.BOTTOM,
      [SwipeDirection.LEFT]: CubeFace.BACK,
      [SwipeDirection.RIGHT]: CubeFace.FRONT
    }],
    [CubeFace.RIGHT, {
      [SwipeDirection.UP]: CubeFace.TOP,
      [SwipeDirection.DOWN]: CubeFace.BOTTOM,
      [SwipeDirection.LEFT]: CubeFace.FRONT,
      [SwipeDirection.RIGHT]: CubeFace.BACK
    }],
    [CubeFace.TOP, {
      [SwipeDirection.UP]: CubeFace.BACK,
      [SwipeDirection.DOWN]: CubeFace.FRONT,
      [SwipeDirection.LEFT]: CubeFace.LEFT,
      [SwipeDirection.RIGHT]: CubeFace.RIGHT
    }],
    [CubeFace.BOTTOM, {
      [SwipeDirection.UP]: CubeFace.FRONT,
      [SwipeDirection.DOWN]: CubeFace.BACK,
      [SwipeDirection.LEFT]: CubeFace.LEFT,
      [SwipeDirection.RIGHT]: CubeFace.RIGHT
    }]
  ]);

  public forwardFacing(faceId: CubeFace): void {
    this.currentForwardFace = faceId;
  }

  public getCurrentForwardFace(): CubeFace {
    return this.currentForwardFace;
  }

  public getRotationForFace(face: CubeFace): FaceOrientation {
    return this.faceOrientations.get(face)!;
  }

  public rotateToNextFace(swipeDirection: SwipeDirection): CubeFace {
    const adjacency = this.faceAdjacency.get(this.currentForwardFace)!;
    const nextFace = adjacency[swipeDirection];
    this.currentForwardFace = nextFace;
    return nextFace;
  }

  public getRotationAngles(): { x: number; y: number; z: number } {
    const orientation = this.faceOrientations.get(this.currentForwardFace)!;
    return {
      x: orientation.rotationX,
      y: orientation.rotationY,
      z: orientation.rotationZ
    };
  }

  // Get which directions map to which faces from current perspective
  public getAdjacentFaces(): { [key in SwipeDirection]: CubeFace } {
    return this.faceAdjacency.get(this.currentForwardFace)!;
  }
}