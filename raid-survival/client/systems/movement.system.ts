import { type Context } from "@nanoforge-dev/common";
import { type EditorSystemManifest, type Registry } from "@nanoforge-dev/ecs-client";
import { PositionComponent } from "../components/position.component";
import { VelocityComponent } from "../components/velocity.component";

export const movementSystem = (registry: Registry, ctx: Context) => {
  const entities: { PositionComponent: PositionComponent; VelocityComponent: VelocityComponent }[] =
    registry.getZipper([PositionComponent, VelocityComponent]);

  const dt = ctx.app.delta / 1000;

  for (const entity of entities) {
    entity.PositionComponent.x += entity.VelocityComponent.x * dt;
    entity.PositionComponent.y += entity.VelocityComponent.y * dt;
  }
};

// * Required to generate code
export default movementSystem.name;

// * Required for the editor to display the system and generate code
export const EDITOR_SYSTEM_MANIFEST: EditorSystemManifest = {
  name: "movement",
  description:
    "This system end the game when paramB reaches 0 for any entity with ExampleComponent",
  dependencies: ["ExampleComponent"],
};
