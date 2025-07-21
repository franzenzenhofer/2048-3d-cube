import { SwipeDirection } from './CubeGame';
import { CubeRotationSystem } from './CubeRotationSystem';

export enum CubeFace {
  FRONT = 'FRONT',
  BACK = 'BACK', 
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM'
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
}

export class CubeGameV3Fixed {
  private faces: Map<CubeFace, number[][]> = new Map();
  private score: number = 0;
  private activeFace: CubeFace = CubeFace.FRONT;
  private moveHistory: TileMovement[] = [];
  private hasWonFlag: boolean = false;
  private rotationSystem: CubeRotationSystem = new CubeRotationSystem();

  constructor() {
    // Initialize all 6 faces
    Object.values(CubeFace).forEach(face => {
      this.faces.set(face as CubeFace, this.createEmptyGrid());
    });
    
    // Start game with tiles on each face
    this.initializeAllFaces();
  }

  private createEmptyGrid(): number[][] {
    return Array(4).fill(null).map(() => Array(4).fill(0));
  }

  private initializeAllFaces(): void {
    // Add 2 random tiles to each face
    Object.values(CubeFace).forEach(face => {
      this.addRandomTile(face as CubeFace);
      this.addRandomTile(face as CubeFace);
    });
  }

  private addRandomTile(face: CubeFace): boolean {
    const grid = this.faces.get(face)!;
    const emptyCells: Array<[number, number]> = [];
    
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) {
          emptyCells.push([r, c]);
        }
      }
    }
    
    if (emptyCells.length === 0) return false;
    
    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    console.log(`Added tile ${grid[row][col]} to ${face} at [${row},${col}]`);
    return true;
  }

  public move(direction: SwipeDirection): { moved: boolean; rotation?: CubeRotation } {
    this.moveHistory = [];
    let anyFaceMoved = false;
    
    // Move tiles on ALL 6 faces simultaneously!
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
    
    let rotation: CubeRotation | undefined;
    
    if (anyFaceMoved) {
      // Add new tile to EVERY face after movement
      Object.values(CubeFace).forEach(face => {
        this.addRandomTile(face as CubeFace);
      });
      
      // Calculate rotation - rotate to show the next face in swipe direction
      const nextFace = this.getOppositeFace(direction);
      this.activeFace = nextFace;
      
      // Set the forward facing programmatically
      this.rotationSystem.forwardFacing(nextFace);
      
      rotation = this.getRotationForTransition(this.activeFace, nextFace, direction);
    }
    
    return { moved: anyFaceMoved, rotation };
  }


  public getScore(): number {
    return this.score;
  }

  public getActiveFace(): CubeFace {
    return this.activeFace;
  }

  public getFaceGrid(face: CubeFace): number[][] {
    return this.faces.get(face)!;
  }

  public getMoveHistory(): TileMovement[] {
    return this.moveHistory;
  }

  private moveTilesInFace(face: CubeFace, direction: SwipeDirection): TileMovement[] {
    const grid = this.faces.get(face)!;
    const newGrid = grid.map(row => [...row]); // Start with current state
    const movements: TileMovement[] = [];
    let changed = false;
    
    if (direction === SwipeDirection.LEFT) {
      // Process each row
      for (let row = 0; row < 4; row++) {
        const mergedThisMove = new Set<number>(); // Track which positions have merged
        
        // Move tiles from left to right
        for (let col = 1; col < 4; col++) {
          if (newGrid[row][col] === 0) continue; // Skip empty cells
          
          let currentCol = col;
          let targetCol = col;
          
          // Find how far this tile can slide left
          while (targetCol > 0) {
            const leftCol = targetCol - 1;
            const leftValue = newGrid[row][leftCol];
            
            if (leftValue === 0) {
              // Can slide to empty space
              targetCol = leftCol;
            } else if (leftValue === newGrid[row][currentCol] && !mergedThisMove.has(leftCol)) {
              // Can merge with same value (but only if that tile hasn't merged already)
              targetCol = leftCol;
              break; // Stop here - this will be a merge
            } else {
              // Blocked by different value or already-merged tile
              break;
            }
          }
          
          // Move the tile if needed
          if (targetCol !== col) {
            const value = newGrid[row][col];
            const willMerge = newGrid[row][targetCol] === value;
            
            if (willMerge) {
              newGrid[row][targetCol] *= 2;
              this.score += newGrid[row][targetCol];
              mergedThisMove.add(targetCol);
            } else {
              newGrid[row][targetCol] = value;
            }
            newGrid[row][col] = 0;
            
            changed = true;
            movements.push({
              fromPos: [row, col],
              toPos: [row, targetCol],
              value: willMerge ? value * 2 : value,
              merged: willMerge
            });
          }
        }
      }
    } else if (direction === SwipeDirection.RIGHT) {
      // Process each row
      for (let row = 0; row < 4; row++) {
        const mergedThisMove = new Set<number>();
        
        // Move tiles from right to left (process from right side)
        for (let col = 2; col >= 0; col--) {
          if (newGrid[row][col] === 0) continue;
          
          let currentCol = col;
          let targetCol = col;
          
          // Find how far this tile can slide right
          while (targetCol < 3) {
            const rightCol = targetCol + 1;
            const rightValue = newGrid[row][rightCol];
            
            if (rightValue === 0) {
              targetCol = rightCol;
            } else if (rightValue === newGrid[row][currentCol] && !mergedThisMove.has(rightCol)) {
              targetCol = rightCol;
              break;
            } else {
              break;
            }
          }
          
          if (targetCol !== col) {
            const value = newGrid[row][col];
            const willMerge = newGrid[row][targetCol] === value;
            
            if (willMerge) {
              newGrid[row][targetCol] *= 2;
              this.score += newGrid[row][targetCol];
              mergedThisMove.add(targetCol);
            } else {
              newGrid[row][targetCol] = value;
            }
            newGrid[row][col] = 0;
            
            changed = true;
            movements.push({
              fromPos: [row, col],
              toPos: [row, targetCol],
              value: willMerge ? value * 2 : value,
              merged: willMerge
            });
          }
        }
      }
    } else if (direction === SwipeDirection.UP) {
      // Process each column
      for (let col = 0; col < 4; col++) {
        const mergedThisMove = new Set<number>();
        
        // Move tiles from top to bottom
        for (let row = 1; row < 4; row++) {
          if (newGrid[row][col] === 0) continue;
          
          let currentRow = row;
          let targetRow = row;
          
          // Find how far this tile can slide up
          while (targetRow > 0) {
            const upRow = targetRow - 1;
            const upValue = newGrid[upRow][col];
            
            if (upValue === 0) {
              targetRow = upRow;
            } else if (upValue === newGrid[currentRow][col] && !mergedThisMove.has(upRow)) {
              targetRow = upRow;
              break;
            } else {
              break;
            }
          }
          
          if (targetRow !== row) {
            const value = newGrid[row][col];
            const willMerge = newGrid[targetRow][col] === value;
            
            if (willMerge) {
              newGrid[targetRow][col] *= 2;
              this.score += newGrid[targetRow][col];
              mergedThisMove.add(targetRow);
            } else {
              newGrid[targetRow][col] = value;
            }
            newGrid[row][col] = 0;
            
            changed = true;
            movements.push({
              fromPos: [row, col],
              toPos: [targetRow, col],
              value: willMerge ? value * 2 : value,
              merged: willMerge
            });
          }
        }
      }
    } else { // DOWN
      // Process each column
      for (let col = 0; col < 4; col++) {
        const mergedThisMove = new Set<number>();
        
        // Move tiles from bottom to top (process from bottom)
        for (let row = 2; row >= 0; row--) {
          if (newGrid[row][col] === 0) continue;
          
          let currentRow = row;
          let targetRow = row;
          
          // Find how far this tile can slide down
          while (targetRow < 3) {
            const downRow = targetRow + 1;
            const downValue = newGrid[downRow][col];
            
            if (downValue === 0) {
              targetRow = downRow;
            } else if (downValue === newGrid[currentRow][col] && !mergedThisMove.has(downRow)) {
              targetRow = downRow;
              break;
            } else {
              break;
            }
          }
          
          if (targetRow !== row) {
            const value = newGrid[row][col];
            const willMerge = newGrid[targetRow][col] === value;
            
            if (willMerge) {
              newGrid[targetRow][col] *= 2;
              this.score += newGrid[targetRow][col];
              mergedThisMove.add(targetRow);
            } else {
              newGrid[targetRow][col] = value;
            }
            newGrid[row][col] = 0;
            
            changed = true;
            movements.push({
              fromPos: [row, col],
              toPos: [targetRow, col],
              value: willMerge ? value * 2 : value,
              merged: willMerge
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

  private getOppositeFace(direction: SwipeDirection): CubeFace {
    // Use the rotation system to get the next face
    return this.rotationSystem.getAdjacentFaces()[direction];
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
        angle = -90;  // Rotate cube up to show top face
        break;
      case SwipeDirection.DOWN:
        axis = 'x';
        angle = 90;   // Rotate cube down to show bottom face
        break;
    }
    
    return { axis, angle };
  }

  public isGameOver(): boolean {
    // Check if any face can move in any direction
    for (const face of Object.values(CubeFace)) {
      const grid = this.faces.get(face as CubeFace)!;
      
      // Check for empty cells
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] === 0) return false;
        }
      }
      
      // Check for possible merges
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
          if (grid[r][c] === grid[r][c + 1]) return false;
        }
      }
      
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] === grid[r + 1][c]) return false;
        }
      }
    }
    
    return true;
  }

  public hasWon(): boolean {
    if (this.hasWonFlag) return true;
    
    // Check all faces for 2048
    for (const [_, grid] of this.faces) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] >= 2048) {
            this.hasWonFlag = true;
            return true;
          }
        }
      }
    }
    return false;
  }

  public forwardFacing(face: CubeFace): void {
    this.activeFace = face;
    this.rotationSystem.forwardFacing(face);
  }

  // Check if face is unlocked (has at least one tile >= 512)
  public isFaceUnlocked(face: CubeFace): boolean {
    if (face === CubeFace.FRONT) return true; // Front is always unlocked
    
    const grid = this.faces.get(face)!;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] >= 512) {
          return true;
        }
      }
    }
    return false;
  }

  public canRotateToFace(face: CubeFace): boolean {
    // For now, allow rotation to any face during development
    return true;
  }

  public hasAnyUnlockedFaces(): boolean {
    for (const face of Object.values(CubeFace)) {
      if (face !== CubeFace.FRONT && this.isFaceUnlocked(face as CubeFace)) {
        return true;
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

  // Test helper to move without spawning new tiles
  public moveWithoutSpawn(direction: SwipeDirection): { moved: boolean; gridStates: Map<CubeFace, number[][]> } {
    const gridStates = new Map<CubeFace, number[][]>();
    
    this.moveHistory = [];
    let anyFaceMoved = false;
    
    // Move tiles on ALL 6 faces simultaneously!
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
    
    // Capture grid states after move but before spawn
    Object.values(CubeFace).forEach(face => {
      const grid = this.faces.get(face as CubeFace)!;
      gridStates.set(face as CubeFace, grid.map(row => [...row]));
    });
    
    return { moved: anyFaceMoved, gridStates };
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
        if (col > 0) {
          return grid[row][col - 1] === 0 || grid[row][col - 1] === value;
        }
        break;
      case SwipeDirection.RIGHT:
        if (col < 3) {
          return grid[row][col + 1] === 0 || grid[row][col + 1] === value;
        }
        break;
      case SwipeDirection.UP:
        if (row > 0) {
          return grid[row - 1][col] === 0 || grid[row - 1][col] === value;
        }
        break;
      case SwipeDirection.DOWN:
        if (row < 3) {
          return grid[row + 1][col] === 0 || grid[row + 1][col] === value;
        }
        break;
    }
    
    return false;
  }
}