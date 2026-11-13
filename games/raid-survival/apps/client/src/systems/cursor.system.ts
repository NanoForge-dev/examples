import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";
import "@nanoforge-dev/graphics-2d";

import { CURSOR_ICON_SIZE, CURSOR_SCALE } from "../hud-layout";
import { CursorComponent } from "../components/cursor.component";
import { TransformComponent } from "../components/transform.component";
import { SpriteComponent } from "../components/sprite.component";
import { BuildModeComponent } from "../components/build-mode.component";

// Follows the mouse every tick with a custom crosshair, replacing the OS cursor. Build mode wants
// the normal OS cursor instead - this system steps back entirely rather than fighting it.
export const cursorSystem = (registry: Registry, ctx: Context) => {
  const cursors: { SpriteComponent: SpriteComponent; TransformComponent: TransformComponent }[] =
    registry.getZipper([CursorComponent, SpriteComponent, TransformComponent]);
  const cursor = cursors[0];
  if (!cursor) return;

  const buildModeEntities: { BuildModeComponent: BuildModeComponent }[] = registry.getZipper([
    BuildModeComponent,
  ]);
  const buildModeActive = buildModeEntities[0]?.BuildModeComponent.active ?? false;

  cursor.SpriteComponent.sprite?.visible(!buildModeActive);

  const graphics = ctx.graphics;

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
};
