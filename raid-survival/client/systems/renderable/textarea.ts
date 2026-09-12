import type { Registry } from "@nanoforge-dev/ecs-client";
import { TextAreaComponent } from "../../components/renderable/textarea.component";

export const textareaSystem = async (registry: Registry) => {
  const entities: {TextAreaComponent: TextAreaComponent}[] = registry.getIndexedZipper([TextAreaComponent]);

  for (const entity of entities) {
    entity.TextAreaComponent.sync();
  }
}