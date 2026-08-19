import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { Position } from "../components/position.component";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { MoveController } from "../components/move-controller.component";

const CAMERA_SMOOTHING = 0.1;

export const cameraFollowSystem = (registry: Registry, ctx: Context) => {
  const graphic2D = ctx.libs.getGraphics<Graphics2DLibrary>();
  const entities = registry.getZipper([MoveController, Position]);

  for (const entity of entities) {
    const viewWidth = graphic2D.baseLayer.width();
    const viewHeight = graphic2D.baseLayer.height();

    const targetX = viewWidth / 2 - entity.Position.x;
    const targetY = viewHeight / 2 - entity.Position.y;

    const current = graphic2D.baseLayer.position();
    graphic2D.baseLayer.position({
      x: current.x + (targetX - current.x) * CAMERA_SMOOTHING,
      y: current.y + (targetY - current.y) * CAMERA_SMOOTHING
    });
  }
}
