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

// Maps which faces contribute tiles to which face for each swipe direction
const FACE_FLOW_MAP: Record<SwipeDirection, Record<CubeFace, CubeFace>> = {
  [SwipeDirection.LEFT]: {
    [CubeFace.FRONT]: CubeFace.LEFT,
    [CubeFace.RIGHT]: CubeFace.FRONT,
    [CubeFace.BACK]: CubeFace.RIGHT,
    [CubeFace.LEFT]: CubeFace.BACK,
    [CubeFace.TOP]: CubeFace.TOP,
    [CubeFace.BOTTOM]: CubeFace.BOTTOM
  },
  [SwipeDirection.RIGHT]: {
    [CubeFace.FRONT]: CubeFace.RIGHT,
    [CubeFace.LEFT]: CubeFace.FRONT,
    [CubeFace.BACK]: CubeFace.LEFT,
    [CubeFace.RIGHT]: CubeFace.BACK,
    [CubeFace.TOP]: CubeFace.TOP,
    [CubeFace.BOTTOM]: CubeFace.BOTTOM
  },
  [SwipeDirection.UP]: {
    [CubeFace.FRONT]: CubeFace.TOP,
    [CubeFace.TOP]: CubeFace.BACK,
    [CubeFace.BACK]: CubeFace.BOTTOM,
    [CubeFace.BOTTOM]: CubeFace.FRONT,
    [CubeFace.LEFT]: CubeFace.LEFT,
    [CubeFace.RIGHT]: CubeFace.RIGHT
  },
  [SwipeDirection.DOWN]: {
    [CubeFace.FRONT]: CubeFace.BOTTOM,
    [CubeFace.BOTTOM]: CubeFace.BACK,
    [CubeFace.BACK]: CubeFace.TOP,
    [CubeFace.TOP]: CubeFace.FRONT,
    [CubeFace.LEFT]: CubeFace.LEFT,
    [CubeFace.RIGHT]: CubeFace.RIGHT
  }
};

export class CubeGameV3 {
  private faces: Map<CubeFace, number[][]> = new Map();
  private score: number = 0;
  private moveHistory: TileMovement[] = [];
  private currentFrontFace: CubeFace = CubeFace.FRONT;
  
  constructor() {
    this.initializeFaces();
    this.addRandomTiles(2);
  }

  private initializeFaces(): void {
    Object.values(CubeFace).forEach(face => {
      this.faces.set(face as CubeFace, this.createEmptyGrid());
    });
  }

  private createEmptyGrid(): number[][] {
    return Array(4).fill(null).map(() => Array(4).fill(0));
  }

