/**
 * Writes whether a controller is connected in the entity's `DrawableText2D`. Needs the
 * `showControllerStatus` system.
 *
 * @component
 * @side client
 */
export class ControllerStatus {
  name = "ControllerStatus";

  constructor(
    /** The controller to watch: 0 for the first one. */
    public controller = 0,
  ) {}
}
