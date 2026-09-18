import type { Registry } from "@nanoforge-dev/ecs-client";
import { TransformComponent } from "../components/essentials/transform.component";
import { ChildrenComponent } from "../components/children.component";
import { Direction } from "../components/direction.component";

export function transformChildrenToParentSystem(registry: Registry) {
  const entities: {
    ChildrenComponent: ChildrenComponent;
    TransformComponent: TransformComponent;
    Direction: Direction;
  }[] = registry.getZipper([ChildrenComponent, TransformComponent, Direction]);

  for (const entity of entities) {
    const parent = registry.entityFromIndex(entity.ChildrenComponent.parentId);
    const parentTransform: TransformComponent | undefined = registry.getEntityComponent(
      parent,
      TransformComponent,
    );
    if (parentTransform) {
      entity.TransformComponent.x =
        parentTransform.x + (entity.ChildrenComponent.options.LocalTransform?.x || 0);
      entity.TransformComponent.y =
        parentTransform.y + (entity.ChildrenComponent.options.LocalTransform?.y || 0);
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