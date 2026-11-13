import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";
import "@nanoforge-dev/network/server";
import { type ClientMessage, ClientPacket } from "@raid-survival/shared/protocol";

import { CLIENT_HANDLERS } from "../handlers/handlers";
import { lobbyClients } from "../queries";

/**
 * Handles the messages the clients sent since the last tick, in the order they arrived, and marks
 * the players whose session closed as disconnected.
 *
 * @remarks
 * A message is untrusted: each handler checks its fields, and one that throws is logged and
 * skipped, so a malformed message never stops the tick.
 *
 * @system
 * @side server
 */
export const packetDispatch = (registry: Registry, ctx: Context) => {
  const connected = ctx.network.getConnectedClients();
  for (const { Client: client } of lobbyClients(registry))
    if (!connected.includes(client.clientId)) client.connected = false;

  for (const { clientId, data } of ctx.network.packets.read(ClientPacket)) {
    const handler = CLIENT_HANDLERS[data.type] as
      | ((clientId: string, message: ClientMessage, registry: Registry, ctx: Context) => void)
      | undefined;
    try {
      handler?.(clientId, data, registry, ctx);
    } catch (error) {
      console.error(`[packet:${data.type}] from ${clientId}`, error);
    }
  }
};
