import type { Registry } from "@nanoforge-dev/ecs/client";
import type { ServerMessageOf } from "@raid-survival/shared/protocol";

import { LobbyStatusComponent } from "../components/lobby-status.component";

export const lobbyInfoHandler = (
  packet: ServerMessageOf<"lobbyInfo">,
  registry: Registry,
): void => {
  const entities: { LobbyStatusComponent: LobbyStatusComponent }[] = registry.getZipper([
    LobbyStatusComponent,
  ]);
  const firstLobbyStatus = entities[0];

  if (!firstLobbyStatus) return;

  firstLobbyStatus.LobbyStatusComponent.players = [];

  for (const player of packet.players) {
    firstLobbyStatus.LobbyStatusComponent.players.push({
      id: player.id,
      username: player.username,
      skin: player.skin ?? 1,
    });
  }
};
