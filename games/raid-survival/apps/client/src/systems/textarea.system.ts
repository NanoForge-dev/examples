import type { Registry } from "@nanoforge-dev/ecs/client";

import { TextAreaComponent } from "../components/textarea.component";

/**
 * Keeps each text field's DOM textarea in place over its Konva text.
 *
 * @system
 * @side client
 */
export const textareaSystem = async (registry: Registry) => {
  const entities: { TextAreaComponent: TextAreaComponent }[] = registry.getIndexedZipper([
    TextAreaComponent,
  ]);

  for (const entity of entities) {
    entity.TextAreaComponent.sync();
  }
};
