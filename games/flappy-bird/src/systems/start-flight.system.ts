import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";
import "@nanoforge-dev/sound";

import { flapPressed } from "../flap-pressed";
import { Play } from "../scenes/play.scene";

/**
 * Starts the flight at the first flap: Space, a click or a tap.
 *
 * @system
 * @side client
 */
export const startFlight = (_registry: Registry, ctx: Context) => {
  if (!flapPressed(ctx)) return;
  ctx.sound.play("swoosh");
  ctx.sound.play("wing");
  void ctx.scenes.load(ctx, Play);
};
