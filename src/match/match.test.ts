import { makeBy } from "fp-ts/lib/Array";
import { none, some } from "fp-ts/lib/Option";
import {
  boardCell,
  countAllAdjacentMines,
  createEmptyBoard,
  isCellFlagged,
  isCellRevealed,
  placeMineInCell,
  setCellRevealed,
  toggleCellFlagged
} from "../board/board";
import { cellClick, cellRightClick, Match } from "./match";

describe("match test", () => {
  let match: Match;

  beforeEach(() => {
    match = {
      state: "playing",
      board: createEmptyBoard(10, 10),
      startedTime: none,
      endedTime: none
    };
  });

  test("clicking on a cell sets startedTime", () => {
    placeMineInCell(boardCell(5, 5), match.board).map(b => {
      match.board = countAllAdjacentMines(b);
      const expected = Date.now() / 1000;
      const newMatch = cellClick(boardCell(0, 0), match).run();
      const result = newMatch.startedTime.getOrElse(0) / 1000;
      expect(result).toBeCloseTo(expected);
    });
  });

  test("right clicking on a cell sets startedTime", () => {
    placeMineInCell(boardCell(5, 5), match.board).map(b => {
      match.board = countAllAdjacentMines(b);
      const expected = Date.now() / 1000;
      const newMatch = cellRightClick(boardCell(0, 0), match).run();
      const result = newMatch.startedTime.getOrElse(0) / 1000;
      expect(result).toBeCloseTo(expected);
    });
  });

  test("clicking on a mine reveals all mines and set state to game_over", () => {
    placeMineInCell(boardCell(4, 4), match.board)
      .chain(b => placeMineInCell(boardCell(6, 6), b))
      .map(b => {
        match.board = b;
        const expectedEndedTime = Date.now() / 1000;
        const res = cellClick(boardCell(4, 4), match).run();
        const resultingEndedTime = res.endedTime.getOrElse(0) / 1000;
        expect(isCellRevealed(boardCell(4, 4), res.board)).toEqual(some(true));
        expect(isCellRevealed(boardCell(6, 6), res.board)).toEqual(some(true));
        expect(res.state).toBe("game_over");
        expect(resultingEndedTime).toBeCloseTo(expectedEndedTime);
      });
  });

  test("clicking on an unrevealed cell reveals all adjacent empty and unflagged cells", () => {
    placeMineInCell(boardCell(1, 3), match.board)
      .chain(b => placeMineInCell(boardCell(3, 1), b))
      .chain(b => toggleCellFlagged(boardCell(2, 2), b))
      .map(b => {
        match.board = countAllAdjacentMines(b);
        const res = cellClick(boardCell(0, 0), match).run();
        expect(isCellRevealed(boardCell(0, 0), res.board)).toEqual(some(true));
        expect(isCellRevealed(boardCell(0, 1), res.board)).toEqual(some(true));
        expect(isCellRevealed(boardCell(0, 2), res.board)).toEqual(some(true));
        expect(isCellRevealed(boardCell(1, 0), res.board)).toEqual(some(true));
        expect(isCellRevealed(boardCell(1, 1), res.board)).toEqual(some(true));
        expect(isCellRevealed(boardCell(1, 2), res.board)).toEqual(some(true));
        expect(isCellRevealed(boardCell(2, 0), res.board)).toEqual(some(true));
        expect(isCellRevealed(boardCell(2, 1), res.board)).toEqual(some(true));
        expect(isCellRevealed(boardCell(2, 2), res.board)).toEqual(some(false));
        expect(isCellRevealed(boardCell(0, 3), res.board)).toEqual(some(false));
        expect(isCellRevealed(boardCell(3, 0), res.board)).toEqual(some(false));
        expect(isCellRevealed(boardCell(5, 5), res.board)).toEqual(some(false));
        expect(res.state).toBe("playing");
      });
  });

  test("when all the cells without mines are revealed, sets the state to win", () => {
    placeMineInCell(boardCell(0, 1), match.board)
      .chain(b => placeMineInCell(boardCell(0, 2), b))
      .map(b => {
        match.board = countAllAdjacentMines(b);
        const cellRevealStatus = makeBy(100, () => true);
        cellRevealStatus[0] = false;
        cellRevealStatus[1] = false;
        cellRevealStatus[2] = false;
        match.board.cellRevealStatus = cellRevealStatus;
        const expectedEndedTime = Date.now() / 1000;
        const res = cellClick(boardCell(0, 0), match).run();
        const resultingEndedTime = res.endedTime.getOrElse(0) / 1000;
        expect(res.state).toBe("win");
        expect(resultingEndedTime).toBeCloseTo(expectedEndedTime);
      });
  });

  test("clicking on a flagged cell with mine should not reveal the cell", () => {
    placeMineInCell(boardCell(0, 1), match.board)
      .chain(b => placeMineInCell(boardCell(0, 2), b))
      .chain(b => toggleCellFlagged(boardCell(0, 1), b))
      .map(b => {
        match.board = b;
        const res = cellClick(boardCell(0, 1), match).run();
        expect(isCellRevealed(boardCell(0, 1), res.board)).toEqual(some(false));
        expect(res.state).toBe("playing");
      });
  });

  test("rightClick on a unrevealed cell should set cell as flagged", () => {
    const res = cellRightClick(boardCell(1, 1), match).run();
    expect(isCellFlagged(boardCell(1, 1), res.board)).toEqual(some(true));
  });

  test("rightClick on a revealed cell should not set cell as flagged", () => {
    setCellRevealed(boardCell(1, 1), match.board).map(b => {
      match.board = b;
      const res = cellRightClick(boardCell(1, 1), match).run();
      expect(isCellFlagged(boardCell(1, 1), res.board)).toEqual(some(false));
    });
  });

  test("cellClick / cellRightClick on win match should return same match", () => {
    match.state = "win";
    expect(cellClick(boardCell(1, 1), match).run()).toBe(match);
    expect(cellRightClick(boardCell(2, 2), match).run()).toBe(match);
  });

  // tslint:disable-next-line: no-identical-functions
  test("cellClick / cellRightClick on game_over match should return same match", () => {
    match.state = "game_over";
    expect(cellClick(boardCell(1, 1), match).run()).toBe(match);
    expect(cellRightClick(boardCell(2, 2), match).run()).toBe(match);
  });
});
