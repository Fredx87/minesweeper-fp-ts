import { difference } from "fp-ts/lib/Array";
import { IOEither } from "fp-ts/lib/IOEither";
import { setoidNumber } from "fp-ts/lib/Setoid";
import {
  Board,
  BoardCell,
  cellHasMine,
  createBoard,
  getAdjacentCells,
  isCellEmpty,
  isCellRevealed,
  setCellFlagged,
  setCellRevealed
} from "../board/board";

export type MatchState = "playing" | "win" | "game_over";

export interface Match {
  state: MatchState;
  board: Board;
}

export function createMatch(
  rows: number,
  cols: number,
  mines: number
): IOEither<string, Match> {
  return createBoard(rows, cols, mines).map(board => {
    const match: Match = {
      state: "playing",
      board
    };
    return match;
  });
}

function isGameOver(clickedCell: BoardCell, match: Match): boolean {
  return cellHasMine(clickedCell, match.board).getOrElse(false);
}

function isWin(board: Board): boolean {
  const unRevealedIndexes = board.cellRevealStatus.reduce<number[]>(
    (res, v, index) => (v === false ? res.concat(index) : res),
    []
  );
  const minesIndexes = Array.from(board.minesIndexes).sort();
  const diff = difference(setoidNumber)(unRevealedIndexes, minesIndexes);
  return diff.length === 0;
}

function getEmptyAdjacentCells(cell: BoardCell, board: Board): BoardCell[] {
  return getAdjacentCells(cell, board).filter(
    c =>
      isCellEmpty(c, board).getOrElse(false) &&
      !isCellRevealed(c, board).getOrElse(true)
  );
}

function revealAdjacentCells(cell: BoardCell, board: Board): Board {
  const unrevealedAdj = getAdjacentCells(cell, board).filter(
    c => !isCellRevealed(c, board).getOrElse(true)
  );
  return unrevealedAdj.reduce<Board>(
    (b, c) => setCellRevealed(c, b).getOrElse(b),
    board
  );
}

function revealAdjacentEmptyCells(cell: BoardCell, board: Board): Board {
  if (!isCellEmpty(cell, board).getOrElse(true)) {
    return setCellRevealed(cell, board).getOrElse(board);
  }
  const toCheck: BoardCell[] = [cell];
  const emptyRevealed: BoardCell[] = [cell];
  let res = board;
  while (toCheck.length > 0) {
    const c = toCheck.shift()!;
    setCellRevealed(c, res).map(b => {
      res = b;
      emptyRevealed.push(c);
      const adj = getEmptyAdjacentCells(c, b);
      toCheck.push(...adj);
    });
  }
  return emptyRevealed.reduce<Board>((b, c) => revealAdjacentCells(c, b), res);
}

export function revealAllMines(board: Board): Board {
  const cellRevealStatus = board.cellRevealStatus;
  board.minesIndexes.forEach(i => (cellRevealStatus[i] = true));
  return { ...board, cellRevealStatus };
}

export function cellClick(cell: BoardCell, match: Match): Match {
  if (isGameOver(cell, match)) {
    return {
      board: revealAllMines(match.board),
      state: "game_over"
    };
  }

  const revealedBoard = revealAdjacentEmptyCells(cell, match.board);
  if (isWin(revealedBoard)) {
    return {
      board: revealedBoard,
      state: "win"
    };
  }
  return { ...match, board: revealedBoard };
}

export function cellRightClick(cell: BoardCell, match: Match): Match {
  return {
    board: setCellFlagged(cell, match.board).getOrElse(match.board),
    state: match.state
  };
}
