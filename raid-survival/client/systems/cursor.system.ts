import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";

import { CursorComponent } from "../components/cursor.component";
import { TransformComponent } from "../components/essentials/transform.component";
import { SpriteComponent } from "../components/renderable/sprite.component";
import { BuildModeComponent } from "../components/build-mode.component";

// Native crosshair crop (ui-crosshair-animations.txt), and the scale it's rendered at on the
// unscaled hudLayer - an 8x8 source icon at 1:1 would be nearly invisible.
export const CURSOR_ICON_SIZE = { width: 8, height: 8 };
export const CURSOR_SCALE = 3;

// Follows the mouse every tick with a custom crosshair, replacing the OS cursor (hidden by
// GameScene.load). Build mode wants a normal, precise OS cursor instead (see
// build-mode.system.ts, which owns style.cursor for that case on the toggle edge, and
// start-game-packet.handler.ts's build-bar hover/mouseout handlers, which own it moment-to-moment
// while build mode stays active) - this system steps back entirely rather than fighting them.
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
    // Guarded on the current value, not asserted unconditionally, so this doesn't fight the build
    // bar's own "pointer" hover style (start-game-packet.handler.ts) - it only ever steps in to
    // replace "none" (the crosshair's state), which build-mode.system.ts's toggle-edge set
    // already avoids in the normal case; this is the fallback for build mode being active by any
    // other path (e.g. before the first B press), so the OS cursor is never left hidden with no
    // crosshair to replace it.
    if (graphics.stage.container().style.cursor === "none") {
      graphics.stage.container().style.cursor = "default";
    }
    return;
  }

  const pointerPosition = graphics.stage.getPointerPosition();
  if (!pointerPosition) return;

  // spriteSystem already centers X for every sprite (it sets offsetX to half the sprite's
  // width), so TransformComponent.x can just be the raw pointer X - only Y needs a manual offset
  // here, since spriteSystem leaves offsetY at 0 (top-anchored).
  cursor.TransformComponent.x = pointerPosition.x;
  cursor.TransformComponent.y = pointerPosition.y - (CURSOR_ICON_SIZE.height * CURSOR_SCALE) / 2;
}

// * Required to generate code
export default cursorSystem.name;
