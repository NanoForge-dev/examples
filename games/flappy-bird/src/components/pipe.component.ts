/**
 * One half of a pair of pipes: the top one hangs from the sky, the bottom one stands on the
 * ground. Needs `Position2D`, `DrawableRect2D` and the `movePipes` system.
 *
 * @remarks
 * The top pipe's `DrawableRect2D` is turned by 180 degrees: its `Position2D` is its bottom-right
 * corner, the edge of the gap.
 *
 * @component
 * @side client
 * @group Pipe color=#73bf2e - Which pipe it is.
 */
export class Pipe {
  name = "Pipe";

  /** Whether the bird flew past it, set by `scorePipes`. */
  scored = false;

  constructor(
    /** The pair it belongs to: both halves of a pair move together. @group Pipe */
    public pair = 0,
    /** Whether it is the top half. @group Pipe */
    public top = false,
  ) {}
}
