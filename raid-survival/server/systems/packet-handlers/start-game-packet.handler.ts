import { Registry } from "@nanoforge-dev/ecs-client";
import { clients, gameStatus, GameStatusEnum } from "../../main";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { sendToInGamePlayers } from "../../network-utils";
import { Position } from "../../components/position.component";
import { Direction } from "../../components/direction.component";
import { Velocity } from "../../components/velocity.component";
import { Login } from "../../components/clientId.component";

export function startGamePacketHandler(
  _clientId: number,
  _packet: any,
  registry: Registry,
  ctx: Context,
): void {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  if (gameStatus.status === GameStatusEnum.InGame) return;
  gameStatus.status = GameStatusEnum.InGame;

  sendToInGamePlayers(network, {
    type: "spawn",
    entityType: "map",
    position: { x: 0, y: 0 },
  });

  clients.forEach((client, index) => {
    if (client.clientId === -1) return;
    const player = registry.spawnEntity();

    client.entityId = player.getId();
    registry.addComponent(player, new Direction(1, 0));
    registry.addComponent(player, new Login(client.clientLogin));
    registry.addComponent(player, new Position(500 + 100 * index, 100));
    registry.addComponent(player, new Velocity(0, 0));
    sendToInGamePlayers(network, {
      type: "spawn",
      entityType: "player",
      position: { x: 500 + 100 * index, y: 100 },
      velocity: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
      login: client.clientLogin,
      id: player.getId(),
    });
  });
}
