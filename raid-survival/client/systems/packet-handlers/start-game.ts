import { Registry } from "@nanoforge-dev/ecs-client";
import { LobbyStatusComponent } from "../../components/lobby/lobby-status";
import { playerId, sceneManager } from "../../main";
import { GameScene } from "../../scenes/GameScene";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { Position } from "../../components/position.component";
import { Velocity } from "../../components/velocity.component";
import { MoveController } from "../../components/move-controller.component";
import { Layer } from "@nanoforge-dev/graphics-2d";
import { NetworkId } from "../../components/network-id.component";
import { Direction } from "../../components/direction.component";
import { ShootController } from "../../components/shoot.controller";

export function startGamePacketHandler(packet: any, registry: Registry): void {
  const entities: { LobbyStatusComponent: LobbyStatusComponent }[] = registry.getZipper([
    LobbyStatusComponent,
  ]);
  const firstLobbyStatus = entities[0];

  if (!firstLobbyStatus) return;

  const newScene = new GameScene();
  sceneManager.switchTo(newScene);
  
  for (const player of packet.players) {
    const playerEntity = registry.spawnEntity();
    registry.addComponent(playerEntity, new NetworkId(player.id));
    registry.addComponent(playerEntity, new Direction(0, 0));
    registry.addComponent(playerEntity, new Position(player.position.x, player.position.y));
    registry.addComponent(playerEntity, new Velocity(0, 0));
    registry.addComponent(
      playerEntity,
      new SpriteComponent("player4.png", {
        layer: newScene.layer || new Layer(),
        animationsKey: "player-animations.txt"
      }),
    );
    if (playerId === player.id) {
      registry.addComponent(playerEntity, new MoveController());
      registry.addComponent(playerEntity, new ShootController());
    }
  }
}