import { difference } from "fp-ts/lib/Array";
import { now } from "fp-ts/lib/Date";
import { IO, io } from "fp-ts/lib/IO";
import { IOEither } from "fp-ts/lib/IOEither";
import { none, Option, some } from "fp-ts/lib/Option";
import { setoidNumber } from "fp-ts/lib/Setoid";
import {
  Board,
  BoardCell,
  cellHasMine,
  createBoard,
  getAdjacentCells,
  isCellEmpty,
  isCellFlagged,
  isCellRevealed,
  setCellRevealed,
  toggleCellFlagged
} from "../board/board";

export type MatchState = "playing" | "win" | "game_over";

export interface Match {
  state: MatchState;
  board: Board;
  startedTime: Option<number>;
  endedTime: Option<number>;
}

export function createMatch(
  rows: number,
  cols: number,
  mines: number
): IOEither<string, Match> {
  return createBoard(rows, cols, mines).map(board => {
    const match: Match = {
      state: "playing",
      board,
      startedTime: none,
      endedTime: none
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

function getUnrevealedAdjacentCells(
  cell: BoardCell,
  board: Board
): BoardCell[] {
  return getAdjacentCells(cell, board).filter(
    c =>
      !isCellRevealed(c, board).getOrElse(true) &&
      !isCellFlagged(c, board).getOrElse(true)
  );
}

function revealCells(cells: BoardCell[], board: Board): Board {
  return cells.reduce<Board>(
    (b, c) => setCellRevealed(c, b).getOrElse(b),
    board
  );
}

function revealAdjacentEmptyCells(cell: BoardCell, board: Board): Board {
  if (!isCellEmpty(cell, board).getOrElse(true)) {
    return setCellRevealed(cell, board).getOrElse(board);
  }
  const toCheck: BoardCell[] = [cell];
  let res = board;
  while (toCheck.length > 0) {
    const c = toCheck.shift()!;
    const unrevealedAdjacentCells = getUnrevealedAdjacentCells(c, res);
    res = revealCells(unrevealedAdjacentCells.concat(c), res);
    unrevealedAdjacentCells
      .filter(c => isCellEmpty(c, res).getOrElse(false))
      .forEach(c => {
        toCheck.push(c);
      });
  }
  return res;
}

export function revealAllMines(board: Board): Board {
  const cellRevealStatus = board.cellRevealStatus;
  board.minesIndexes.forEach(i => (cellRevealStatus[i] = true));
  return { ...board, cellRevealStatus };
}

export function setStartedTime(match: Match): IO<Match> {
  return now.map(time => ({ ...match, startedTime: some(time) }));
}

export function setEndedTime(match: Match): IO<Match> {
  return now.map(time => ({ ...match, endedTime: some(time) }));
}

export function cellClick(cell: BoardCell, match: Match): IO<Match> {
  if (match.state !== "playing") {
    return io.of(match);
  }

  const res = match.startedTime.isNone() ? setStartedTime(match) : io.of(match);

  return res.chain(m => {
    if (isCellFlagged(cell, m.board).getOrElse(false)) {
      return io.of(m);
    }

    if (isGameOver(cell, m)) {
      return setEndedTime(m).chain(m2 =>
        io.of({
          ...m2,
          board: revealAllMines(m2.board),
          state: "game_over"
        } as Match)
      );
    }

    const revealedBoard = revealAdjacentEmptyCells(cell, m.board);

    if (isWin(revealedBoard)) {
      return setEndedTime(m).chain(m2 =>
        io.of({
          ...m2,
          board: revealedBoard,
          state: "win"
        } as Match)
      );
    }

    return io.of({ ...m, board: revealedBoard });
  });
}

export function cellRightClick(cell: BoardCell, match: Match): IO<Match> {
  if (match.state !== "playing") {
    return io.of(match);
  }

  const res = match.startedTime.isNone() ? setStartedTime(match) : io.of(match);

  return res.map(m => {
    if (isCellRevealed(cell, m.board).getOrElse(false)) {
      return m;
    }

    return {
      ...m,
      board: toggleCellFlagged(cell, m.board).getOrElse(match.board)
    };
  });
}
