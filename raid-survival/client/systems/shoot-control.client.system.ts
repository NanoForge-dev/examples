import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { type InputLibrary } from "@nanoforge-dev/input";

import { ShootController } from "../components/shoot.controller";
import { Direction } from "../components/direction.component";
import { Graphics2DLibrary, Vector2d } from "@nanoforge-dev/graphics-2d";

export function shootControl(registry: Registry, ctx: Context) {
  const entities = registry.getZipper([ShootController, Direction]);
  const input = ctx.libs.getInput<InputLibrary>();
  const graphics = ctx.libs.getGraphics<Graphics2DLibrary>();
  let pointerPosition: Vector2d | null = null;

  graphics.stage.on("pointermove", () => {
    pointerPosition = graphics.baseLayer.getRelativePointerPosition();
  });
  entities.forEach(({ ShootController }) => {
    ShootController.mainWeaponShooting = input.isKeyPressed(ShootController.keyShootMainWeapon);
    ShootController.secondWeaponShooting = input.isKeyPressed(ShootController.keyShootSecondWeapon);
    ShootController.position.x = pointerPosition?.x || 0;
    ShootController.position.y = pointerPosition?.y || 0;
  });
}
// * Required to generate code
export default shootControl.name;
