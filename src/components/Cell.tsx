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

const adjacentMinesColors: Record<number, string> = {
  1: "blue",
  2: "green",
  3: "red",
  4: "purple",
  5: "maroon",
  6: "turquoise",
  7: "black",
  8: "grey"
};

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

  function getStyles(): React.CSSProperties {
    if (props.isRevealed && props.adjacentMines > 0) {
      return {
        color: adjacentMinesColors[props.adjacentMines],
        fontWeight: "bold"
      };
    }
    return {};
  }

  function handleContextMenu(e: React.MouseEvent) {
    props.onContextMenu();
    e.preventDefault();
  }

  return (
    <button
      className={props.isRevealed ? styles.revealed : ""}
      style={getStyles()}
      onClick={props.onClick}
      onContextMenu={handleContextMenu}
    >
      {getTextContent()}
    </button>
  );
}
