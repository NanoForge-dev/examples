import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";
import { type ClientMessageOf, normalizeUsername } from "@raid-survival/shared/protocol";

import { broadcast, sendTo } from "../broadcast";
import { Client } from "../components/client.component";
import { inGame, lobbyClients } from "../queries";

const MAX_PLAYERS = 4;

/**
 * Adds a player to the lobby, or takes back the place of one who left under the same name. A
 * session that already has a seat keeps it, under the new name and skin.
 */
export const joinLobbyHandler = (
  clientId: string,
  packet: ClientMessageOf<"joinLobby">,
  registry: Registry,
  ctx: Context,
): void => {
  const skin =
    Number.isInteger(packet.skin) && packet.skin >= 1 && packet.skin <= 3 ? packet.skin : 1;
  if (typeof packet.username !== "string") return;
  const username = normalizeUsername(packet.username);
  if (!username) return;

  // A game in progress never accepts joins: there's no way to hand a joiner a character until
  // the next start.
  if (inGame(registry)) {
    sendTo(ctx, clientId, { type: "joinLobby", result: "in game" });
    return;
  }

  const clients = lobbyClients(registry);
  // A session holds one seat: joining again renames it, so one connection can't take them all.
  const own = clients.find(({ Client: client }) => client.clientId === clientId);
  const known = clients.find(({ Client: client }) => client.username === username);

  // A username match only means "reconnect" when that player's session is actually gone, checked
  // against the live sessions rather than the `connected` flag, which lags a tick behind. A second
  // open session under the same name is refused: taking the place over would orphan the first.
  // A session that already has a seat can't take another one's name, even a disconnected one.
  const connected = ctx.network.getConnectedClients();
  if (known && known.id !== own?.id && (own || connected.includes(known.Client.clientId))) {
    sendTo(ctx, clientId, { type: "joinLobby", result: "username taken" });
    return;
  }

  const seat = own ?? known;
  if (!seat && clients.length >= MAX_PLAYERS) {
    sendTo(ctx, clientId, { type: "joinLobby", result: "full" });
    return;
  }

  if (seat) {
    seat.Client.clientId = clientId;
    seat.Client.username = username;
    seat.Client.connected = true;
    seat.Client.skin = skin;
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
