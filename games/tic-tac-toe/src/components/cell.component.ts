/**
 * A square of the board, where a player puts a mark. Needs `Clickable2D` and the `playCell`
 * system.
 *
 * @component
 * @side client
 * @group Place color=#4aa3ff - Where the square is on the board.
 */
export class Cell {
  name = "Cell";

  /** The mark in it, set by `playCell`: `X` for player 1, `O` for player 2. */
  mark: "" | "X" | "O" = "";

  constructor(
    /** From 0 (top) to 2. @group Place */
    public row = 0,
    /** From 0 (left) to 2. @group Place */
    public col = 0,
  ) {}
}
