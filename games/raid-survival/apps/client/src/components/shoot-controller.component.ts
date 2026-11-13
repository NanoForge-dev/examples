import type { Vector } from "@raid-survival/shared/protocol";
import { InputEnum } from "@nanoforge-dev/input";

/**
 * Aims and fires the weapon of the local player: `shootControl` reads the mouse and the keys,
 * `sendShootControl` sends them.
 *
 * @component
 * @side client
 */
export class ShootController {
  name = "ShootController";
  public position: Vector = { x: 0, y: 0 };

  public aimingMode: "mouse" | "arrows" | "joystick";
  public keyShoot: InputEnum;
  public shooting: boolean = false;
  // Last value sent to the server - lets sendShootControl only send on change.
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
