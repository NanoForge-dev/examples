/**
 * Writes the mouse position and the number of clicks in the entity's `DrawableText2D`. Needs the
 * `showMouseReadout` system.
 *
 * @component
 * @side client
 */
export class MouseReadout {
  name = "MouseReadout";

  /** Left clicks so far, counted by `showMouseReadout`. */
  clicks = 0;
  /** Whether the left button was down last frame, set by `showMouseReadout`. */
  held = false;
}
