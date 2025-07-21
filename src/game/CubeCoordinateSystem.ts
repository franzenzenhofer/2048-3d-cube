import { CubeFace, SwipeDirection } from './CubeGameV3Fixed';

/**
 * Bulletproof coordinate system for 3D cube
 * 
 * Key insight: Each face has its own local coordinate system
 * When viewing the cube from the front, we need to map global swipes
 * to each face's local directions
 */
export class CubeCoordinateSystem {
  // Map of what each global direction means for each face
  private readonly directionMap: Map<CubeFace, Map<SwipeDirection, SwipeDirection>>;
  
  constructor() {
    this.directionMap = new Map();
    this.initializeDirectionMappings();
  }
  
  private initializeDirectionMappings(): void {
    // FRONT face - standard mapping (what you see is what you get)
    this.directionMap.set(CubeFace.FRONT, new Map([
      [SwipeDirection.UP, SwipeDirection.UP],
      [SwipeDirection.DOWN, SwipeDirection.DOWN],
      [SwipeDirection.LEFT, SwipeDirection.LEFT],
      [SwipeDirection.RIGHT, SwipeDirection.RIGHT]
    ]));
    
    // BACK face - viewed through the cube, left/right are reversed
    this.directionMap.set(CubeFace.BACK, new Map([
      [SwipeDirection.UP, SwipeDirection.UP],
      [SwipeDirection.DOWN, SwipeDirection.DOWN],
      [SwipeDirection.LEFT, SwipeDirection.RIGHT],
      [SwipeDirection.RIGHT, SwipeDirection.LEFT]
    ]));
    
    // LEFT face - when viewed from front, face is rotated 90° clockwise
    // What appears as UP is actually the face's RIGHT
    this.directionMap.set(CubeFace.LEFT, new Map([
      [SwipeDirection.UP, SwipeDirection.RIGHT],
      [SwipeDirection.DOWN, SwipeDirection.LEFT],
      [SwipeDirection.LEFT, SwipeDirection.UP],
      [SwipeDirection.RIGHT, SwipeDirection.DOWN]
    ]));
    
    // RIGHT face - when viewed from front, face is rotated 90° counter-clockwise
    // What appears as UP is actually the face's LEFT
    this.directionMap.set(CubeFace.RIGHT, new Map([
      [SwipeDirection.UP, SwipeDirection.LEFT],
      [SwipeDirection.DOWN, SwipeDirection.RIGHT],
      [SwipeDirection.LEFT, SwipeDirection.DOWN],
      [SwipeDirection.RIGHT, SwipeDirection.UP]
    ]));
    
    // TOP face - when viewed from above (imagine the front face below it)
    // The "back" of the top face points toward the back face
    this.directionMap.set(CubeFace.TOP, new Map([
      [SwipeDirection.UP, SwipeDirection.UP],    // Toward back face
      [SwipeDirection.DOWN, SwipeDirection.DOWN], // Toward front face
      [SwipeDirection.LEFT, SwipeDirection.LEFT],
      [SwipeDirection.RIGHT, SwipeDirection.RIGHT]
    ]));
    
    // BOTTOM face - when viewed from below (imagine the front face above it)
    // The "back" of the bottom face points toward the front face (inverted)
    this.directionMap.set(CubeFace.BOTTOM, new Map([
      [SwipeDirection.UP, SwipeDirection.DOWN],   // Inverted
      [SwipeDirection.DOWN, SwipeDirection.UP],   // Inverted
      [SwipeDirection.LEFT, SwipeDirection.LEFT],
      [SwipeDirection.RIGHT, SwipeDirection.RIGHT]
    ]));
  }
  
  /**
   * Get the local direction for a face given a global swipe direction
   */
  public getLocalDirection(face: CubeFace, globalDirection: SwipeDirection): SwipeDirection {
    const faceMap = this.directionMap.get(face);
    if (!faceMap) {
      throw new Error(`No direction mapping for face: ${face}`);
    }
    
    const localDirection = faceMap.get(globalDirection);
    if (!localDirection) {
      throw new Error(`No mapping for direction ${globalDirection} on face ${face}`);
    }
    
    return localDirection;
  }
  
  /**
   * Debug method to print all mappings for a face
   */
  public debugFace(face: CubeFace): string {
    const faceMap = this.directionMap.get(face);
    if (!faceMap) return `No mapping for ${face}`;
    
    const mappings: string[] = [];
    faceMap.forEach((local, global) => {
      mappings.push(`${global} → ${local}`);
    });
    
    return `${face}:\n${mappings.join('\n')}`;
  }
  
  /**
   * Verify that a face can move in a given direction
   * This helps catch coordinate system errors
   */
  public canFaceMove(face: CubeFace, grid: number[][], globalDirection: SwipeDirection): boolean {
    const localDirection = this.getLocalDirection(face, globalDirection);
    
    // Check if any tile can move in the local direction
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (grid[row][col] === 0) continue;
        
        // Check if this tile can move
        if (this.canTileMove(grid, row, col, localDirection)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  private canTileMove(grid: number[][], row: number, col: number, direction: SwipeDirection): boolean {
    const value = grid[row][col];
    if (value === 0) return false;
    
    switch (direction) {
      case SwipeDirection.LEFT:
        // Can move left if there's empty space or same value to the left
        for (let c = col - 1; c >= 0; c--) {
          if (grid[row][c] === 0) return true;
          if (grid[row][c] === value) return true;
          break; // Blocked by different value
        }
        break;
        
      case SwipeDirection.RIGHT:
        // Can move right if there's empty space or same value to the right
        for (let c = col + 1; c < 4; c++) {
          if (grid[row][c] === 0) return true;
          if (grid[row][c] === value) return true;
          break; // Blocked by different value
        }
        break;
        
      case SwipeDirection.UP:
        // Can move up if there's empty space or same value above
        for (let r = row - 1; r >= 0; r--) {
          if (grid[r][col] === 0) return true;
          if (grid[r][col] === value) return true;
          break; // Blocked by different value
        }
        break;
        
      case SwipeDirection.DOWN:
        // Can move down if there's empty space or same value below
        for (let r = row + 1; r < 4; r++) {
          if (grid[r][col] === 0) return true;
          if (grid[r][col] === value) return true;
          break; // Blocked by different value
        }
        break;
    }
    
    return false;
  }
}