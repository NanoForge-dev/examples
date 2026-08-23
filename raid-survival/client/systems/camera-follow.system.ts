import { type Registry } from "@nanoforge-dev/ecs-client";
import { Position } from "../components/position.component";
import { MoveController } from "../components/move-controller.component";
import { sceneManager } from "../main";

const CAMERA_SMOOTHING = 0.1;

export const cameraFollowSystem = (registry: Registry) => {
  const entities = registry.getZipper([MoveController, Position]);

  const scene = sceneManager.getScene()

  if (!scene || !scene.layer) return;

  for (const entity of entities) {
    const viewWidth = scene.layer.width();
    const viewHeight = scene.layer.height();

    const targetX = viewWidth / 2 - entity.Position.x;
    const targetY = viewHeight / 2 - entity.Position.y;

    const current = scene.layer.position();
    scene.layer.position({
      x: current.x + (targetX - current.x) * CAMERA_SMOOTHING,
      y: current.y + (targetY - current.y) * CAMERA_SMOOTHING
    });
  }
}
