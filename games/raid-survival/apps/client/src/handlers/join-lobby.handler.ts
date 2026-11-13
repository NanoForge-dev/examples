import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";
import "@nanoforge-dev/scene";
import type { ServerMessageOf } from "@raid-survival/shared/protocol";

import { LobbyState, LobbyStatusComponent } from "../components/lobby-status.component";

export const joinLobbyHandler = (
  packet: ServerMessageOf<"joinLobby">,
  registry: Registry,
  ctx: Context,
): void => {
  const entities: { LobbyStatusComponent: LobbyStatusComponent }[] = registry.getZipper([
    LobbyStatusComponent,
  ]);
  const firstLobbyStatus = entities[0];

  if (!firstLobbyStatus) return;

  if (packet.result === "success") {
    firstLobbyStatus.LobbyStatusComponent.state = LobbyState.JOINED;
    firstLobbyStatus.LobbyStatusComponent.error = null;
    firstLobbyStatus.LobbyStatusComponent.players = [];
    for (const player of packet.players ?? []) {
      firstLobbyStatus.LobbyStatusComponent.players.push({
        id: player.id,
        username: player.username,
        skin: player.skin ?? 1,
      });
      if (player.username === firstLobbyStatus.LobbyStatusComponent.username)
        ctx.scenes.vars.set("playerId", player.id, { persistent: true });
    }
  } else if (packet.result === "full") {
    firstLobbyStatus.LobbyStatusComponent.error = "Lobby is full.";
  } else if (packet.result === "in game") {
    firstLobbyStatus.LobbyStatusComponent.error =
      "A game is already in progress - please wait for it to end.";
  } else if (packet.result === "username taken") {
    firstLobbyStatus.LobbyStatusComponent.error =
      "That username is already taken - pick another one.";
  }
};
