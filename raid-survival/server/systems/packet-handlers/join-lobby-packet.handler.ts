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

  const skin = Number.isInteger(packet.skin) && packet.skin >= 1 && packet.skin <= 3 ? packet.skin : 1;

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
              skin: client.skin,
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
        skin: client.skin,
      })),
    });
  }

  // A game in progress never accepts joins - there's no way to hand a joiner a character until
  // the next startGame call.
  if (gameStatus.status === GameStatusEnum.InGame) {
    network.tcp.sendToClient(
      clientId,
      new TextEncoder().encode(JSON.stringify({ type: "joinLobby", result: "in game" })),
    );
    return;
  }

  let client = clients.find((c) => c.username === packet.username);

  // A username match only means "reconnect" when that entry's original connection is actually
  // gone - checked against the live connected-client list, not the `client.connected` flag
  // (which lags a tick behind and would otherwise reject a fast rejoin under your own name). A
  // genuine second, still-open connection with the same name is still rejected: reusing that
  // entry would silently orphan the first connection and hand the second one none of the first
  // player's in-progress game state.
  const connectedClientIds = network.tcp.getConnectedClients();
  if (client && client.clientId !== clientId && connectedClientIds.includes(client.clientId)) {
    network.tcp.sendToClient(
      clientId,
      new TextEncoder().encode(JSON.stringify({ type: "joinLobby", result: "username taken" })),
    );
    return;
  }

  if (!client && clients.length >= 4) {
    network.tcp.sendToClient(
      clientId,
      new TextEncoder().encode(JSON.stringify({ type: "joinLobby", result: "full" })),
    );
    return;
  }

  if (client) {
    client.clientId = clientId;
    client.connected = true;
    client.skin = skin;
    // A returning client needs a fresh entity - whatever it held before may no longer exist.
    client.entityId = _registry.spawnEntity().getId();
  } else {
    client = {
      username: packet.username,
      clientId,
      entityId: _registry.spawnEntity().getId(),
      connected: true,
      skin,
    };
    clients.push(client);
  }

  sendJoinLobbyInfo();
}
