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
  fromFace: CubeFace;
  toFace: CubeFace;
  fromPos: [number, number];
  toPos: [number, number];
  value: number;
  merged: boolean;
  crossFace?: boolean;
}

export interface CubeRotation {
  axis: 'x' | 'y';
  angle: number;
  direction: SwipeDirection;
}

export class CubeGameV3Fixed {
  private faces: Map<CubeFace, number[][]> = new Map();
  private score: number = 0;
  private moveHistory: TileMovement[] = [];
  private currentFrontFace: CubeFace = CubeFace.FRONT;
  
  constructor() {
    this.initializeFaces();
    // Add initial tiles to ALL faces
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
    // Add 2 random tiles to each face for a proper 6-sided game
    Object.values(CubeFace).forEach(face => {
      this.addRandomTilesToFace(face as CubeFace, 2);
    });
  }

  private addRandomTilesToFace(face: CubeFace, count: number): void {
    const grid = this.faces.get(face)!;
    const availablePositions: Array<{row: number, col: number}> = [];
    
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) {
          availablePositions.push({row: r, col: c});
        }
      }
    }

    for (let i = 0; i < Math.min(count, availablePositions.length); i++) {
      const idx = Math.floor(Math.random() * availablePositions.length);
      const pos = availablePositions.splice(idx, 1)[0];
      grid[pos.row][pos.col] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  public move(direction: SwipeDirection): { moved: boolean; rotation?: CubeRotation } {
    this.moveHistory = [];
    let totalMoved = false;

    // First, move tiles within each face in the swipe direction
    Object.values(CubeFace).forEach(face => {
      const movements = this.moveTilesInFace(face as CubeFace, direction);
      if (movements.length > 0) {
        totalMoved = true;
        this.moveHistory.push(...movements);
      }
    });

    // Then handle cross-face movements based on direction
    const crossFaceMovements = this.handleCrossFaceMovements(direction);
    if (crossFaceMovements.length > 0) {
      totalMoved = true;
      this.moveHistory.push(...crossFaceMovements);
    }

    if (totalMoved) {
      // Add a new tile to the current front face
      this.addRandomTilesToFace(this.currentFrontFace, 1);
      
      // Calculate rotation
      const rotation = this.getRotationForSwipe(direction);
      
      // Update current front face after rotation
      this.updateFrontFace(direction);
      
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
              fromFace: face,
              toFace: face,
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
              fromFace: face,
              toFace: face,
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
              fromFace: face,
              toFace: face,
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
              fromFace: face,
              toFace: face,
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

  private handleCrossFaceMovements(direction: SwipeDirection): TileMovement[] {
    const movements: TileMovement[] = [];
    
    // Handle edge tiles that can move to adjacent faces
    if (direction === SwipeDirection.LEFT) {
      // Tiles on left edge of FRONT can move to right edge of LEFT
      this.transferEdgeTiles(CubeFace.FRONT, CubeFace.LEFT, 'left', 'right', movements);
      this.transferEdgeTiles(CubeFace.RIGHT, CubeFace.FRONT, 'left', 'right', movements);
      this.transferEdgeTiles(CubeFace.BACK, CubeFace.RIGHT, 'left', 'right', movements);
      this.transferEdgeTiles(CubeFace.LEFT, CubeFace.BACK, 'left', 'right', movements);
    } else if (direction === SwipeDirection.RIGHT) {
      // Tiles on right edge can move to left edge of next face
      this.transferEdgeTiles(CubeFace.FRONT, CubeFace.RIGHT, 'right', 'left', movements);
      this.transferEdgeTiles(CubeFace.LEFT, CubeFace.FRONT, 'right', 'left', movements);
      this.transferEdgeTiles(CubeFace.BACK, CubeFace.LEFT, 'right', 'left', movements);
      this.transferEdgeTiles(CubeFace.RIGHT, CubeFace.BACK, 'right', 'left', movements);
    } else if (direction === SwipeDirection.UP) {
      // Tiles on top edge can move to bottom edge of face above
      this.transferEdgeTiles(CubeFace.FRONT, CubeFace.TOP, 'top', 'bottom', movements);
      this.transferEdgeTiles(CubeFace.BOTTOM, CubeFace.FRONT, 'top', 'bottom', movements);
      this.transferEdgeTiles(CubeFace.BACK, CubeFace.BOTTOM, 'top', 'bottom', movements);
      this.transferEdgeTiles(CubeFace.TOP, CubeFace.BACK, 'top', 'bottom', movements);
    } else { // DOWN
      // Tiles on bottom edge can move to top edge of face below
      this.transferEdgeTiles(CubeFace.FRONT, CubeFace.BOTTOM, 'bottom', 'top', movements);
      this.transferEdgeTiles(CubeFace.TOP, CubeFace.FRONT, 'bottom', 'top', movements);
      this.transferEdgeTiles(CubeFace.BACK, CubeFace.TOP, 'bottom', 'top', movements);
      this.transferEdgeTiles(CubeFace.BOTTOM, CubeFace.BACK, 'bottom', 'top', movements);
    }
    
    return movements;
  }

  private transferEdgeTiles(
    fromFace: CubeFace, 
    toFace: CubeFace, 
    fromEdge: 'top' | 'bottom' | 'left' | 'right',
    toEdge: 'top' | 'bottom' | 'left' | 'right',
    movements: TileMovement[]
  ): void {
    const fromGrid = this.faces.get(fromFace)!;
    const toGrid = this.faces.get(toFace)!;
    
    // Get edge positions
    const fromPositions = this.getEdgePositions(fromEdge);
    const toPositions = this.getEdgePositions(toEdge);
    
    // Check if there's room to transfer
    for (let i = 0; i < 4; i++) {
      const fromPos = fromPositions[i];
      const toPos = toPositions[i];
      
      if (fromGrid[fromPos[0]][fromPos[1]] > 0 && toGrid[toPos[0]][toPos[1]] === 0) {
        // Transfer tile
        toGrid[toPos[0]][toPos[1]] = fromGrid[fromPos[0]][fromPos[1]];
        fromGrid[fromPos[0]][fromPos[1]] = 0;
        
        movements.push({
          fromFace,
          toFace,
          fromPos,
          toPos,
          value: toGrid[toPos[0]][toPos[1]],
          merged: false,
          crossFace: true
        });
      }
    }
  }

  private getEdgePositions(edge: 'top' | 'bottom' | 'left' | 'right'): Array<[number, number]> {
    switch (edge) {
      case 'top': return [[0, 0], [0, 1], [0, 2], [0, 3]];
      case 'bottom': return [[3, 0], [3, 1], [3, 2], [3, 3]];
      case 'left': return [[0, 0], [1, 0], [2, 0], [3, 0]];
      case 'right': return [[0, 3], [1, 3], [2, 3], [3, 3]];
    }
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

  private getRotationForSwipe(direction: SwipeDirection): CubeRotation {
    // Rotate cube in the same direction as swipe
    switch (direction) {
      case SwipeDirection.LEFT:
        return { axis: 'y', angle: 90, direction };
      case SwipeDirection.RIGHT:
        return { axis: 'y', angle: -90, direction };
      case SwipeDirection.UP:
        return { axis: 'x', angle: -90, direction };
      case SwipeDirection.DOWN:
        return { axis: 'x', angle: 90, direction };
    }
  }

  private updateFrontFace(direction: SwipeDirection): void {
    // Update which face is front after rotation
    const transitions: Record<CubeFace, Record<SwipeDirection, CubeFace>> = {
      [CubeFace.FRONT]: {
        [SwipeDirection.LEFT]: CubeFace.RIGHT,
        [SwipeDirection.RIGHT]: CubeFace.LEFT,
        [SwipeDirection.UP]: CubeFace.BOTTOM,
        [SwipeDirection.DOWN]: CubeFace.TOP
      },
      [CubeFace.LEFT]: {
        [SwipeDirection.LEFT]: CubeFace.FRONT,
        [SwipeDirection.RIGHT]: CubeFace.BACK,
        [SwipeDirection.UP]: CubeFace.LEFT,  // Stays same on vertical rotation
        [SwipeDirection.DOWN]: CubeFace.LEFT
      },
      [CubeFace.RIGHT]: {
        [SwipeDirection.LEFT]: CubeFace.BACK,
        [SwipeDirection.RIGHT]: CubeFace.FRONT,
        [SwipeDirection.UP]: CubeFace.RIGHT,  // Stays same on vertical rotation
        [SwipeDirection.DOWN]: CubeFace.RIGHT
      },
      [CubeFace.BACK]: {
        [SwipeDirection.LEFT]: CubeFace.LEFT,
        [SwipeDirection.RIGHT]: CubeFace.RIGHT,
        [SwipeDirection.UP]: CubeFace.TOP,
        [SwipeDirection.DOWN]: CubeFace.BOTTOM
      },
      [CubeFace.TOP]: {
        [SwipeDirection.LEFT]: CubeFace.TOP,  // Stays same on horizontal rotation
        [SwipeDirection.RIGHT]: CubeFace.TOP,
        [SwipeDirection.UP]: CubeFace.BACK,
        [SwipeDirection.DOWN]: CubeFace.FRONT
      },
      [CubeFace.BOTTOM]: {
        [SwipeDirection.LEFT]: CubeFace.BOTTOM,  // Stays same on horizontal rotation
        [SwipeDirection.RIGHT]: CubeFace.BOTTOM,
        [SwipeDirection.UP]: CubeFace.FRONT,
        [SwipeDirection.DOWN]: CubeFace.BACK
      }
    };
    
    this.currentFrontFace = transitions[this.currentFrontFace][direction];
  }

  public getCurrentFrontFace(): CubeFace {
    return this.currentFrontFace;
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
    // Check if any moves are possible on any face
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
    for (const [_, grid] of this.faces) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] >= 2048) return true;
        }
      }
    }
    return false;
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
}