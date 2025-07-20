import { describe, it, expect } from 'vitest';
import { GameBoard, Direction } from '../src/game/GameBoard';

describe('GameBoard', () => {
  it('should initialize a 4x4 board', () => {
    const board = new GameBoard();
    expect(board.size).toBe(4);
    expect(board.grid.length).toBe(4);
    expect(board.grid[0].length).toBe(4);
  });

  it('should start with two tiles', () => {
    const board = new GameBoard();
    const tileCount = board.grid.flat().filter(tile => tile !== 0).length;
    expect(tileCount).toBe(2);
  });

  it('should move tiles left', () => {
    const board = new GameBoard();
    board.grid = [
      [2, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    board.move(Direction.LEFT);
    expect(board.grid[0]).toEqual([4, 0, 0, 0]);
  });

  it('should move tiles right', () => {
    const board = new GameBoard();
    board.grid = [
      [2, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    board.move(Direction.RIGHT);
    expect(board.grid[0]).toEqual([0, 0, 0, 4]);
  });

  it('should move tiles up', () => {
    const board = new GameBoard();
    board.grid = [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    board.move(Direction.UP);
    expect(board.grid[0][0]).toBe(4);
    expect(board.grid[1][0]).toBe(0);
  });

  it('should move tiles down', () => {
    const board = new GameBoard();
    board.grid = [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    board.move(Direction.DOWN);
    expect(board.grid[3][0]).toBe(4);
    expect(board.grid[2][0]).toBe(0);
  });

  it('should detect game over', () => {
    const board = new GameBoard();
    board.grid = [
      [2, 4, 8, 16],
      [4, 8, 16, 2],
      [8, 16, 2, 4],
      [16, 2, 4, 8]
    ];
    expect(board.isGameOver()).toBe(true);
  });

  it('should detect win condition (2048)', () => {
    const board = new GameBoard();
    board.grid = [
      [2048, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    expect(board.hasWon()).toBe(true);
  });

  it('should calculate score correctly', () => {
    const board = new GameBoard();
    board.grid = [
      [2, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    board.move(Direction.LEFT);
    expect(board.score).toBe(4);
  });
});