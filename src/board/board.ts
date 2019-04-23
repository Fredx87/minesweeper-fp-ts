import { makeBy, updateAt } from "fp-ts/lib/Array";
import { Either, left, right } from "fp-ts/lib/Either";
import {
  fromEither,
  fromLeft,
  IOEither,
  ioEither,
  right as rightIOE
} from "fp-ts/lib/IOEither";
import { none, Option, some } from "fp-ts/lib/Option";
import { randomInt } from "fp-ts/lib/Random";

export interface Board {
  rows: number;
  cols: number;
  minesIndexes: Set<number>;
  flaggedIndexes: Set<number>;
  cellRevealStatus: boolean[];
  adjacentMinesCount: number[];
}

export interface BoardCell {
  row: number;
  col: number;
}

export function boardCell(row: number, col: number): BoardCell {
  return { row, col };
}

export function createEmptyBoard(rows: number, cols: number): Board {
  return {
    rows,
    cols,
    minesIndexes: new Set<number>(),
    flaggedIndexes: new Set<number>(),
    cellRevealStatus: makeBy(rows * cols, () => false),
    adjacentMinesCount: makeBy(rows * cols, () => 0)
  };
}

export function isValidBoardCell(cell: BoardCell, board: Board): boolean {
  return (
    cell.row >= 0 &&
    cell.row < board.rows &&
    cell.col >= 0 &&
    cell.col < board.cols
  );
}

export function getBoardCellIndex(
  cell: BoardCell,
  board: Board
): Option<number> {
  return isValidBoardCell(cell, board)
    ? some(cell.row * board.cols + cell.col)
    : none;
}

export function cellHasMine(cell: BoardCell, board: Board): Option<boolean> {
  return getBoardCellIndex(cell, board).chain(i =>
    some(board.minesIndexes.has(i))
  );
}

export function placeMineInCell(cell: BoardCell, board: Board): Option<Board> {
  return getBoardCellIndex(cell, board).chain(i => placeMineInIndex(i, board));
}

export function isCellFlagged(cell: BoardCell, board: Board): Option<boolean> {
  return getBoardCellIndex(cell, board).chain(i =>
    some(board.flaggedIndexes.has(i))
  );
}

export function setCellFlagged(cell: BoardCell, board: Board): Option<Board> {
  return getBoardCellIndex(cell, board).chain(i => {
    const flaggedIndexes = new Set(board.flaggedIndexes);
    flaggedIndexes.add(i);
    return some({ ...board, flaggedIndexes });
  });
}

export function isCellRevealed(cell: BoardCell, board: Board): Option<boolean> {
  return getBoardCellIndex(cell, board).chain(i =>
    some(board.cellRevealStatus[i])
  );
}

export function setCellRevealed(cell: BoardCell, board: Board): Option<Board> {
  return getBoardCellIndex(cell, board)
    .chain(i => {
      return updateAt(i, true, board.cellRevealStatus);
    })
    .chain(cellRevealStatus =>
      some({
        ...board,
        cellRevealStatus
      })
    );
}

export function isCellEmpty(cell: BoardCell, board: Board): Option<boolean> {
  return getBoardCellIndex(cell, board).chain(i =>
    some(board.adjacentMinesCount[i] === 0)
  );
}

export function getAdjacentMinesCount(
  cell: BoardCell,
  board: Board
): Option<number> {
  return getBoardCellIndex(cell, board).chain(i =>
    some(board.adjacentMinesCount[i])
  );
}

export function getAdjacentCells(cell: BoardCell, board: Board): BoardCell[] {
  if (!isValidBoardCell(cell, board)) {
    return [];
  }
  const res = [];
  for (let i = cell.row - 1; i < cell.row + 2; i++) {
    for (let j = cell.col - 1; j < cell.col + 2; j++) {
      const newCell = boardCell(i, j);
      if (
        (i !== cell.row || j !== cell.col) &&
        isValidBoardCell(newCell, board)
      ) {
        res.push(newCell);
      }
    }
  }
  return res;
}

function placeMineInIndex(index: number, board: Board): Option<Board> {
  if (index < 0 || index >= board.rows * board.cols) {
    return none;
  }
  const minesIndexes = new Set(board.minesIndexes);
  minesIndexes.add(index);
  return some({ ...board, minesIndexes });
}

function tryPlaceMineInIndex(
  index: number,
  board: Board
): Either<string, Board> {
  return board.minesIndexes.has(index)
    ? left("mine already present")
    : placeMineInIndex(index, board).fold(left("wrong index"), b => right(b));
}

export function placeRandomMine(board: Board): IOEither<string, Board> {
  return rightIOE<string, number>(
    randomInt(0, board.rows * board.cols - 1)
  ).chain(i => fromEither(tryPlaceMineInIndex(i, board)));
}

function placeNextMine(board: Board): IOEither<never, Board> {
  return placeRandomMine(board)
    .orElse(() => placeNextMine(board))
    .chain(newBoard => ioEither.of(newBoard));
}

function placeMinesInBoard(
  board: Board,
  minesCount: number
): IOEither<never, Board> {
  return placeNextMine(board).chain(newBoard =>
    newBoard.minesIndexes.size === minesCount
      ? ioEither.of(newBoard)
      : placeMinesInBoard(newBoard, minesCount)
  );
}

export function countAdjacentMines(cell: BoardCell, board: Board): number {
  const adjacentCells = getAdjacentCells(cell, board);
  return adjacentCells.reduce(
    (total, current) =>
      cellHasMine(current, board).fold(total, v => (v ? total + 1 : total)),
    0
  );
}

export function countAllAdjacentMines(board: Board): Board {
  const adjacentMinesCount: number[] = [];
  for (let i = 0; i < board.rows; i++) {
    for (let j = 0; j < board.cols; j++) {
      const cell = boardCell(i, j);
      getBoardCellIndex(cell, board).map(index => {
        adjacentMinesCount[index] = countAdjacentMines(cell, board);
      });
    }
  }
  return { ...board, adjacentMinesCount };
}

export function createBoard(
  rows: number,
  cols: number,
  mines: number
): IOEither<string, Board> {
  if (mines > cols * rows) {
    return fromLeft("Cannot create a board with more mines than cells");
  }
  const board = createEmptyBoard(rows, cols);
  return placeMinesInBoard(board, mines).map(countAllAdjacentMines);
}
