import { Either, left, right } from "fp-ts/lib/Either";
import React, { useReducer } from "react";
import { BoardCell } from "../board/board";
import { cellClick, cellRightClick, createMatch, Match } from "../match/match";
import { BoardComponent } from "./BoardComponent";

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
      return state.fold(l => left(l), m => right(cellClick(action.cell, m)));
    }
    case "RightClick": {
      return state.fold(
        l => left(l),
        m => right(cellRightClick(action.cell, m))
      );
    }
    case "CreateMatch": {
      return createMatch(action.rows, action.cols, action.mines).run();
    }
  }
}

export function MatchComponent() {
  const [state, dispatch] = useReducer(reducer, createMatch(20, 20, 1).run());

  return state.fold(
    error => <div>{`Cannot create match: ${error}`}</div>,
    m => (
      <div>
        <div>Status: {m.state}</div>
        <BoardComponent match={m} dispatch={dispatch} />
      </div>
    )
  );
}
