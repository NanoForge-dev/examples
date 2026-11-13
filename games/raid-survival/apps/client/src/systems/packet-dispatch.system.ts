import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";
import "@nanoforge-dev/network/client";
import "@nanoforge-dev/scene";
import { type ServerMessage, ServerPacket } from "@raid-survival/shared/protocol";

import { SERVER_HANDLERS } from "../handlers/handlers";

/** Messages that change the scene: the ones after them wait until the new scene is loaded. */
const SCENE_CHANGES = new Set<ServerMessage["type"]>(["startGame", "gameOver"]);

/**
 * Handles the messages of the server, in the order they came. After a scene change, it keeps the
 * rest in the `backlog` scene var, and waits for the next scene to be loaded and, for a game, for
 * `launchGame` to build its world (the `start` var is then gone).
 *
 * @system
 * @side client
 */
export const packetDispatch = (registry: Registry, ctx: Context) => {
  const backlog = ctx.scenes.vars.get("backlog") ?? [];
  const messages = [...backlog, ...ctx.network.packets.read(ServerPacket).map(({ data }) => data)];
  if (ctx.scenes.vars.has("start")) {
    ctx.scenes.vars.set("backlog", messages, { persistent: true });
    return;
  }
  ctx.scenes.vars.set("backlog", [], { persistent: true });
  for (const [index, message] of messages.entries()) {
    const handler = SERVER_HANDLERS[message.type] as (
      message: ServerMessage,
      registry: Registry,
      ctx: Context,
    ) => void;
    try {
      handler(message, registry, ctx);
    } catch (error) {
      console.error(`[packet:${message.type}]`, error);
    }
    if (SCENE_CHANGES.has(message.type)) {
      ctx.scenes.vars.set("backlog", messages.slice(index + 1), { persistent: true });
      return;
    }
  }
};
