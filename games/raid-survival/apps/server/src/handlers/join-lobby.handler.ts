import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";
import type { ClientMessageOf } from "@raid-survival/shared/protocol";

import { broadcast, sendTo } from "../broadcast";
import { Client } from "../components/client.component";
import { inGame, lobbyClients } from "../queries";

const MAX_PLAYERS = 4;
const MAX_USERNAME_LENGTH = 24;

/** Adds a player to the lobby, or takes back the place of one who left under the same name. */
export const joinLobbyHandler = (
  clientId: string,
  packet: ClientMessageOf<"joinLobby">,
  registry: Registry,
  ctx: Context,
): void => {
  const skin =
    Number.isInteger(packet.skin) && packet.skin >= 1 && packet.skin <= 3 ? packet.skin : 1;
  if (typeof packet.username !== "string") return;
  const username = packet.username.trim().slice(0, MAX_USERNAME_LENGTH);
  if (!username) return;

  // A game in progress never accepts joins: there's no way to hand a joiner a character until
  // the next start.
  if (inGame(registry)) {
    sendTo(ctx, clientId, { type: "joinLobby", result: "in game" });
    return;
  }

  const clients = lobbyClients(registry);
  const known = clients.find(({ Client: client }) => client.username === username);

  // A username match only means "reconnect" when that player's session is actually gone, checked
  // against the live sessions rather than the `connected` flag, which lags a tick behind. A second
  // open session under the same name is refused: taking the place over would orphan the first.
  const connected = ctx.network.getConnectedClients();
  if (
    known &&
    known.Client.clientId !== clientId &&
    connected.includes(known.Client.clientId)
  ) {
    sendTo(ctx, clientId, { type: "joinLobby", result: "username taken" });
    return;
  }

  if (!known && clients.length >= MAX_PLAYERS) {
    sendTo(ctx, clientId, { type: "joinLobby", result: "full" });
    return;
  }

  if (known) {
    known.Client.clientId = clientId;
    known.Client.connected = true;
    known.Client.skin = skin;
  } else {
    registry.addComponent(registry.spawnEntity(), new Client(clientId, username, skin));
  }

  const players = lobbyClients(registry).map(({ id, Client: client }) => ({
    id,
    username: client.username,
    skin: client.skin,
  }));
  sendTo(ctx, clientId, { type: "joinLobby", result: "success", players });
  broadcast(ctx, { type: "lobbyInfo", players });
};
