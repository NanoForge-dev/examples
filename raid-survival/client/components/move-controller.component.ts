import { type InputEnum } from "@nanoforge-dev/input";

export class MoveController {
  name = this.constructor.name;
  public keyUp: InputEnum;
  public keyDown: InputEnum;
  public keyLeft: InputEnum;
  public keyRight: InputEnum;
  public movingUp: boolean = false;
  public movingDown: boolean = false;
  public movingLeft: boolean = false;
  public movingRight: boolean = false;
  public lastMoveKeys: string[] = []

  constructor(clientConfig: {
    keybinds: { up: InputEnum; left: InputEnum; down: InputEnum; right: InputEnum };
  }) {
    this.keyUp = clientConfig.keybinds.up;
    this.keyDown = clientConfig.keybinds.down;
    this.keyLeft = clientConfig.keybinds.left;
    this.keyRight = clientConfig.keybinds.right;
  }
}
