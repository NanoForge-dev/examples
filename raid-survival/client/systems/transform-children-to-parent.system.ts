import type { Registry } from "@nanoforge-dev/ecs-client";
import { Position } from "../components/position.component";
import { ChildrenComponent } from "../components/children.component";
import { Direction } from "../components/direction.component";

export function transformChildrenToParentSystem(registry: Registry) {
  const entities: {
    ChildrenComponent: ChildrenComponent;
    Position: Position;
    Direction: Direction;
  }[] = registry.getZipper([ChildrenComponent, Position, Direction]);

  for (const entity of entities) {
    const parent = registry.entityFromIndex(entity.ChildrenComponent.parentId);
    const parentPosition: Position | undefined = registry.getEntityComponent(
      parent,
      Position,
    );
    if (parentPosition) {
      entity.Position.x = parentPosition.x + (entity.ChildrenComponent.options.LocalPosition?.x || 0);
      entity.Position.y =
        parentPosition.y + (entity.ChildrenComponent.options.LocalPosition?.y || 0);
    }
    const parentDirection: Direction | undefined = registry.getEntityComponent(
      parent, Direction
    );
    if (parentDirection) {
      entity.Direction.x = parentDirection.x;
      entity.Direction.y = parentDirection.y;
    }
  }
}