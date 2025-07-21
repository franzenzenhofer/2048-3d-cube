import { CubeFace, TileMovement, CubeRotation } from './CubeGameV3Fixed';
import { SwipeDirection } from './CubeGame';
import { RotationAwareCoordinateSystem } from './RotationAwareCoordinateSystem';

/**
 * Rotation-Aware 3D 2048 Game
 * 
 * This version implements the ultimate challenge where each face's 
 * interpretation of directions changes based on the cube's orientation.
 * 
 * Key differences from V3:
 * 1. Directions are relative to current cube orientation
 * 2. Each face may move in different local directions for the same swipe
 * 3. Players must track spatial transformations mentally
 */
export class CubeGameRotationAware {
  private faces: Map<CubeFace, number[][]> = new Map();
  private score: number = 0;
  private moveHistory: TileMovement[] = [];
  private activeFace: CubeFace = CubeFace.FRONT;
  private coordinateSystem: RotationAwareCoordinateSystem;
  
  constructor() {
    this.coordinateSystem = new RotationAwareCoordinateSystem();
    this.initializeFaces();
    this.addInitialTiles();
  }
  
  private initializeFaces(): void {
    Object.values(CubeFace).forEach(face => {
      this.faces.set(face as CubeFace, this.createEmptyGrid());
    });
  }
  
  private createEmptyGrid(): number[][] {
    return Array(4).fill(null).map(() => Array(4).fill(0));
  }
  
  private addInitialTiles(): void {
    Object.values(CubeFace).forEach(face => {
      this.addRandomTilesToFace(face as CubeFace, 2);
    });
  }
  
