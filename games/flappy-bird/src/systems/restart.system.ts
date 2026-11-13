import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";
import "@nanoforge-dev/sound";

import { RestartDelay } from "../components/restart-delay.component";
import { flapPressed } from "../flap-pressed";
import { Play } from "../scenes/play.scene";

/**
 * Starts a new flight at the first flap once the `RestartDelay` is over.
 *
 * @system
 * @side client
 */
export const restart = (registry: Registry, ctx: Context) => {
  const pressed = flapPressed(ctx);

  registry.getZipper([RestartDelay]).forEach(({ RestartDelay }) => {
    RestartDelay.elapsed += ctx.app.delta / 1000;
    if (!pressed || RestartDelay.elapsed < RestartDelay.seconds) return;
    ctx.sound.play("swoosh");
    ctx.sound.play("wing");
    // Unloading `Play` (and this screen) then loading it again gives a new bird and new pipes.
    void ctx.scenes.unload(ctx, Play);
    void ctx.scenes.load(ctx, Play);
  });
};