  public move(direction: SwipeDirection): { moved: boolean; rotation?: CubeRotation } {
    this.moveHistory = [];
    const allMovements: TileMovement[] = [];
    
    // Collect all tiles from all faces and move them in the swipe direction
    const tilesPerRow: Map<number, Array<{face: CubeFace, col: number, value: number}>> = new Map();
    const tilesPerCol: Map<number, Array<{face: CubeFace, row: number, value: number}>> = new Map();
    
    // Clear all grids first
    const tempGrids: Map<CubeFace, number[][]> = new Map();
    Object.values(CubeFace).forEach(face => {
      tempGrids.set(face as CubeFace, this.createEmptyGrid());
    });

    if (direction === SwipeDirection.LEFT || direction === SwipeDirection.RIGHT) {
      // Process horizontal movement - all tiles move horizontally across faces
      for (let row = 0; row < 4; row++) {
        const rowTiles: Array<{face: CubeFace, col: number, value: number, originalPos: [number, number]}> = [];
        
        // Collect tiles from all horizontal faces in order
        const faceOrder = direction === SwipeDirection.LEFT ? 
          [CubeFace.RIGHT, CubeFace.FRONT, CubeFace.LEFT, CubeFace.BACK] :
          [CubeFace.LEFT, CubeFace.FRONT, CubeFace.RIGHT, CubeFace.BACK];
          
        faceOrder.forEach(face => {
          const grid = this.faces.get(face)!;
          for (let col = 0; col < 4; col++) {
            if (grid[row][col] > 0) {
              rowTiles.push({
                face,
                col,
                value: grid[row][col],
                originalPos: [row, col]
              });
            }
          }
        });
        
        // Process and merge tiles
        const merged = this.mergeTiles(rowTiles.map(t => t.value), direction === SwipeDirection.LEFT);
        
        // Distribute merged tiles back
        if (direction === SwipeDirection.LEFT) {
          let faceIndex = 0;
          let colIndex = 0;
          
          merged.forEach((tile, i) => {
            while (faceIndex < faceOrder.length && colIndex >= 4) {
              faceIndex++;
              colIndex = 0;
            }
            
            if (faceIndex < faceOrder.length) {
              const targetFace = faceOrder[faceIndex];
              const targetGrid = tempGrids.get(targetFace)!;
              targetGrid[row][colIndex] = tile.value;
              
              // Track movement
              const originalTile = rowTiles.find((_, idx) => idx === tile.originalIndex);
              if (originalTile) {
                allMovements.push({
                  fromFace: originalTile.face,
                  toFace: targetFace,
                  fromPos: originalTile.originalPos,
                  toPos: [row, colIndex],
                  value: tile.value,
                  merged: tile.merged,
                  crossFace: originalTile.face !== targetFace
                });
              }
              
              colIndex++;
            }
          });
        } else { // RIGHT
          let faceIndex = faceOrder.length - 1;
          let colIndex = 3;
          
          merged.forEach((tile, i) => {
            while (faceIndex >= 0 && colIndex < 0) {
              faceIndex--;
              colIndex = 3;
            }
            
            if (faceIndex >= 0) {
              const targetFace = faceOrder[faceIndex];
              const targetGrid = tempGrids.get(targetFace)!;
              targetGrid[row][colIndex] = tile.value;
              
              // Track movement
              const originalTile = rowTiles.find((_, idx) => idx === tile.originalIndex);
              if (originalTile) {
                allMovements.push({
                  fromFace: originalTile.face,
                  toFace: targetFace,
                  fromPos: originalTile.originalPos,
                  toPos: [row, colIndex],
                  value: tile.value,
                  merged: tile.merged,
                  crossFace: originalTile.face !== targetFace
                });
              }
              
              colIndex--;
            }
          });
        }
      }
    } else { // UP or DOWN
      // Process vertical movement - tiles move vertically across faces
      for (let col = 0; col < 4; col++) {
        const colTiles: Array<{face: CubeFace, row: number, value: number, originalPos: [number, number]}> = [];
        
        // Collect tiles from all vertical faces in order
        const faceOrder = direction === SwipeDirection.UP ?
          [CubeFace.BOTTOM, CubeFace.FRONT, CubeFace.TOP, CubeFace.BACK] :
          [CubeFace.TOP, CubeFace.FRONT, CubeFace.BOTTOM, CubeFace.BACK];
          
        faceOrder.forEach(face => {
          const grid = this.faces.get(face)!;
          const rowOrder = (face === CubeFace.BACK) ? [3, 2, 1, 0] : [0, 1, 2, 3];
          
          rowOrder.forEach(row => {
            const actualCol = (face === CubeFace.BACK) ? 3 - col : col;
            if (grid[row][actualCol] > 0) {
              colTiles.push({
                face,
                row,
                value: grid[row][actualCol],
                originalPos: [row, actualCol]
              });
            }
          });
        });
        
        // Process and merge tiles
        const merged = this.mergeTiles(colTiles.map(t => t.value), direction === SwipeDirection.UP);
        
        // Distribute merged tiles back
        if (direction === SwipeDirection.UP) {
          let tileIndex = 0;
          
          for (let faceIdx = 0; faceIdx < faceOrder.length && tileIndex < merged.length; faceIdx++) {
            const face = faceOrder[faceIdx];
            const targetGrid = tempGrids.get(face)!;
            const rowOrder = (face === CubeFace.BACK) ? [3, 2, 1, 0] : [0, 1, 2, 3];
            
            for (let rowIdx = 0; rowIdx < rowOrder.length && tileIndex < merged.length; rowIdx++) {
              const row = rowOrder[rowIdx];
              const actualCol = (face === CubeFace.BACK) ? 3 - col : col;
              const tile = merged[tileIndex];
              
              targetGrid[row][actualCol] = tile.value;
              
              // Track movement
              const originalTile = colTiles.find((_, idx) => idx === tile.originalIndex);
              if (originalTile) {
                allMovements.push({
                  fromFace: originalTile.face,
                  toFace: face,
                  fromPos: originalTile.originalPos,
                  toPos: [row, actualCol],
                  value: tile.value,
                  merged: tile.merged,
                  crossFace: originalTile.face !== face
                });
              }
              
              tileIndex++;
            }
          }
        } else { // DOWN
          let tileIndex = 0;
          
          for (let faceIdx = 0; faceIdx < faceOrder.length && tileIndex < merged.length; faceIdx++) {
            const face = faceOrder[faceIdx];
            const targetGrid = tempGrids.get(face)!;
            const rowOrder = (face === CubeFace.BACK) ? [0, 1, 2, 3] : [3, 2, 1, 0];
            
            for (let rowIdx = 0; rowIdx < rowOrder.length && tileIndex < merged.length; rowIdx++) {
              const row = rowOrder[rowIdx];
              const actualCol = (face === CubeFace.BACK) ? 3 - col : col;
              const tile = merged[tileIndex];
              
              targetGrid[row][actualCol] = tile.value;
              
              // Track movement
              const originalTile = colTiles.find((_, idx) => idx === tile.originalIndex);
              if (originalTile) {
                allMovements.push({
                  fromFace: originalTile.face,
                  toFace: face,
                  fromPos: originalTile.originalPos,
                  toPos: [row, actualCol],
                  value: tile.value,
                  merged: tile.merged,
                  crossFace: originalTile.face !== face
                });
              }
              
              tileIndex++;
            }
          }
        }
      }
    }
    
    // Check if any movement occurred
    const moved = allMovements.length > 0;
    
    if (moved) {
      // Apply the new grids
      tempGrids.forEach((grid, face) => {
        this.faces.set(face, grid);
      });
      
      this.moveHistory = allMovements;
      this.addRandomTiles(1);
      
      // Calculate rotation
      const rotation = this.getRotationForSwipe(direction);
      
      // Update current front face after rotation
      this.updateFrontFace(direction);
      
      return { moved: true, rotation };
    }
    
    return { moved: false };
  }

