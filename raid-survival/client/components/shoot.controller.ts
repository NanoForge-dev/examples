import { Vector2d } from "@nanoforge-dev/graphics-2d";
import { InputEnum } from "@nanoforge-dev/input";

export class ShootController {
  name = this.constructor.name;
  public position: Vector2d = { x: 0, y: 0 };

  public aimingMode: "mouse" | "arrows" | "joystick";
  public keyShootMainWeapon: InputEnum;
  public keyShootSecondWeapon: InputEnum;
  public mainWeaponShooting: boolean = false;
  public secondWeaponShooting: boolean = false;

  constructor(clientConfig: {
    keybinds: {
      aimingMode: "mouse" | "arrows" | "joystick";
      shootMainWeapon: InputEnum;
      shootSecondWeapon: InputEnum;
    };
  }) {
    this.aimingMode = clientConfig.keybinds.aimingMode;
    this.keyShootMainWeapon = clientConfig.keybinds.shootMainWeapon;
    this.keyShootSecondWeapon = clientConfig.keybinds.shootSecondWeapon;
  }
}

// * Required to generate code
export default ShootController.name;
