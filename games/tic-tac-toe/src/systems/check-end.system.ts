import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";

import { Cell } from "../components/cell.component";
import { EndPopup } from "../scenes/end-popup.scene";

/** The rows, columns and diagonals, as `[row, col]` cells. */
const LINES = [
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  [
    [0, 2],
    [1, 1],
    [2, 0],
  ],
] as const;

/**
 * Ends the match when a player has three marks in a line, or when the board is full: sets
 * `result` and shows the end popup over the board.
 *
 * @system
 * @side client
 * @vars result
 */
export const checkEnd = (registry: Registry, ctx: Context) => {
  const vars = ctx.scenes.vars;
  if (vars.get("result")) return;

  const marks = new Map<string, Cell["mark"]>();
  registry.getZipper([Cell]).forEach(({ Cell }) => marks.set(`${Cell.row},${Cell.col}`, Cell.mark));
  const at = ([row, col]: readonly [number, number]) => marks.get(`${row},${col}`) ?? "";

  const line = LINES.find(([a, b, c]) => at(a) && at(a) === at(b) && at(a) === at(c));
  if (line) vars.set("result", `Player ${at(line[0]) === "X" ? 1 : 2} wins!`);
  else if (marks.size && [...marks.values()].every(Boolean)) vars.set("result", "It's a draw!");
  else return;

  void ctx.scenes.load(ctx, EndPopup, { parent: "current" });
};
