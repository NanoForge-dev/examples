import { Registry } from "@nanoforge-dev/ecs-client";
import { clients, gameStatus, GameStatusEnum } from "../../main";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { sendToInGamePlayers } from "../../network-utils";
import { Position } from "../../components/position.component";
import { Direction } from "../../components/direction.component";
import { Velocity } from "../../components/velocity.component";
import { Login } from "../../components/clientId.component";
import { Vector2d } from "@nanoforge-dev/graphics-2d";

const playerSpawners: Vector2d[] = [
  {x: -50, y: -50},
  {x: 50, y: -50},
  {x: -50, y: 50},
  {x: 50, y: 50},
]

export function startGamePacketHandler(
  _clientId: number,
  _packet: any,
  registry: Registry,
  ctx: Context,
): void {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  if (gameStatus.status === GameStatusEnum.InGame) return;
  gameStatus.status = GameStatusEnum.InGame;

  const playersInformation: {id: number, username: string, position: Vector2d}[] = []

  clients.forEach((client, index) => {
    const player = registry.spawnEntity();
    const playerSpawn = playerSpawners[index];

    if (playerSpawn) {
      client.entityId = player.getId();
      registry.addComponent(player, new Direction(1, 0));
      registry.addComponent(player, new Login(client.username));
      registry.addComponent(player, new Position(playerSpawn.x, playerSpawn.y));
      registry.addComponent(player, new Velocity(0, 0));
      playersInformation.push({
        id: client.clientId,
        username: client.username,
        position: playerSpawn,
      })
    }
  });

  sendToInGamePlayers(network, {
    type: "startGame",
    players: playersInformation,
  });
}
