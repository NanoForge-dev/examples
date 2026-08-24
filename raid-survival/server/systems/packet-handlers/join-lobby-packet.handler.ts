import { Registry } from "@nanoforge-dev/ecs-client";
import { clients, gameStatus, GameStatusEnum } from "../../main";
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

  function sendJoinLobbyInfo() {
    network.tcp.sendToClient(
      clientId,
      new TextEncoder().encode(
        JSON.stringify({
          type: "joinLobby",
          result: "success",
          players: clients.map((client) => {
            return {
              id: client.entityId,
              username: client.username,
            };
          }),
        }),
      ),
    );

    sendToInGamePlayers(network, {
      type: "lobbyInfo",
      players: clients.map((client) => ({
        id: client.entityId,
        username: client.username,
      })),
    });
  }

  if (gameStatus.status === GameStatusEnum.InGame) {
    if (
      clients.find((client) => {
        return client.username === packet.username;
      }) === undefined
    )
      sendJoinLobbyInfo();
    else {
      network.tcp.sendToClient(
        clientId,
        new TextEncoder().encode(JSON.stringify({ type: "joinLobby", result: "in game" })),
      );
    }
    return;
  }

  let connected = false;
  for (const client of clients) {
    if (client.username === packet.username) {
      client.clientId = clientId;
      connected = true;
      break;
    }
  }

  if (!connected && clients.length >= 4) {
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
      entityId: -1,
      connected: true,
    });
    sendJoinLobbyInfo();
  }
}