  private mergeTiles(tiles: number[], toStart: boolean): Array<{value: number, merged: boolean, originalIndex: number}> {
    if (tiles.length === 0) return [];
    
    const result: Array<{value: number, merged: boolean, originalIndex: number}> = [];
    const processed: Array<{value: number, merged: boolean, originalIndex: number}> = [];
    
    // First pass: merge adjacent equal tiles
    let i = 0;
    while (i < tiles.length) {
      if (i < tiles.length - 1 && tiles[i] === tiles[i + 1]) {
        const mergedValue = tiles[i] * 2;
        processed.push({value: mergedValue, merged: true, originalIndex: i});
        this.score += mergedValue;
        i += 2;
      } else {
        processed.push({value: tiles[i], merged: false, originalIndex: i});
        i++;
      }
    }
    
    return processed;
  }

  private getRotationForSwipe(direction: SwipeDirection): CubeRotation {
    switch (direction) {
      case SwipeDirection.LEFT:
        return { axis: 'y', angle: -90, direction };
      case SwipeDirection.RIGHT:
        return { axis: 'y', angle: 90, direction };
      case SwipeDirection.UP:
        return { axis: 'x', angle: 90, direction };
      case SwipeDirection.DOWN:
        return { axis: 'x', angle: -90, direction };
    }
  }

  private updateFrontFace(direction: SwipeDirection): void {
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
        [SwipeDirection.UP]: CubeFace.BOTTOM,
        [SwipeDirection.DOWN]: CubeFace.TOP
      },
      [CubeFace.RIGHT]: {
        [SwipeDirection.LEFT]: CubeFace.BACK,
        [SwipeDirection.RIGHT]: CubeFace.FRONT,
        [SwipeDirection.UP]: CubeFace.BOTTOM,
        [SwipeDirection.DOWN]: CubeFace.TOP
      },
      [CubeFace.BACK]: {
        [SwipeDirection.LEFT]: CubeFace.LEFT,
        [SwipeDirection.RIGHT]: CubeFace.RIGHT,
        [SwipeDirection.UP]: CubeFace.BOTTOM,
        [SwipeDirection.DOWN]: CubeFace.TOP
      },
      [CubeFace.TOP]: {
        [SwipeDirection.LEFT]: CubeFace.TOP,
        [SwipeDirection.RIGHT]: CubeFace.TOP,
        [SwipeDirection.UP]: CubeFace.BACK,
        [SwipeDirection.DOWN]: CubeFace.FRONT
      },
      [CubeFace.BOTTOM]: {
        [SwipeDirection.LEFT]: CubeFace.BOTTOM,
        [SwipeDirection.RIGHT]: CubeFace.BOTTOM,
        [SwipeDirection.UP]: CubeFace.FRONT,
        [SwipeDirection.DOWN]: CubeFace.BACK
      }
    };
    
    this.currentFrontFace = transitions[this.currentFrontFace][direction];
  }

  private addRandomTiles(count: number): void {
    const availablePositions: Array<{face: CubeFace, row: number, col: number}> = [];
    
    // Only add tiles to the current front face
    const grid = this.faces.get(this.currentFrontFace)!;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) {
          availablePositions.push({face: this.currentFrontFace, row: r, col: c});
        }
      }
    }

    for (let i = 0; i < Math.min(count, availablePositions.length); i++) {
      const idx = Math.floor(Math.random() * availablePositions.length);
      const pos = availablePositions.splice(idx, 1)[0];
      const grid = this.faces.get(pos.face)!;
      grid[pos.row][pos.col] = Math.random() < 0.9 ? 2 : 4;
    }
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
    // Check if any moves are possible
    for (const direction of Object.values(SwipeDirection)) {
      // Create a temporary copy to test
      const testGame = new CubeGameV3();
      testGame.faces = new Map(this.faces);
      testGame.score = this.score;
      testGame.currentFrontFace = this.currentFrontFace;
      
      const result = testGame.move(direction as SwipeDirection);
      if (result.moved) return false;
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
}