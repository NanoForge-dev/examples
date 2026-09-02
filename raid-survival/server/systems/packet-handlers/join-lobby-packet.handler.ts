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

  // A game in progress never accepts joins - there's no way to hand a joiner a character until
  // the next startGame call, known username or not (a "known" one only means they were in a
  // *previous* game; game-over.system.ts empties `clients` the moment a game ends, so nobody
  // is ever "known" while one is actually running). Rejecting unconditionally also covers the
  // player who retries just after someone else already restarted without them - same result,
  // clearly reported rather than left to hang.
  if (gameStatus.status === GameStatusEnum.InGame) {
    network.tcp.sendToClient(
      clientId,
      new TextEncoder().encode(JSON.stringify({ type: "joinLobby", result: "in game" })),
    );
    return;
  }

  let client = clients.find((c) => c.username === packet.username);

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
    // A returning client (e.g. after a finished game reset everything via
    // registry.clearEntities() in game-over.system.ts) needs a fresh entity - whatever it held
    // before may no longer exist, and reusing a dead entity id is unsafe.
    client.entityId = _registry.spawnEntity().getId();
  } else {
    client = {
      username: packet.username,
      clientId,
      entityId: _registry.spawnEntity().getId(),
      connected: true,
    };
    clients.push(client);
  }

  sendJoinLobbyInfo();
}
