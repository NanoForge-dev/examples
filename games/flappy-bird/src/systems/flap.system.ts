import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";
import "@nanoforge-dev/sound";

import { Bird } from "../components/bird.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { flapPressed } from "../flap-pressed";

/**
 * Makes the bird flap up when the player presses Space, clicks or taps.
 *
 * @remarks
 * It leaves the presses to the game over screen once `over` exists: a press is seen only once.
 *
 * @system
 * @side client
 */
export const flap = (registry: Registry, ctx: Context) => {
  if (ctx.scenes.vars.has("over") || !flapPressed(ctx)) return;

  registry.getZipper([Bird, Velocity2D]).forEach(({ Bird, Velocity2D }) => {
    if (Bird.dead) return;
    Velocity2D.y = -Bird.flapSpeed;
    ctx.sound.play("wing");
  });
};
