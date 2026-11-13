import type { Context } from "@nanoforge-dev/common";
import "@nanoforge-dev/network/server";
import { type ServerMessage, ServerPacket } from "@raid-survival/shared/protocol";

import { Client } from "./components/client.component";

/** Sends a message to every connected player of the lobby or the game. */
export const broadcast = (ctx: Context, message: ServerMessage): void => {
  // Disconnected players stay in the lobby until the game ends: sending to a dead session only
  // logs, but at bullet frequency the log alone stalls the tick loop.
  for (const { Client: client } of ctx.ecs.registry.getZipper([Client]) as { Client: Client }[])
    if (client.connected) ctx.network.packets.sendToClient(client.clientId, ServerPacket, message);
};

/** Sends a message to one player. */
export const sendTo = (ctx: Context, clientId: string, message: ServerMessage): void =>
  ctx.network.packets.sendToClient(clientId, ServerPacket, message);
