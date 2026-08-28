import { type Registry } from "@nanoforge-dev/ecs-client";
import { TransformComponent } from "../components/essentials/transform.component";
import { MoveController } from "../components/move-controller.component";
import { sceneManager } from "../main";

const CAMERA_SMOOTHING = 0.1;

export const cameraFollowSystem = (registry: Registry) => {
  const entities: { MoveController: MoveController; TransformComponent: TransformComponent }[] =
    registry.getZipper([MoveController, TransformComponent]);

  const scene = sceneManager.getScene()

  if (!scene || !scene.layer) return;

  for (const entity of entities) {
    const viewWidth = scene.layer.width();
    const viewHeight = scene.layer.height();

    const scale = scene.layer.scaleX();

    const targetX = viewWidth / 2 - entity.TransformComponent.x * scale;
    const targetY = viewHeight / 2 - entity.TransformComponent.y * scale;

    const current = scene.layer.position();
    scene.layer.position({
      x: current.x + (targetX - current.x) * CAMERA_SMOOTHING,
      y: current.y + (targetY - current.y) * CAMERA_SMOOTHING
    });
  }
}
