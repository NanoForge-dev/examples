import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { type InputLibrary } from "@nanoforge-dev/input";

import { ShootController } from "../components/shoot.controller";
import { Direction } from "../components/direction.component";
import { Vector2d } from "@nanoforge-dev/graphics-2d";
import { Position } from "../components/position.component";
import { sceneManager } from "../main";

const PLAYER_SPRITE_SIZE: Vector2d = { x: 24, y: 24 };

export function shootControl(registry: Registry, ctx: Context) {
  const entities: { ShootController: ShootController; Direction: Direction; Position: Position }[] =
    registry.getZipper([ShootController, Direction, Position]);
  const input = ctx.libs.getInput<InputLibrary>();

  const pointerPosition: Vector2d | null = sceneManager.getScene()?.layer?.getRelativePointerPosition() || null;

  if (!pointerPosition) return;

  entities.forEach(({ ShootController, Direction, Position }) => {
    ShootController.mainWeaponShooting = <boolean>input.isKeyPressed(ShootController.keyShootMainWeapon);
    ShootController.secondWeaponShooting = <boolean>input.isKeyPressed(ShootController.keyShootSecondWeapon);
    ShootController.position.x = pointerPosition?.x || 0;
    ShootController.position.y = pointerPosition?.y || 0;

    const dx = pointerPosition.x - (Position.x + PLAYER_SPRITE_SIZE.x / 2);
    const dy = pointerPosition.y - (Position.y + PLAYER_SPRITE_SIZE.y / 2);
    const length = Math.hypot(dx, dy);

    if (length > 0) {
      Direction.x = dx / length;
      Direction.y = dy / length;
    }
  });
}
// * Required to generate code
export default shootControl.name;
