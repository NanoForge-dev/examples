import { Registry } from "@nanoforge-dev/ecs-client";
import { LobbyState, LobbyStatusComponent } from "../../components/lobby/lobby-status";
import {setPlayerId} from "../../main";

export function joinLobbyPacketHandler(packet: any, registry: Registry): void {
  const entities: { LobbyStatusComponent: LobbyStatusComponent }[] = registry.getZipper([
    LobbyStatusComponent,
  ]);
  const firstLobbyStatus = entities[0];

  if (!firstLobbyStatus) return;

  if (packet.result === "success") {
    firstLobbyStatus.LobbyStatusComponent.state = LobbyState.JOINED;
    firstLobbyStatus.LobbyStatusComponent.error = null;
    firstLobbyStatus.LobbyStatusComponent.players = [];
    for (const player of packet.players) {
      firstLobbyStatus.LobbyStatusComponent.players.push({
        id: player.id,
        username: player.username,
      });
      if (player.username === firstLobbyStatus.LobbyStatusComponent.username)
        setPlayerId(player.id);
    }
  } else if (packet.result === "full") {
    firstLobbyStatus.LobbyStatusComponent.error = "Lobby is full.";
  } else if (packet.result === "in game") {
    firstLobbyStatus.LobbyStatusComponent.error = "A game is already in progress - please wait for it to end.";
  } else {
    console.log(packet);
  }
}
