import { ControllerButton } from "@nanoforge-dev/input/controller";

/**
 * Moves an entity with a controller's left stick, by setting its `Velocity2D`; holding a button
 * speeds it up, and pressing it makes the controller rumble. Needs the `controllerMove2D` system.
 *
 * @component
 * @side client
 * @group Movement color=#9d7bff - How the entity moves.
 */
export class ControllerMove2D {
  name = "ControllerMove2D";

  constructor(
    /** In pixels per second, with the stick pushed all the way. @group Movement */
    public speed = 300,
    /** The controller that moves it: 0 for the first one. @group Movement */
    public controller = 0,
    /** Held: twice the speed. @group Movement */
    public boost: ControllerButton = ControllerButton.A,
  ) {}
}
