import React, { useState } from "react";
import {
  Board,
  BoardCell,
  boardCell,
  cellHasMine,
  getAdjacentMinesCount,
  isCellFlagged,
  isCellRevealed
} from "../board/board";
import { Match } from "../match/match";
import styles from "./BoardComponent.module.css";
import { Cell } from "./Cell";
import {
  leftClickAction,
  MatchAction,
  rightClickAction
} from "./MatchComponent";

export interface BoardComponentProps {
  match: Match;
  dispatch: React.Dispatch<MatchAction>;
}

function buildCells(board: Board): BoardCell[][] {
  const res: BoardCell[][] = [];
  for (let i = 0; i < board.rows; i++) {
    const row = [];
    for (let j = 0; j < board.cols; j++) {
      row.push(boardCell(i, j));
    }
    res.push(row);
  }
  return res;
}

export function BoardComponent(props: BoardComponentProps) {
  const [cells] = useState(buildCells(props.match.board));
  return (
    <div>
      {cells.map(row => (
        <div className={styles["board-row"]}>
          {row.map(cell => (
            <Cell
              isRevealed={isCellRevealed(cell, props.match.board).getOrElse(
                false
              )}
              hasMine={cellHasMine(cell, props.match.board).getOrElse(false)}
              isFlagged={isCellFlagged(cell, props.match.board).getOrElse(
                false
              )}
              adjacentMines={getAdjacentMinesCount(
                cell,
                props.match.board
              ).getOrElse(0)}
              onClick={() => {
                props.dispatch(leftClickAction(cell));
              }}
              onContextMenu={() => props.dispatch(rightClickAction(cell))}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
