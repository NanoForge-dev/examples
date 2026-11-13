import { InputEnum } from "@nanoforge-dev/input";

/**
 * Moves an entity with the keyboard, by setting its `Velocity2D`. Needs the `moveControl2D`
 * system.
 *
 * @example
 * For a platformer, set `axes` to `horizontal`: the vertical velocity is left to gravity and
 * jumps.
 *
 * @component
 * @side client
 * @group Movement color=#9d7bff - How the entity moves.
 * @group Keys color=#f0a33a - The keys that move it.
 */
export class MoveController2D {
  name = "MoveController2D";

  constructor(
    /** In pixels per second. @group Movement */
    public speed = 200,
    /** Which directions the keys move it in. @group Movement */
    public axes: "both" | "horizontal" | "vertical" = "both",
    /** @group Keys */
    public left: InputEnum = InputEnum.ArrowLeft,
    /** @group Keys */
    public right: InputEnum = InputEnum.ArrowRight,
    /** @group Keys */
    public up: InputEnum = InputEnum.ArrowUp,
    /** @group Keys */
    public down: InputEnum = InputEnum.ArrowDown,
  ) {}
}
