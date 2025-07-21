export enum CubeFace {
  FRONT = 'FRONT',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  BACK = 'BACK'
}

export enum SwipeDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  UP = 'UP',
  DOWN = 'DOWN'
}

export interface TileMovement {
  fromPos: [number, number];
  toPos: [number, number];
  value: number;
  merged: boolean;
  face?: CubeFace;
}

export interface CubeRotation {
  axis: 'x' | 'y';
  angle: number;
  direction: SwipeDirection;
  targetFace: CubeFace;
}


export class CubeGameV3Fixed {
  private faces: Map<CubeFace, number[][]> = new Map();
  private score: number = 0;
  private moveHistory: TileMovement[] = [];
  private activeFace: CubeFace = CubeFace.FRONT;
  
  constructor() {
    this.initializeFaces();
    this.addInitialTiles();
  }

  private initializeFaces(): void {
    // Create 6 independent 2048 boards
    Object.values(CubeFace).forEach(face => {
      this.faces.set(face as CubeFace, this.createEmptyGrid());
    });
  }

  private createEmptyGrid(): number[][] {
    return Array(4).fill(null).map(() => Array(4).fill(0));
  }

  private addInitialTiles(): void {
    // Each face gets 2 random tiles - they are independent games
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

  public move(direction: SwipeDirection): { moved: boolean; rotation?: CubeRotation } {
    this.moveHistory = [];
    let anyFaceMoved = false;
    
    // Move tiles on ALL 6 faces simultaneously!
    // All faces move in the SAME direction from the viewer's perspective
    Object.values(CubeFace).forEach(face => {
      const movements = this.moveTilesInFace(face as CubeFace, direction);
      if (movements.length > 0) {
        anyFaceMoved = true;
        // Add face info to movements for animation
        movements.forEach(m => {
          this.moveHistory.push({
            ...m,
            face: face as CubeFace
          });
        });
      }
    });
    
    if (anyFaceMoved) {
      // Add new tiles to ALL faces after move!
      Object.values(CubeFace).forEach(face => {
        const tileAdded = this.addRandomTilesToFace(face as CubeFace, 1);
        if (!tileAdded) {
          console.warn(`Failed to add tile to ${face} face - might be full!`);
        }
      });
      
      // Determine which face becomes active based on swipe direction
      const newActiveFace = this.getOppositeFace(direction);
      const rotation = this.getRotationForTransition(this.activeFace, newActiveFace, direction);
      
      // Update active face
      this.activeFace = newActiveFace;
      
      // Log state for debugging
      console.log(`Move ${direction}: tiles moved on all faces, new active: ${newActiveFace}`);
      
      return { moved: true, rotation };
    }
    
    return { moved: false };
  }

  private moveTilesInFace(face: CubeFace, direction: SwipeDirection): TileMovement[] {
    const grid = this.faces.get(face)!;
    const newGrid = this.createEmptyGrid();
    const movements: TileMovement[] = [];
    let changed = false;

    if (direction === SwipeDirection.LEFT) {
      // Move all tiles left
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
      // Move all tiles right
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
      // Move all tiles up
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
      // Move all tiles down
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
    // When you swipe, the cube rotates in that direction
    // This shows the face that was in that direction
    switch (direction) {
      case SwipeDirection.LEFT:
        return CubeFace.LEFT;   // Swipe left → show left face
      case SwipeDirection.RIGHT:
        return CubeFace.RIGHT;  // Swipe right → show right face
      case SwipeDirection.UP:
        return CubeFace.TOP;    // Swipe up → show top face
      case SwipeDirection.DOWN:
        return CubeFace.BOTTOM; // Swipe down → show bottom face
    }
  }

  private getRotationForTransition(fromFace: CubeFace, toFace: CubeFace, direction: SwipeDirection): CubeRotation {
    // Rotation matches the swipe direction visually
    let axis: 'x' | 'y' = 'y';
    let angle = 0;
    
    switch (direction) {
      case SwipeDirection.LEFT:
        axis = 'y';
        angle = -90;  // Rotate cube left to show left face
        break;
      case SwipeDirection.RIGHT:
        axis = 'y';
        angle = 90;   // Rotate cube right to show right face
        break;
      case SwipeDirection.UP:
        axis = 'x';
        angle = 90;   // Rotate cube up to show top face
        break;
      case SwipeDirection.DOWN:
        axis = 'x';
        angle = -90;  // Rotate cube down to show bottom face
        break;
    }
    
    return { axis, angle, direction, targetFace: toFace };
  }

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
    // Game is over only if ALL faces have no valid moves
    for (const [face, grid] of this.faces) {
      // Check for empty cells
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] === 0) return false;
          
          // Check adjacent cells for possible merges
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
    // Win if ANY face has 2048
    for (const [_, grid] of this.faces) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] >= 2048) return true;
        }
      }
    }
    return false;
  }

  public isFaceFull(face: CubeFace): boolean {
    const grid = this.faces.get(face)!;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) return false;
      }
    }
    return true;
  }

  public getAllFacesStatus(): Map<CubeFace, {tileCount: number, maxTile: number}> {
    const status = new Map<CubeFace, {tileCount: number, maxTile: number}>();
    
    for (const [face, grid] of this.faces) {
      let tileCount = 0;
      let maxTile = 0;
      
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] > 0) {
            tileCount++;
            maxTile = Math.max(maxTile, grid[r][c]);
          }
        }
      }
      
      status.set(face, {tileCount, maxTile});
    }
    
    return status;
  }

  // Test helper method
  public setTileForTesting(face: CubeFace, row: number, col: number, value: number): void {
    const grid = this.faces.get(face)!;
    grid[row][col] = value;
  }
  
  // Validation methods
  public validateGameState(): boolean {
    let isValid = true;
    
    // Check each face has a valid grid
    for (const [face, grid] of this.faces) {
      if (!grid || grid.length !== 4 || grid[0].length !== 4) {
        console.error(`Invalid grid structure for ${face}`);
        isValid = false;
      }
      
      // Count tiles
      let tileCount = 0;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] > 0) tileCount++;
        }
      }
      
      console.log(`${face}: ${tileCount} tiles`);
    }
    
    return isValid;
  }
  
  public canAnyFaceMove(direction: SwipeDirection): boolean {
    for (const face of Object.values(CubeFace)) {
      const grid = this.faces.get(face as CubeFace)!;
      if (this.canFaceMove(grid, direction)) {
        return true;
      }
    }
    return false;
  }
  
  private canFaceMove(grid: number[][], direction: SwipeDirection): boolean {
    // Check if any tile can move in the given direction
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (grid[row][col] === 0) continue;
        
        // Check if this tile can move
        if (this.canTileMove(grid, row, col, direction)) {
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