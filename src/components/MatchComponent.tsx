import { Either, left, right } from "fp-ts/lib/Either";
import React, { useReducer, useState } from "react";
import { BoardCell } from "../board/board";
import {
  cellClick,
  cellRightClick,
  createMatch,
  Match,
  MatchState
} from "../match/match";
import { useInterval } from "../useInterval";
import { BoardComponent } from "./BoardComponent";
import styles from "./MatchComponent.module.css";

export interface LeftClickAction {
  type: "LeftClick";
  cell: BoardCell;
}

export function leftClickAction(cell: BoardCell): LeftClickAction {
  return { type: "LeftClick", cell };
}

export interface RightClickAction {
  type: "RightClick";
  cell: BoardCell;
}

export function rightClickAction(cell: BoardCell): RightClickAction {
  return { type: "RightClick", cell };
}

export interface CreateMatchAction {
  type: "CreateMatch";
  rows: number;
  cols: number;
  mines: number;
}

export function createMatchAction(
  rows: number,
  cols: number,
  mines: number
): CreateMatchAction {
  return { type: "CreateMatch", rows, cols, mines };
}

export type MatchAction =
  | LeftClickAction
  | RightClickAction
  | CreateMatchAction;

function reducer(
  state: Either<string, Match>,
  action: MatchAction
): Either<string, Match> {
  switch (action.type) {
    case "LeftClick": {
      return state.fold(
        l => left(l),
        m => right(cellClick(action.cell, m).run())
      );
    }
    case "RightClick": {
      return state.fold(
        l => left(l),
        m => right(cellRightClick(action.cell, m).run())
      );
    }
    case "CreateMatch": {
      return createMatch(action.rows, action.cols, action.mines).run();
    }
  }
}

const stateEmojiMap: Record<MatchState, string> = {
  playing: "🙂",
  win: "😎",
  game_over: "😭"
};

export function MatchComponent() {
  const [state, dispatch] = useReducer(reducer, createMatch(9, 9, 10).run());
  const [elapsedTime, setElapsedTime] = useState("0");

  useInterval(() => {
    state
      .map(m => {
        return m.startedTime.fold(0, sT => {
          return m.endedTime.fold(Date.now() - sT, eT => eT - sT);
        });
      })
      .map(n => setElapsedTime((n / 1000).toFixed(0)));
  }, 1000);

  function getRemainingMines(): number {
    return state.fold(
      () => 0,
      m => m.board.minesIndexes.size - m.board.flaggedIndexes.size
    );
  }

  function handleButtonClick() {
    dispatch(createMatchAction(9, 9, 10));
  }

  return state.fold(
    error => <div>{`Cannot create match: ${error}`}</div>,
    m => (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.indicator}>
            <div>💣</div>
            <div>{getRemainingMines()}</div>
          </div>
          <div>
            <button onClick={handleButtonClick}>
              {stateEmojiMap[m.state]}
            </button>
          </div>
          <div className={styles.indicator}>
            <div>🕒</div>
            <div>{elapsedTime}</div>
          </div>
        </div>
        <BoardComponent match={m} dispatch={dispatch} />
      </div>
    )
  );
}
