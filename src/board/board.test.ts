import { some } from "fp-ts/lib/Option";
import {
  Board,
  boardCell,
  BoardCell,
  cellHasMine,
  countAllAdjacentMines,
  createBoard,
  createEmptyBoard,
  getAdjacentCells,
  getBoardCellIndex,
  isCellFlagged,
  isCellRevealed,
  placeMineInCell,
  setCellRevealed,
  toggleCellFlagged
} from "./board";

describe("create board", () => {
  test("cannot create board with more mines then cells", () => {
    expect(
      createBoard(10, 5, 200)
        .run()
        .isLeft()
    ).toBe(true);
  });

  test("successfully create an empty board with specified rows and columns", () => {
    const board = createEmptyBoard(5, 10);
    expect(board.cols).toBe(10);
    expect(board.rows).toBe(5);
    expect(board.minesIndexes.size).toBe(0);
    expect(board.flaggedIndexes.size).toBe(0);
    expect(board.cellRevealStatus.length).toBe(50);
  });

  test("successfully create board with specified number of mines", () => {
    const eitherBoard = createBoard(10, 5, 20).run();
    expect(eitherBoard.isRight()).toBe(true);

    const board = eitherBoard.value as Board;
    expect(board.rows).toBe(10);
    expect(board.cols).toBe(5);
    expect(board.minesIndexes.size).toBe(20);
    expect(board.flaggedIndexes.size).toBe(0);
    expect(board.cellRevealStatus.length).toBe(50);
  });
});

describe("board functions", () => {
  let board: Board;

  beforeEach(() => {
    board = createEmptyBoard(10, 15) as Board;
  });

  test("getBoardCellIndex returns none when row less than 0", () => {
    expect(getBoardCellIndex(boardCell(-1, 10), board).isNone()).toBe(true);
  });

  test("getBoardCellIndex returns none when col less than 0", () => {
    expect(getBoardCellIndex(boardCell(7, -1), board).isNone()).toBe(true);
  });

  test("getBoardCellIndex returns none when row greter than or equal rows", () => {
    expect(getBoardCellIndex(boardCell(10, 10), board).isNone()).toBe(true);
    expect(getBoardCellIndex(boardCell(100, 10), board).isNone()).toBe(true);
  });

  test("getBoardCellIndex returns none when col greter than or equal cols", () => {
    expect(getBoardCellIndex(boardCell(7, 15), board).isNone()).toBe(true);
    expect(getBoardCellIndex(boardCell(7, 100), board).isNone()).toBe(true);
  });

  test.each([
    [0, 0, 0],
    [0, 2, 2],
    [0, 14, 14],
    [1, 0, 15],
    [1, 14, 29],
    [2, 0, 30],
    [9, 14, 149]
  ])(
    "getBoardCellIndex returns the right index when row=%i and col=%i",
    (row, col, expexted) => {
      expect(getBoardCellIndex(boardCell(row, col), board)).toEqual(
        some(expexted)
      );
    }
  );

  test("cellHasMine / placeMineInCell", () => {
    expect(cellHasMine(boardCell(2, 4), board)).toEqual(some(false));
    placeMineInCell(boardCell(2, 4), board).map(newBoard => {
      expect(cellHasMine(boardCell(2, 4), newBoard)).toEqual(some(true));
    });
  });

  test("isCellFlagged / toggleCellFlagged", () => {
    expect(isCellFlagged(boardCell(4, 6), board)).toEqual(some(false));
    toggleCellFlagged(boardCell(4, 6), board).map(newBoard => {
      expect(isCellFlagged(boardCell(4, 6), newBoard)).toEqual(some(true));
      toggleCellFlagged(boardCell(4, 6), newBoard).map(b => {
        expect(isCellFlagged(boardCell(4, 6), b)).toEqual(some(false));
      });
    });
  });

  test("isCellRevealed / setCellRevealed", () => {
    expect(isCellRevealed(boardCell(7, 4), board)).toEqual(some(false));
    setCellRevealed(boardCell(7, 4), board).map(newBoard => {
      expect(isCellRevealed(boardCell(7, 4), newBoard)).toEqual(some(true));
    });
  });

  test.each<[number, number, BoardCell[]]>([
    [-1, -1, []],
    [0, 0, [boardCell(0, 1), boardCell(1, 0), boardCell(1, 1)]],
    [
      5,
      0,
      [
        boardCell(4, 0),
        boardCell(4, 1),
        boardCell(5, 1),
        boardCell(6, 1),
        boardCell(6, 0)
      ]
    ],
    [
      5,
      5,
      [
        boardCell(5, 4),
        boardCell(4, 4),
        boardCell(4, 5),
        boardCell(4, 6),
        boardCell(5, 6),
        boardCell(6, 6),
        boardCell(6, 5),
        boardCell(6, 4)
      ]
    ],
    [
      9,
      9,
      [
        boardCell(9, 8),
        boardCell(8, 8),
        boardCell(8, 9),
        boardCell(8, 10),
        boardCell(9, 10)
      ]
    ],
    [9, 14, [boardCell(9, 13), boardCell(8, 13), boardCell(8, 14)]],
    [10, 15, []]
  ])(
    "getAdjacentCells for row %i and col %i",
    (row: number, col: number, expexted: BoardCell[]) => {
      const result = getAdjacentCells(boardCell(row, col), board);
      expect(result).toIncludeSameMembers(expexted);
    }
  );

  test("countAllAdjacentMines", () => {
    placeMineInCell(boardCell(2, 2), board)
      .chain(b => placeMineInCell(boardCell(5, 5), b))
      .chain(b => placeMineInCell(boardCell(5, 6), b))
      .chain(b => placeMineInCell(boardCell(6, 6), b))
      .map(b => countAllAdjacentMines(b))
      .map(b => {
        expect(b.minesIndexes.size).toBe(4);
        getBoardCellIndex(boardCell(0, 0), b).map(i => {
          expect(b.adjacentMinesCount[i]).toBe(0);
        });
        getBoardCellIndex(boardCell(1, 1), b).map(i => {
          expect(b.adjacentMinesCount[i]).toBe(1);
        });
        getBoardCellIndex(boardCell(2, 1), b).map(i => {
          expect(b.adjacentMinesCount[i]).toBe(1);
        });
        getBoardCellIndex(boardCell(2, 2), b).map(i => {
          expect(b.adjacentMinesCount[i]).toBe(0);
        });
        getBoardCellIndex(boardCell(6, 5), b).map(i => {
          expect(b.adjacentMinesCount[i]).toBe(3);
        });
        getBoardCellIndex(boardCell(6, 7), b).map(i => {
          expect(b.adjacentMinesCount[i]).toBe(2);
        });
      });
  });
});
