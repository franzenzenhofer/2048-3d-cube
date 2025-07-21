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

interface FaceTransition {
  from: CubeFace;
  to: CubeFace;
  fromEdge: 'top' | 'bottom' | 'left' | 'right';
  toEdge: 'top' | 'bottom' | 'left' | 'right';
  transform: (row: number, col: number) => [number, number];
}

export interface TileMovement {
  fromFace: CubeFace;
  toFace: CubeFace;
  fromPos: [number, number];
  toPos: [number, number];
  value: number;
  merged: boolean;
}

export class CubeGame {
  private faces: Map<CubeFace, number[][]> = new Map();
  private score: number = 0;
  private unlockedFaces: Set<CubeFace> = new Set([CubeFace.FRONT, CubeFace.LEFT, CubeFace.RIGHT]);
  private moveHistory: TileMovement[] = [];
  
  // Face adjacency mapping
  private readonly transitions: FaceTransition[] = [
    // Front face transitions
    { from: CubeFace.FRONT, to: CubeFace.LEFT, fromEdge: 'left', toEdge: 'right', 
      transform: (r, c) => [r, 3] },
    { from: CubeFace.FRONT, to: CubeFace.RIGHT, fromEdge: 'right', toEdge: 'left',
      transform: (r, c) => [r, 0] },
    { from: CubeFace.FRONT, to: CubeFace.TOP, fromEdge: 'top', toEdge: 'bottom',
      transform: (r, c) => [3, c] },
    { from: CubeFace.FRONT, to: CubeFace.BOTTOM, fromEdge: 'bottom', toEdge: 'top',
      transform: (r, c) => [0, c] },
    
    // Left face transitions
    { from: CubeFace.LEFT, to: CubeFace.BACK, fromEdge: 'left', toEdge: 'right',
      transform: (r, c) => [r, 3] },
    { from: CubeFace.LEFT, to: CubeFace.FRONT, fromEdge: 'right', toEdge: 'left',
      transform: (r, c) => [r, 0] },
    { from: CubeFace.LEFT, to: CubeFace.TOP, fromEdge: 'top', toEdge: 'left',
      transform: (r, c) => [c, 0] },
    { from: CubeFace.LEFT, to: CubeFace.BOTTOM, fromEdge: 'bottom', toEdge: 'left',
      transform: (r, c) => [3 - c, 0] },
    
    // Right face transitions
    { from: CubeFace.RIGHT, to: CubeFace.FRONT, fromEdge: 'left', toEdge: 'right',
      transform: (r, c) => [r, 3] },
    { from: CubeFace.RIGHT, to: CubeFace.BACK, fromEdge: 'right', toEdge: 'left',
      transform: (r, c) => [r, 0] },
    { from: CubeFace.RIGHT, to: CubeFace.TOP, fromEdge: 'top', toEdge: 'right',
      transform: (r, c) => [3 - c, 3] },
    { from: CubeFace.RIGHT, to: CubeFace.BOTTOM, fromEdge: 'bottom', toEdge: 'right',
      transform: (r, c) => [c, 3] },
    
    // Top face transitions  
    { from: CubeFace.TOP, to: CubeFace.FRONT, fromEdge: 'bottom', toEdge: 'top',
      transform: (r, c) => [0, c] },
    { from: CubeFace.TOP, to: CubeFace.BACK, fromEdge: 'top', toEdge: 'top',
      transform: (r, c) => [0, 3 - c] },
    { from: CubeFace.TOP, to: CubeFace.LEFT, fromEdge: 'left', toEdge: 'top',
      transform: (r, c) => [0, r] },
    { from: CubeFace.TOP, to: CubeFace.RIGHT, fromEdge: 'right', toEdge: 'top',
      transform: (r, c) => [0, 3 - r] },
    
    // Bottom face transitions
    { from: CubeFace.BOTTOM, to: CubeFace.FRONT, fromEdge: 'top', toEdge: 'bottom',
      transform: (r, c) => [3, c] },
    { from: CubeFace.BOTTOM, to: CubeFace.BACK, fromEdge: 'bottom', toEdge: 'bottom',
      transform: (r, c) => [3, 3 - c] },
    { from: CubeFace.BOTTOM, to: CubeFace.LEFT, fromEdge: 'left', toEdge: 'bottom',
      transform: (r, c) => [3, 3 - r] },
    { from: CubeFace.BOTTOM, to: CubeFace.RIGHT, fromEdge: 'right', toEdge: 'bottom',
      transform: (r, c) => [3, r] },
    
    // Back face transitions
    { from: CubeFace.BACK, to: CubeFace.RIGHT, fromEdge: 'left', toEdge: 'right',
      transform: (r, c) => [r, 3] },
    { from: CubeFace.BACK, to: CubeFace.LEFT, fromEdge: 'right', toEdge: 'left',
      transform: (r, c) => [r, 0] },
    { from: CubeFace.BACK, to: CubeFace.TOP, fromEdge: 'top', toEdge: 'top',
      transform: (r, c) => [0, 3 - c] },
    { from: CubeFace.BACK, to: CubeFace.BOTTOM, fromEdge: 'bottom', toEdge: 'bottom',
      transform: (r, c) => [3, 3 - c] },
  ];

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

