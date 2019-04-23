import { action } from "@storybook/addon-actions";
import { boolean, number, withKnobs } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";
import React from "react";
import { Cell } from "../src/components/Cell";

storiesOf("Cell", module)
  .addDecorator(withKnobs)
  .add("Basic Cell", () => (
    <Cell
      isRevealed={boolean("isRevealed", false)}
      isFlagged={boolean("isFlagged", false)}
      hasMine={boolean("hasMine", false)}
      adjacentMines={number("adjacentMines", 0)}
      onClick={action("click")}
      onContextMenu={action("context-menu")}
    />
  ));
