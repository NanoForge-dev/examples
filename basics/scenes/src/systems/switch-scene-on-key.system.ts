import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/input";
import "@nanoforge-dev/scene";

import { SceneSwitchKey } from "../components/scene-switch-key.component";
import { BlueRoom } from "../scenes/blue-room.scene";
import { RedRoom } from "../scenes/red-room.scene";

/**
 * Loads the other room when the key of a `SceneSwitchKey` is pressed, and counts the switches in
 * the persistent `switches` var.
 *
 * @system
 * @side client
 */
export const switchSceneOnKey = (registry: Registry, ctx: Context) => {
  registry.getZipper([SceneSwitchKey]).forEach(({ SceneSwitchKey }) => {
    const down = ctx.input.isKeyPressed((SceneSwitchKey as SceneSwitchKey).key) === true;
    if (down && !SceneSwitchKey.held) {
      void ctx.scenes.load(ctx, ctx.scenes.isLoaded(RedRoom) ? BlueRoom : RedRoom);
      const switches = ctx.scenes.vars.get("switches") ?? 0;
      ctx.scenes.vars.set("switches", switches + 1, { persistent: true });
    }
    SceneSwitchKey.held = down;
  });
};
