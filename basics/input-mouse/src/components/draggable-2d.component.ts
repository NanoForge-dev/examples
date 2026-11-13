import { InputEnum } from "@nanoforge-dev/input";

/**
 * Lets the mouse drag a rectangle: press a button on its `DrawableRect2D`, move, release. Needs
 * the `drag2D` system.
 *
 * @component
 * @side client
 * @group Drag color=#9d7bff - How the entity is dragged.
 */
export class Draggable2D {
  name = "Draggable2D";

  /** Whether the current drag started on the entity, set by `drag2D`. */
  grabbed = false;
  /** Whether the current drag was already checked, set by `drag2D`. */
  checked = false;
  /** Where the entity was when the drag started, set by `drag2D`. */
  fromX = 0;
  /** Where the entity was when the drag started, set by `drag2D`. */
  fromY = 0;

  constructor(
    /** The mouse button that drags it. @group Drag */
    public button: InputEnum = InputEnum.MouseLeft,
  ) {}
}
