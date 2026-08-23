import { Registry } from "@nanoforge-dev/ecs-client";
import { clients } from "../../main";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { sendToInGamePlayers } from "../../network-utils";

export function joinLobbyPacketHandler(
  clientId: number,
  packet: any,
  _registry: Registry,
  ctx: Context,
): void {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  let connected = false;

  for (const client of clients) {
    if (client.username === packet.username) {
      client.clientId = clientId;
      connected = true;
      break;
    }
  }

  if (!connected && clients.length > 3) {
    network.tcp.sendToClient(
      clientId,
      new TextEncoder().encode(JSON.stringify({ type: "joinLobby", result: "full" })),
    );
    return;
  }
  if (!connected) {
    clients.push({
      username: packet.username,
      clientId: clientId,
      entityId: -1
    });
    connected = true
  }
  if (!connected) {
    network.tcp.sendToClient(
      clientId,
      new TextEncoder().encode(JSON.stringify({ type: "joinLobby", result: "Internal Server Error" })),
    );
    return;
  }
  network.tcp.sendToClient(
    clientId,
    new TextEncoder().encode(
      JSON.stringify({
        type: "joinLobby",
        result: "success",
        players: clients.map((client) => {
          return {
            id: client.clientId,
            username: client.username
          }
        }),
      }),
    ),
  );
  sendToInGamePlayers(network, {
    type: "lobbyInfo",
    players: clients.map((client) => {
      return {
        id: client.clientId,
        username: client.username,
      };
    }),
  });
}
