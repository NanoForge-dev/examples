import { InputEnum } from "@nanoforge-dev/input";

/**
 * Moves the local player with the keyboard: `moveControl` reads the keys, `sendMoveControl` sends
 * them to the server when they change.
 *
 * @component
 * @side client
 */
export class MoveController {
  name = "MoveController";
  public keyUp: InputEnum;
  public keyDown: InputEnum;
  public keyLeft: InputEnum;
  public keyRight: InputEnum;
  public movingUp: boolean = false;
  public movingDown: boolean = false;
  public movingLeft: boolean = false;
  public movingRight: boolean = false;
  public lastMoveKeys: string[] = [];

  constructor(
    /** The keys that move up, left, down and right. */
    clientConfig: {
      keybinds: { up: InputEnum; left: InputEnum; down: InputEnum; right: InputEnum };
    } = {
      keybinds: {
        up: InputEnum.KeyW,
        left: InputEnum.KeyA,
        down: InputEnum.KeyS,
        right: InputEnum.KeyD,
      },
    },
  ) {
    this.keyUp = clientConfig.keybinds.up;
    this.keyDown = clientConfig.keybinds.down;
    this.keyLeft = clientConfig.keybinds.left;
    this.keyRight = clientConfig.keybinds.right;
  }
}
