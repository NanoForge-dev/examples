import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { InputEnum, type InputLibrary } from "@nanoforge-dev/input";

import { ShootController } from "../components/shoot.controller";
import { Direction } from "../components/direction.component";
import { Vector2d } from "@nanoforge-dev/graphics-2d";
import { TransformComponent } from "../components/essentials/transform.component";
import { sceneManager } from "../main";

const PLAYER_SPRITE_SIZE: Vector2d = { x: 24, y: 24 };

export function shootControl(registry: Registry, ctx: Context) {
  const entities: {
    ShootController: ShootController;
    Direction: Direction;
    TransformComponent: TransformComponent;
  }[] = registry.getZipper([ShootController, Direction, TransformComponent]);
  const input = ctx.libs.getInput<InputLibrary>();

  const pointerPosition: Vector2d | null = sceneManager.getScene()?.layer?.getRelativePointerPosition() || null;

  if (!pointerPosition) return;

  entities.forEach(({ ShootController, Direction, TransformComponent }) => {
    ShootController.mainWeaponShooting = <boolean>(
      input.isKeyPressed(ShootController.keyShootMainWeapon)
    );
    ShootController.secondWeaponShooting = <boolean>(
      input.isKeyPressed(ShootController.keyShootSecondWeapon)
    );

    // Edge-detected: isKeyPressed reports "held", but a reload request is a one-shot action, not
    // a continuous state - without this, holding R would queue a fresh reload request every
    // frame.
    const reloadKeyPressed = !!input.isKeyPressed(InputEnum.KeyR);
    if (reloadKeyPressed && !ShootController.wasReloadKeyPressed) {
      ShootController.reloadRequested = true;
    }
    ShootController.wasReloadKeyPressed = reloadKeyPressed;

    ShootController.position.x = pointerPosition?.x || 0;
    ShootController.position.y = pointerPosition?.y || 0;

    const dx = pointerPosition.x - (TransformComponent.x + PLAYER_SPRITE_SIZE.x / 2);
    const dy = pointerPosition.y - (TransformComponent.y + PLAYER_SPRITE_SIZE.y / 2);
    const length = Math.hypot(dx, dy);

    if (length > 0) {
      Direction.x = dx / length;
      Direction.y = dy / length;
    }
  });
}
// * Required to generate code
export default shootControl.name;
