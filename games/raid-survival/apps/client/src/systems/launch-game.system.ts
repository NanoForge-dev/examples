import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";
import "@nanoforge-dev/scene";

import { buildWorld } from "../build-world";

/**
 * Builds the game from the `startGame` message (the `start` scene var), once, then lets
 * `packetDispatch` handle the messages that came after it.
 *
 * @system
 * @side client
 */
export const launchGame = (registry: Registry, ctx: Context) => {
  const start = ctx.scenes.vars.get("start");
  if (!start) return;
  ctx.scenes.vars.remove("start");
  buildWorld(registry, ctx, start);
};
