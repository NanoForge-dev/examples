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
import { ChildrenComponent } from "../../components/children.component";
import { Scene } from "../../scenes/Scene";
import { RotationComponent } from "../../components/rotation.component";
import { DirectionRotatorComponent } from "../../components/renderable/direction-rotator.component";
import { Lobby } from "../../components/lobby.component";

function buildPlayer(scene: Scene, playerPacket: any, registry: Registry) {
  const playerEntity = registry.spawnEntity();
  registry.addComponent(playerEntity, new NetworkId(playerPacket.id));
  registry.addComponent(playerEntity, new Direction(0, 0));
  registry.addComponent(
    playerEntity,
    new Position(playerPacket.position.x, playerPacket.position.y),
  );
  registry.addComponent(playerEntity, new Velocity(0, 0));
  registry.addComponent(
    playerEntity,
    new SpriteComponent("player1.png", {
      layer: scene.layer || new Layer(),
      animationsKey: "player-animations.txt",
    }),
  );
  if (playerId === playerPacket.id) {
    registry.addComponent(playerEntity, new MoveController());
    registry.addComponent(playerEntity, new ShootController());
  }

  const hand = registry.spawnEntity();
  registry.addComponent(hand, new Position(playerPacket.position.x, playerPacket.position.y));
  registry.addComponent(
    hand,
    new SpriteComponent("hand.png", {
      layer: scene.layer || new Layer(),
    }),
  );
  registry.addComponent(hand, new ChildrenComponent(playerEntity.getId(), { LocalPosition: {x: 6, y: 12} }));
  registry.addComponent(hand, new RotationComponent(0));
  registry.addComponent(hand, new Direction(0, 0));
  registry.addComponent(hand, new DirectionRotatorComponent(-90));
}

function buildLobby(scene: Scene, lobbyPacket: any, registry: Registry) {
  const lobbyEntity = registry.spawnEntity();
  registry.addComponent(lobbyEntity, new NetworkId(lobbyPacket.id));
  registry.addComponent(
    lobbyEntity,
    new Position(lobbyPacket.position.x, lobbyPacket.position.y),
  );
  registry.addComponent(
    lobbyEntity,
    new SpriteComponent("objects.png", {
      layer: scene.layer || new Layer(),
      animationsKey: "objects-animations.txt",
    }),
  );
  registry.addComponent(lobbyEntity, new Lobby());
}

function launchGame(packet: any, registry: Registry) {
  const newScene = new GameScene();
  sceneManager.switchTo(newScene);

  buildLobby(newScene, packet.lobby, registry);

  for (const player of packet.players) {
    buildPlayer(newScene, player, registry);
  }
}

export function startGamePacketHandler(packet: any, registry: Registry): void {
  const entities: { LobbyStatusComponent: LobbyStatusComponent }[] = registry.getZipper([
    LobbyStatusComponent,
  ]);
  const firstLobbyStatus = entities[0];

  if (!firstLobbyStatus) return;
  launchGame(packet, registry);
}