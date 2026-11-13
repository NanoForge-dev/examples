/**
 * Makes a `DrawableRect2D` react to the mouse: it lights up under the cursor, and `clicked` tells
 * your systems it was clicked this frame. Needs `Position2D` and the `click2D` system.
 *
 * @component
 * @side client
 * @group Look color=#b18cff - Its colors.
 */
export class Clickable2D {
  name = "Clickable2D";

  /** Whether the cursor is over it, set by `click2D`. */
  hovered = false;
  /** Whether it was clicked this frame, set by `click2D`. */
  clicked = false;

  constructor(
    /** A CSS color, when the cursor is not over it. @group Look @preset color */
    public color = "#4aa3ff",
    /** A CSS color, when the cursor is over it. @group Look @preset color */
    public hoverColor = "#7cc0ff",
  ) {}
}
