import { type Registry } from "@nanoforge-dev/ecs-client";
import { PointerComponent } from "../components/pointer.component";
import { WorldLayer } from "../main";

export const pointerSystem = (registry: Registry) => {
  const entities: {PointerComponent: PointerComponent}[] = registry.getZipper([PointerComponent]);

  for (const entity of entities) {
    const pointerPosition = WorldLayer.getRelativePointerPosition();

    if (!pointerPosition) continue;

    entity.PointerComponent.position.x = pointerPosition.x;
    entity.PointerComponent.position.y = pointerPosition.y;
  }
};

// * Required to generate code
export default pointerSystem.name;
