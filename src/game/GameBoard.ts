export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export class GameBoard {
  public grid: number[][];
  public score: number = 0;
  public size: number = 4;
  private winValue: number = 2048;

  constructor() {
    this.grid = this.createEmptyGrid();
    this.addRandomTile();
    this.addRandomTile();
  }

  private createEmptyGrid(): number[][] {
    return Array(this.size).fill(null).map(() => Array(this.size).fill(0));
  }

  private getEmptyCells(): [number, number][] {
    const emptyCells: [number, number][] = [];
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.grid[row][col] === 0) {
          emptyCells.push([row, col]);
        }
      }
    }
    return emptyCells;
  }

  private addRandomTile(): void {
    const emptyCells = this.getEmptyCells();
    if (emptyCells.length === 0) return;

    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    this.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
  }

  private slideArray(arr: number[]): { newArray: number[], points: number } {
    const filtered = arr.filter(val => val !== 0);
    let points = 0;
    const merged: number[] = [];
    
    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        merged.push(filtered[i] * 2);
        points += filtered[i] * 2;
        i++;
      } else {
        merged.push(filtered[i]);
      }
    }
    
    while (merged.length < this.size) {
      merged.push(0);
    }
    
    return { newArray: merged, points };
  }

  public move(direction: Direction): boolean {
    let moved = false;
    let scoreIncrease = 0;
    const newGrid = this.grid.map(row => [...row]);

    switch (direction) {
      case Direction.LEFT:
        for (let row = 0; row < this.size; row++) {
          const { newArray, points } = this.slideArray(newGrid[row]);
          if (JSON.stringify(newArray) !== JSON.stringify(newGrid[row])) {
            moved = true;
          }
          newGrid[row] = newArray;
          scoreIncrease += points;
        }
        break;

      case Direction.RIGHT:
        for (let row = 0; row < this.size; row++) {
          const reversed = [...newGrid[row]].reverse();
          const { newArray, points } = this.slideArray(reversed);
          const finalArray = newArray.reverse();
          if (JSON.stringify(finalArray) !== JSON.stringify(newGrid[row])) {
            moved = true;
          }
          newGrid[row] = finalArray;
          scoreIncrease += points;
        }
        break;

      case Direction.UP:
        for (let col = 0; col < this.size; col++) {
          const column = newGrid.map(row => row[col]);
          const { newArray, points } = this.slideArray(column);
          if (JSON.stringify(newArray) !== JSON.stringify(column)) {
            moved = true;
          }
          for (let row = 0; row < this.size; row++) {
            newGrid[row][col] = newArray[row];
          }
          scoreIncrease += points;
        }
        break;

      case Direction.DOWN:
        for (let col = 0; col < this.size; col++) {
          const column = newGrid.map(row => row[col]).reverse();
          const { newArray, points } = this.slideArray(column);
          const finalColumn = newArray.reverse();
          if (JSON.stringify(finalColumn) !== JSON.stringify(newGrid.map(row => row[col]))) {
            moved = true;
          }
          for (let row = 0; row < this.size; row++) {
            newGrid[row][col] = finalColumn[row];
          }
          scoreIncrease += points;
        }
        break;
    }

    if (moved) {
      this.grid = newGrid;
      this.score += scoreIncrease;
      this.addRandomTile();
    }

    return moved;
  }

  public isGameOver(): boolean {
    if (this.getEmptyCells().length > 0) return false;

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const current = this.grid[row][col];
        if (
          (row > 0 && this.grid[row - 1][col] === current) ||
          (row < this.size - 1 && this.grid[row + 1][col] === current) ||
          (col > 0 && this.grid[row][col - 1] === current) ||
          (col < this.size - 1 && this.grid[row][col + 1] === current)
        ) {
          return false;
        }
      }
    }

    return true;
  }

  public hasWon(): boolean {
    return this.grid.flat().some(tile => tile >= this.winValue);
  }

  public reset(): void {
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.addRandomTile();
    this.addRandomTile();
  }
}