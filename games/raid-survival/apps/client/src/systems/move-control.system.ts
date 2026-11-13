import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";
import "@nanoforge-dev/input";

import { MoveController } from "../components/move-controller.component";

export const moveControl = (registry: Registry, ctx: Context) => {
  const entities = registry.getZipper([MoveController]);
  const input = ctx.input;

  entities.forEach(({ MoveController }) => {
    MoveController.movingUp = input.isKeyPressed(MoveController.keyUp);
    MoveController.movingDown = input.isKeyPressed(MoveController.keyDown);
    MoveController.movingLeft = input.isKeyPressed(MoveController.keyLeft);
    MoveController.movingRight = input.isKeyPressed(MoveController.keyRight);
  });
};
