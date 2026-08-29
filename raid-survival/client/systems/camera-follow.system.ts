import { type Registry } from "@nanoforge-dev/ecs-client";
import { TransformComponent } from "../components/essentials/transform.component";
import { MoveController } from "../components/move-controller.component";
import { sceneManager } from "../main";

const CAMERA_SMOOTHING = 0.1;

// Map bounds in world space - map.png is placed at TransformComponent(0, 0) (see
// GameScene.load), and the actual play area is 1600x1600 (matches the collision grid).
const MAP_BOUNDS = { x: 0, y: 0, width: 1600, height: 1600 };

// Clamps a camera target so the viewport never scrolls past the map's edge on this axis. If the
// map is smaller than the viewport (scaled) on this axis, there's no position that avoids
// showing empty space on both sides - center it instead of hugging one edge arbitrarily.
function clampCameraAxis(target: number, viewSize: number, mapOrigin: number, mapSize: number, scale: number): number {
  const mapSizeScaled = mapSize * scale;
  if (mapSizeScaled <= viewSize) {
    return viewSize / 2 - (mapOrigin + mapSize / 2) * scale;
  }
  const max = -mapOrigin * scale;
  const min = max - (mapSizeScaled - viewSize);
  return Math.min(max, Math.max(min, target));
}

export const cameraFollowSystem = (registry: Registry) => {
  const entities: { MoveController: MoveController; TransformComponent: TransformComponent }[] =
    registry.getZipper([MoveController, TransformComponent]);

  const scene = sceneManager.getScene()

  if (!scene || !scene.layer) return;

  for (const entity of entities) {
    const viewWidth = scene.layer.width();
    const viewHeight = scene.layer.height();

    const scale = scene.layer.scaleX();

    let targetX = viewWidth / 2 - entity.TransformComponent.x * scale;
    let targetY = viewHeight / 2 - entity.TransformComponent.y * scale;

    targetX = clampCameraAxis(targetX, viewWidth, MAP_BOUNDS.x, MAP_BOUNDS.width, scale);
    targetY = clampCameraAxis(targetY, viewHeight, MAP_BOUNDS.y, MAP_BOUNDS.height, scale);

    const current = scene.layer.position();
    scene.layer.position({
      x: current.x + (targetX - current.x) * CAMERA_SMOOTHING,
      y: current.y + (targetY - current.y) * CAMERA_SMOOTHING
    });
  }
}
