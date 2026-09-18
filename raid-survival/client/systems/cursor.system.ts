import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";

import { CursorComponent } from "../components/cursor.component";
import { TransformComponent } from "../components/essentials/transform.component";
import { SpriteComponent } from "../components/renderable/sprite.component";
import { BuildModeComponent } from "../components/build-mode.component";

export const CURSOR_ICON_SIZE = { width: 8, height: 8 };
export const CURSOR_SCALE = 3;

// Follows the mouse every tick with a custom crosshair, replacing the OS cursor. Build mode wants
// the normal OS cursor instead - this system steps back entirely rather than fighting it.
export function cursorSystem(registry: Registry, ctx: Context) {
  const cursors: { SpriteComponent: SpriteComponent; TransformComponent: TransformComponent }[] =
    registry.getZipper([CursorComponent, SpriteComponent, TransformComponent]);
  const cursor = cursors[0];
  if (!cursor) return;

  const buildModeEntities: { BuildModeComponent: BuildModeComponent }[] = registry.getZipper([
    BuildModeComponent,
  ]);
  const buildModeActive = buildModeEntities[0]?.BuildModeComponent.active ?? false;

  cursor.SpriteComponent.sprite?.visible(!buildModeActive);

  const graphics = ctx.libs.getGraphics<Graphics2DLibrary>();

  if (buildModeActive) {
    // Only replaces "none" (the crosshair's state) so this doesn't fight the build bar's own
    // hover styles - a fallback in case build mode became active without the normal toggle edge.
    if (graphics.stage.container().style.cursor === "none") {
      graphics.stage.container().style.cursor = "default";
    }
    return;
  }

  const pointerPosition = graphics.stage.getPointerPosition();
  if (!pointerPosition) return;

  // spriteSystem already centers X for every sprite, but leaves offsetY at 0 (top-anchored) -
  // only Y needs a manual offset here.
  cursor.TransformComponent.x = pointerPosition.x;
  cursor.TransformComponent.y = pointerPosition.y - (CURSOR_ICON_SIZE.height * CURSOR_SCALE) / 2;
}

// * Required to generate code
export default cursorSystem.name;