  private addRandomTiles(count: number): void {
    const availablePositions: Array<{face: CubeFace, row: number, col: number}> = [];
    
    this.unlockedFaces.forEach(face => {
      const grid = this.faces.get(face)!;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] === 0) {
            availablePositions.push({face, row: r, col: c});
          }
        }
      }
    });

    for (let i = 0; i < Math.min(count, availablePositions.length); i++) {
      const idx = Math.floor(Math.random() * availablePositions.length);
      const pos = availablePositions.splice(idx, 1)[0];
      const grid = this.faces.get(pos.face)!;
      grid[pos.row][pos.col] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  public move(direction: SwipeDirection): boolean {
    this.moveHistory = [];
    let moved = false;

    // Process each unlocked face
    this.unlockedFaces.forEach(face => {
      const movements = this.processFaceMovement(face, direction);
      if (movements.length > 0) {
        moved = true;
        this.moveHistory.push(...movements);
      }
    });

    if (moved) {
      this.addRandomTiles(1);
      this.checkUnlocks();
    }

    return moved;
  }

  private processFaceMovement(face: CubeFace, direction: SwipeDirection): TileMovement[] {
    const grid = this.faces.get(face)!;
    const movements: TileMovement[] = [];
    const newGrid = this.createEmptyGrid();
    
    // Determine movement vectors based on direction
    const vectors = this.getMovementVectors(direction);
    
    // Process each line in movement direction
    for (let line = 0; line < 4; line++) {
      const tiles: Array<{value: number, pos: [number, number]}> = [];
      
      // Collect tiles in the line
      for (let i = 0; i < 4; i++) {
        const [r, c] = this.getPositionInLine(line, i, direction);
        if (grid[r][c] !== 0) {
          tiles.push({value: grid[r][c], pos: [r, c]});
        }
      }
      
      // Process merges and movements
      const processed = this.processTileLine(tiles);
      
      // Place tiles in new positions
      processed.forEach((tile, idx) => {
        const [newR, newC] = this.getPositionInLine(line, idx, direction);
        
        if (idx < 4) {
          // Tile stays on same face
          newGrid[newR][newC] = tile.value;
          if (tile.pos[0] !== newR || tile.pos[1] !== newC) {
            movements.push({
              fromFace: face,
              toFace: face,
              fromPos: tile.pos,
              toPos: [newR, newC],
              value: tile.value,
              merged: tile.merged || false
            });
          }
        } else {
          // Tile moves to adjacent face
          const transition = this.findTransition(face, direction, line);
          if (transition && this.unlockedFaces.has(transition.to)) {
            const [transR, transC] = transition.transform(line, idx - 4);
            const targetGrid = this.faces.get(transition.to)!;
            targetGrid[transR][transC] = tile.value;
            
            movements.push({
              fromFace: face,
              toFace: transition.to,
              fromPos: tile.pos,
              toPos: [transR, transC],
              value: tile.value,
              merged: false
            });
          }
        }
      });
    }
    
    // Update face grid
    this.faces.set(face, newGrid);
    return movements;
  }

  private getMovementVectors(direction: SwipeDirection): {dr: number, dc: number} {
    switch (direction) {
      case SwipeDirection.LEFT: return {dr: 0, dc: -1};
      case SwipeDirection.RIGHT: return {dr: 0, dc: 1};
      case SwipeDirection.UP: return {dr: -1, dc: 0};
      case SwipeDirection.DOWN: return {dr: 1, dc: 0};
    }
  }

  private getPositionInLine(line: number, index: number, direction: SwipeDirection): [number, number] {
    switch (direction) {
      case SwipeDirection.LEFT:
      case SwipeDirection.RIGHT:
        return [line, index];
      case SwipeDirection.UP:
      case SwipeDirection.DOWN:
        return [index, line];
    }
  }

  private processTileLine(tiles: Array<{value: number, pos: [number, number]}>): 
    Array<{value: number, pos: [number, number], merged?: boolean}> {
    const result: Array<{value: number, pos: [number, number], merged?: boolean}> = [];
    
    for (let i = 0; i < tiles.length; i++) {
      if (i < tiles.length - 1 && tiles[i].value === tiles[i + 1].value) {
        const mergedValue = tiles[i].value * 2;
        result.push({
          value: mergedValue,
          pos: tiles[i].pos,
          merged: true
        });
        this.score += mergedValue;
        i++; // Skip next tile
      } else {
        result.push(tiles[i]);
      }
    }
    
    return result;
  }

  private findTransition(face: CubeFace, direction: SwipeDirection, line: number): FaceTransition | null {
    const edge = this.getEdgeFromDirection(direction);
    return this.transitions.find(t => t.from === face && t.fromEdge === edge) || null;
  }

  private getEdgeFromDirection(direction: SwipeDirection): 'top' | 'bottom' | 'left' | 'right' {
    switch (direction) {
      case SwipeDirection.LEFT: return 'left';
      case SwipeDirection.RIGHT: return 'right';
      case SwipeDirection.UP: return 'top';
      case SwipeDirection.DOWN: return 'bottom';
    }
  }

  private checkUnlocks(): void {
    if (this.score >= 512 && !this.unlockedFaces.has(CubeFace.TOP)) {
      this.unlockedFaces.add(CubeFace.TOP);
    }
    if (this.score >= 2048 && !this.unlockedFaces.has(CubeFace.BOTTOM)) {
      this.unlockedFaces.add(CubeFace.BOTTOM);
    }
    if (this.score >= 8192 && !this.unlockedFaces.has(CubeFace.BACK)) {
      this.unlockedFaces.add(CubeFace.BACK);
    }
  }

  public getOptimalViewAngle(): {x: number, y: number} {
    // Calculate optimal viewing angle based on recent movements
    const affectedFaces = new Set(this.moveHistory.map(m => m.toFace));
    
    if (affectedFaces.has(CubeFace.TOP) || affectedFaces.has(CubeFace.BOTTOM)) {
      return {x: -30, y: 45};
    } else if (affectedFaces.has(CubeFace.LEFT) && affectedFaces.has(CubeFace.RIGHT)) {
      return {x: -20, y: 0};
    } else if (affectedFaces.has(CubeFace.LEFT)) {
      return {x: -20, y: -45};
    } else if (affectedFaces.has(CubeFace.RIGHT)) {
      return {x: -20, y: 45};
    }
    
    return {x: -25, y: 30}; // Default isometric view
  }

  public getFaceGrid(face: CubeFace): number[][] {
    return this.faces.get(face) || this.createEmptyGrid();
  }

  public getScore(): number {
    return this.score;
  }

  public getUnlockedFaces(): CubeFace[] {
    return Array.from(this.unlockedFaces);
  }

  public getMoveHistory(): TileMovement[] {
    return this.moveHistory;
  }

  public isGameOver(): boolean {
    // Check if any moves are possible
    for (const face of this.unlockedFaces) {
      const grid = this.faces.get(face)!;
      
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
    for (const face of this.unlockedFaces) {
      const grid = this.faces.get(face)!;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] >= 2048) return true;
        }
      }
    }
    return false;
  }
}