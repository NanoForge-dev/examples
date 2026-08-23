import type { Registry } from "@nanoforge-dev/ecs-client";
import type { Context } from "@nanoforge-dev/common";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";
import { LobbyAction, LobbyStatusComponent } from "../../components/lobby/lobby-status";

export function sendLobbyAction(registry: Registry, ctx: Context) {
  const entities: {LobbyStatusComponent: LobbyStatusComponent}[] = registry.getZipper([LobbyStatusComponent]);
  const network = ctx.libs.getNetwork<NetworkClientLibrary>();

  const firstLobbyStatus = entities[0];
  if (!firstLobbyStatus) return;

  switch (firstLobbyStatus.LobbyStatusComponent.action) {
    case LobbyAction.JOIN_LOBBY:
      network.tcp.sendData(
        new TextEncoder().encode(JSON.stringify({ type: "joinLobby", username: firstLobbyStatus.LobbyStatusComponent.username })),
      );
      break;
    case LobbyAction.START_GAME:
      network.tcp.sendData(
        new TextEncoder().encode(
          JSON.stringify({
            type: "startGame"
          }),
        ),
      );
      break;
  }
  firstLobbyStatus.LobbyStatusComponent.action = LobbyAction.EMPTY;
}