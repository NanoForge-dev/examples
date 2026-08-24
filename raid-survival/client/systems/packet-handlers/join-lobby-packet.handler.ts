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
    console.error("lobby is full");
  } else if (packet.result === "in game") {
    console.error("lobby is full");
  } else {
    console.log(packet);
  }
}
