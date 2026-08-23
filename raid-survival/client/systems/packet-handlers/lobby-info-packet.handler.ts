import { Registry } from "@nanoforge-dev/ecs-client";
import { LobbyStatusComponent } from "../../components/lobby/lobby-status";

export function lobbyInfoPacketHandler(packet: any, registry: Registry): void {
  const entities: { LobbyStatusComponent: LobbyStatusComponent }[] = registry.getZipper([
    LobbyStatusComponent,
  ]);
  const firstLobbyStatus = entities[0];

  if (!firstLobbyStatus) return;

  firstLobbyStatus.LobbyStatusComponent.players = [];

  for (const player of packet.players) {
    firstLobbyStatus.LobbyStatusComponent.players.push({id: player.id, username: player.username})
  }
}
