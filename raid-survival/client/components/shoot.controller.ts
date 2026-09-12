import { Vector2d } from "@nanoforge-dev/graphics-2d";
import { InputEnum } from "@nanoforge-dev/input";

export class ShootController {
  name = this.constructor.name;
  public position: Vector2d = { x: 0, y: 0 };

  public aimingMode: "mouse" | "arrows" | "joystick";
  public keyShoot: InputEnum;
  public shooting: boolean = false;
  // Last value actually sent to the server - lets sendShootControl only send on change, same
  // dedup move-control.senders.system.ts already does for move keys.
  public lastSentShooting: boolean = false;
  // Edge-detected "R" state (isKeyPressed is level/held, not "just pressed").
  public wasReloadKeyPressed: boolean = false;
  // One-shot - set true on a fresh R press, sent once by sendShootControl then cleared.
  public reloadRequested: boolean = false;

  constructor(
    clientConfig: {
      keybinds: {
        aimingMode: "mouse" | "arrows" | "joystick";
        shoot: InputEnum;
      };
    } = {
      keybinds: {
        aimingMode: "mouse",
        shoot: InputEnum.MouseLeft,
      },
    },
  ) {
    this.aimingMode = clientConfig.keybinds.aimingMode;
    this.keyShoot = clientConfig.keybinds.shoot;
  }
}

// * Required to generate code
export default ShootController.name;
