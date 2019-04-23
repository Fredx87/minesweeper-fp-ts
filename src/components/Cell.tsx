import React from "react";
import styles from "./Cell.module.css";

export interface CellProps {
  isRevealed: boolean;
  isFlagged: boolean;
  hasMine: boolean;
  adjacentMines: number;
  onClick: () => void;
  onContextMenu: () => void;
}

export function Cell(props: CellProps) {
  function getTextContent(): string {
    if (props.isFlagged) {
      return "🚩";
    }

    if (props.isRevealed && props.hasMine) {
      return "💣";
    }

    if (props.isRevealed && props.adjacentMines > 0) {
      return props.adjacentMines.toString();
    }

    return "";
  }

  function handleContextMenu(e: React.MouseEvent) {
    props.onContextMenu();
    e.preventDefault();
  }

  return (
    <button
      className={props.isRevealed ? styles.revealed : ""}
      onClick={props.onClick}
      onContextMenu={handleContextMenu}
    >
      {getTextContent()}
    </button>
  );
}
