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
    if (client.clientLogin === packet.login) {
      client.clientId = clientId;
      connected = true;
      break;
    }
    if (client.clientId !== -1) continue;
    client.clientLogin = packet.login;
    client.clientId = clientId;
    connected = true;
    break;
  }
  if (!connected) {
    network.tcp.sendToClient(
      clientId,
      new TextEncoder().encode(JSON.stringify({ type: "joinLobby", result: "full" })),
    );
  }
  network.tcp.sendToClient(
    clientId,
    new TextEncoder().encode(
      JSON.stringify({
        type: "joinLobby",
        result: "success",
        playerNumber: clients.filter(({ clientId }) => clientId !== -1).length,
      }),
    ),
  );
  sendToInGamePlayers(network, {
    type: "lobbyInfo",
    playerNumber: clients.filter(({ clientId }) => clientId !== -1).length,
  });
}
