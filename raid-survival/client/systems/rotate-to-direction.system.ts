import type { Registry } from "@nanoforge-dev/ecs-client";
import { Direction } from "../components/direction.component";
import { DirectionRotatorComponent } from "../components/direction-rotator.component";
import { TransformComponent } from "../components/essentials/transform.component";

export function rotateToDirectionSystem(registry: Registry) {
  const entities: {
    TransformComponent: TransformComponent;
    Direction: Direction;
    DirectionRotatorComponent: DirectionRotatorComponent;
  }[] = registry.getZipper([TransformComponent, Direction, DirectionRotatorComponent]);

  for (const entity of entities) {
    if (!entity.DirectionRotatorComponent.enable) return;
    entity.TransformComponent.rotation =
      (Math.atan2(entity.Direction.y, entity.Direction.x) * 180) / Math.PI +
      entity.DirectionRotatorComponent.offset;
  }
}