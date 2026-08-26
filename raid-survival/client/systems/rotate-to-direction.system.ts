import type { Registry } from "@nanoforge-dev/ecs-client";
import { Direction } from "../components/direction.component";
import { RotationComponent } from "../components/rotation.component";
import { DirectionRotatorComponent } from "../components/renderable/direction-rotator.component";

export function rotateToDirectionSystem(registry: Registry) {
  const entities: {
    RotationComponent: RotationComponent;
    Direction: Direction;
    DirectionRotatorComponent: DirectionRotatorComponent;
  }[] = registry.getZipper([RotationComponent, Direction, DirectionRotatorComponent]);

  for (const entity of entities) {
    if (!entity.DirectionRotatorComponent.enable) return;
    entity.RotationComponent.angle =
      (Math.atan2(entity.Direction.y, entity.Direction.x) * 180) / Math.PI + entity.DirectionRotatorComponent.offset;
  }
}