import "@nanoforge-dev/network/client";
import { ClientPacket } from "@raid-survival/shared/protocol";
import type { Registry } from "@nanoforge-dev/ecs/client";
import type { Context } from "@nanoforge-dev/common";
import { LobbyAction, LobbyStatusComponent } from "../components/lobby-status.component";

export const lobbyActionSenders = (registry: Registry, ctx: Context) => {
  const entities: { LobbyStatusComponent: LobbyStatusComponent }[] = registry.getZipper([
    LobbyStatusComponent,
  ]);

  const firstLobbyStatus = entities[0];
  if (!firstLobbyStatus) return;

  switch (firstLobbyStatus.LobbyStatusComponent.action) {
    case LobbyAction.JOIN_LOBBY:
      ctx.network.packets.send(ClientPacket, {
        type: "joinLobby",
        username: firstLobbyStatus.LobbyStatusComponent.username,
        skin: firstLobbyStatus.LobbyStatusComponent.skin,
      });
      break;
    case LobbyAction.START_GAME:
      ctx.network.packets.send(ClientPacket, {
        type: "startGame",
      });
      break;
  }
  firstLobbyStatus.LobbyStatusComponent.action = LobbyAction.EMPTY;
};