  private addRandomTilesToFace(face: CubeFace, count: number): boolean {
    const grid = this.faces.get(face)!;
    const availablePositions: Array<{row: number, col: number}> = [];
    
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) {
          availablePositions.push({row: r, col: c});
        }
      }
    }
    
    if (availablePositions.length === 0) {
      console.warn(`No available positions on ${face} face!`);
      return false;
    }
    
    let tilesAdded = 0;
    for (let i = 0; i < Math.min(count, availablePositions.length); i++) {
      const idx = Math.floor(Math.random() * availablePositions.length);
      const pos = availablePositions.splice(idx, 1)[0];
      const value = Math.random() < 0.9 ? 2 : 4;
      grid[pos.row][pos.col] = value;
      tilesAdded++;
      console.log(`Added tile ${value} to ${face} at [${pos.row},${pos.col}]`);
    }
    
    return tilesAdded > 0;
  }
  
  /**
   * The core difference: Each face interprets the swipe based on orientation
   */
  public move(globalDirection: SwipeDirection): { moved: boolean; rotation?: CubeRotation } {
    this.moveHistory = [];
    let anyFaceMoved = false;
    
    console.log(`\n=== ROTATION-AWARE MOVE: ${globalDirection} ===`);
    
    // Move tiles on ALL 6 faces, but each with their own local direction!
    Object.values(CubeFace).forEach(face => {
      const typedFace = face as CubeFace;
      
      // Get the local direction for this face based on cube orientation
      const localDirection = this.coordinateSystem.getLocalDirection(typedFace, globalDirection);
      
      // Move tiles in the face's local direction
      const movements = this.moveTilesInFace(typedFace, localDirection);
      
      if (movements.length > 0) {
        anyFaceMoved = true;
        movements.forEach(m => {
          this.moveHistory.push({
            ...m,
            face: typedFace
          });
        });
      }
    });
    
    if (anyFaceMoved) {
      // Add new tiles to all faces
      Object.values(CubeFace).forEach(face => {
        this.addRandomTilesToFace(face as CubeFace, 1);
      });
      
      // Determine rotation
      const newActiveFace = this.getOppositeFace(globalDirection);
      const rotation = this.getRotationForTransition(this.activeFace, newActiveFace, globalDirection);
      
      // Update coordinate system with the rotation
      this.coordinateSystem.applyRotation(rotation.axis, rotation.angle);
      
      // Update active face
      this.activeFace = newActiveFace;
      
      // Debug current transformations
      this.coordinateSystem.debugTransformations();
      
      return { moved: true, rotation };
    }
    
    return { moved: false };
  }
  
  private moveTilesInFace(face: CubeFace, direction: SwipeDirection): TileMovement[] {
    const grid = this.faces.get(face)!;
    const newGrid = this.createEmptyGrid();
    const movements: TileMovement[] = [];
    let changed = false;
    
    // Same movement logic as before, but direction is now face-specific
    if (direction === SwipeDirection.LEFT) {
      for (let row = 0; row < 4; row++) {
        const tiles: Array<{value: number, col: number}> = [];
        for (let col = 0; col < 4; col++) {
          if (grid[row][col] > 0) {
            tiles.push({value: grid[row][col], col});
          }
        }
        
        const merged = this.mergeLine(tiles.map(t => t.value));
        for (let i = 0; i < merged.length; i++) {
          newGrid[row][i] = merged[i].value;
          const originalTile = tiles[merged[i].originalIndex];
          if (originalTile.col !== i || merged[i].merged) {
            changed = true;
            movements.push({
              fromPos: [row, originalTile.col],
              toPos: [row, i],
              value: merged[i].value,
              merged: merged[i].merged
            });
          }
        }
      }
    } else if (direction === SwipeDirection.RIGHT) {
      for (let row = 0; row < 4; row++) {
        const tiles: Array<{value: number, col: number}> = [];
        for (let col = 0; col < 4; col++) {
          if (grid[row][col] > 0) {
            tiles.push({value: grid[row][col], col});
          }
        }
        
        const merged = this.mergeLine(tiles.map(t => t.value));
        for (let i = 0; i < merged.length; i++) {
          const targetCol = 3 - i;
          newGrid[row][targetCol] = merged[i].value;
          const originalTile = tiles[merged[i].originalIndex];
          if (originalTile.col !== targetCol || merged[i].merged) {
            changed = true;
            movements.push({
              fromPos: [row, originalTile.col],
              toPos: [row, targetCol],
              value: merged[i].value,
              merged: merged[i].merged
            });
          }
        }
      }
    } else if (direction === SwipeDirection.UP) {
      for (let col = 0; col < 4; col++) {
        const tiles: Array<{value: number, row: number}> = [];
        for (let row = 0; row < 4; row++) {
          if (grid[row][col] > 0) {
            tiles.push({value: grid[row][col], row});
          }
        }
        
        const merged = this.mergeLine(tiles.map(t => t.value));
        for (let i = 0; i < merged.length; i++) {
          newGrid[i][col] = merged[i].value;
          const originalTile = tiles[merged[i].originalIndex];
          if (originalTile.row !== i || merged[i].merged) {
            changed = true;
            movements.push({
              fromPos: [originalTile.row, col],
              toPos: [i, col],
              value: merged[i].value,
              merged: merged[i].merged
            });
          }
        }
      }
    } else { // DOWN
      for (let col = 0; col < 4; col++) {
        const tiles: Array<{value: number, row: number}> = [];
        for (let row = 0; row < 4; row++) {
          if (grid[row][col] > 0) {
            tiles.push({value: grid[row][col], row});
          }
        }
        
        const merged = this.mergeLine(tiles.map(t => t.value));
        for (let i = 0; i < merged.length; i++) {
          const targetRow = 3 - i;
          newGrid[targetRow][col] = merged[i].value;
          const originalTile = tiles[merged[i].originalIndex];
          if (originalTile.row !== targetRow || merged[i].merged) {
            changed = true;
            movements.push({
              fromPos: [originalTile.row, col],
              toPos: [targetRow, col],
              value: merged[i].value,
              merged: merged[i].merged
            });
          }
        }
      }
    }
    
    if (changed) {
      this.faces.set(face, newGrid);
    }
    
    return movements;
  }
  
  private mergeLine(tiles: number[]): Array<{value: number, merged: boolean, originalIndex: number}> {
    if (tiles.length === 0) return [];
    
    const result: Array<{value: number, merged: boolean, originalIndex: number}> = [];
    let i = 0;
    
    while (i < tiles.length) {
      if (i < tiles.length - 1 && tiles[i] === tiles[i + 1]) {
        const mergedValue = tiles[i] * 2;
        result.push({value: mergedValue, merged: true, originalIndex: i});
        this.score += mergedValue;
        i += 2;
      } else {
        result.push({value: tiles[i], merged: false, originalIndex: i});
        i++;
      }
    }
    
    return result;
  }
  
  private getOppositeFace(direction: SwipeDirection): CubeFace {
    switch (direction) {
      case SwipeDirection.LEFT:
        return CubeFace.RIGHT;
      case SwipeDirection.RIGHT:
        return CubeFace.LEFT;
      case SwipeDirection.UP:
        return CubeFace.BOTTOM;
      case SwipeDirection.DOWN:
        return CubeFace.TOP;
    }
  }
  
  private getRotationForTransition(fromFace: CubeFace, toFace: CubeFace, direction: SwipeDirection): CubeRotation {
    let axis: 'x' | 'y' = 'y';
    let angle = 0;
    
    switch (direction) {
      case SwipeDirection.LEFT:
        axis = 'y';
        angle = 90;
        break;
      case SwipeDirection.RIGHT:
        axis = 'y';
        angle = -90;
        break;
      case SwipeDirection.UP:
        axis = 'x';
        angle = -90;
        break;
      case SwipeDirection.DOWN:
        axis = 'x';
        angle = 90;
        break;
    }
    
    return { axis, angle };
  }
  
  // Getters and game state methods
  public getActiveFace(): CubeFace {
    return this.activeFace;
  }
  
  public getFaceGrid(face: CubeFace): number[][] {
    return this.faces.get(face) || this.createEmptyGrid();
  }
  
  public getScore(): number {
    return this.score;
  }
  
  public getMoveHistory(): TileMovement[] {
    return this.moveHistory;
  }
  
  public isGameOver(): boolean {
    for (const [face, grid] of this.faces) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] === 0) return false;
          
          if (r > 0 && grid[r-1][c] === grid[r][c]) return false;
          if (r < 3 && grid[r+1][c] === grid[r][c]) return false;
          if (c > 0 && grid[r][c-1] === grid[r][c]) return false;
          if (c < 3 && grid[r][c+1] === grid[r][c]) return false;
        }
      }
    }
    
    return true;
  }
  
  public hasWon(): boolean {
    for (const [_, grid] of this.faces) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] >= 2048) return true;
        }
      }
    }
    return false;
  }
  
  public setTileForTesting(face: CubeFace, row: number, col: number, value: number): void {
    const grid = this.faces.get(face)!;
    grid[row][col] = value;
  }
  
  /**
   * Get debug info about current orientation
   */
  public getOrientationInfo() {
    return {
      activeFace: this.activeFace,
      orientation: this.coordinateSystem.getOrientation(),
      transformations: this.getTransformationMap()
    };
  }
  
  private getTransformationMap() {
    const map: Record<CubeFace, Record<SwipeDirection, SwipeDirection>> = {} as any;
    
    Object.values(CubeFace).forEach(face => {
      map[face as CubeFace] = {} as any;
      Object.values(SwipeDirection).forEach(dir => {
        map[face as CubeFace][dir as SwipeDirection] = 
          this.coordinateSystem.getLocalDirection(face as CubeFace, dir as SwipeDirection);
      });
    });
    
    return map;
  }
}