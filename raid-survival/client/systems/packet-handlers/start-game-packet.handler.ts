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
import { Health } from "../../components/health.component";
import { HealthBarFill } from "../../components/health-bar-fill.component";

// Native player sprite size (player-animations.txt, unscaled).
const PLAYER_SPRITE_SIZE = { width: 24, height: 24 };

// Native size of the truck+house crop defined in objects-animations.txt's "idle" frame.
const LOBBY_SPRITE_SIZE = { width: 187, height: 143 };

// ui.png health bar sprites (see health-bar-frame-animations.txt / health-bar-fill-animations.txt).
const HEALTH_BAR_FRAME_SIZE = { width: 23, height: 6 };
const HEALTH_BAR_FILL_SIZE = { width: 12, height: 2 };
// Where the fill sits inside the frame, in frame-local pixels (the frame's black/white border
// leaves this gray cavity for the fill to sit in).
const HEALTH_BAR_FILL_CAVITY = { x: 2, y: 2, width: 19, height: 2 };
// Scale needed to stretch the fill sprite's native width up to the cavity's width at 100% health.
const HEALTH_BAR_FILL_MAX_SCALE_X = HEALTH_BAR_FILL_CAVITY.width / HEALTH_BAR_FILL_SIZE.width;
// Vertical gap between the health bar and the top of whatever it's attached to.
const HEALTH_BAR_GAP_ABOVE = 10;

function buildHealthBar(
  scene: Scene,
  registry: Registry,
  parentEntity: ReturnType<Registry["spawnEntity"]>,
  parentWidth: number,
  health: { current: number; max: number },
) {
  const layer = scene.layer || new Layer();
  const frameLocalX = (parentWidth - HEALTH_BAR_FRAME_SIZE.width) / 2;
  const frameLocalY = -HEALTH_BAR_GAP_ABOVE;

  const frame = registry.spawnEntity();
  registry.addComponent(frame, new Position(0, 0));
  registry.addComponent(
    frame,
    new SpriteComponent("ui.png", { layer, animationsKey: "health-bar-frame-animations.txt" }),
  );
  registry.addComponent(
    frame,
    new ChildrenComponent(parentEntity.getId(), { LocalPosition: { x: frameLocalX, y: frameLocalY } }),
  );
  registry.addComponent(frame, new Direction(0, 0));

  const fraction = health.max > 0 ? health.current / health.max : 0;
  const fillScaleX = HEALTH_BAR_FILL_MAX_SCALE_X * fraction;
  // SpriteComponent scales around the sprite's own center, so shrinking it would eat into both
  // edges symmetrically instead of draining from the right. Compensate the local X so the
  // fill's left edge stays anchored to the cavity's left edge regardless of scale.
  const cavityLocalX = frameLocalX + HEALTH_BAR_FILL_CAVITY.x;
  const fillLocalX = cavityLocalX - (HEALTH_BAR_FILL_SIZE.width / 2) * (1 - fillScaleX);
  const fillLocalY = frameLocalY + HEALTH_BAR_FILL_CAVITY.y;

  const fill = registry.spawnEntity();
  registry.addComponent(fill, new Position(0, 0));
  registry.addComponent(
    fill,
    new SpriteComponent("ui.png", {
      layer,
      animationsKey: "health-bar-fill-animations.txt",
      scale: { x: fillScaleX, y: 1 },
    }),
  );
  registry.addComponent(
    fill,
    new ChildrenComponent(parentEntity.getId(), { LocalPosition: { x: fillLocalX, y: fillLocalY } }),
  );
  registry.addComponent(fill, new Direction(0, 0));
  registry.addComponent(fill, new HealthBarFill(cavityLocalX));
}

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
  registry.addComponent(playerEntity, new Health(playerPacket.health.current, playerPacket.health.max));
  buildHealthBar(scene, registry, playerEntity, PLAYER_SPRITE_SIZE.width, playerPacket.health);

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
  registry.addComponent(lobbyEntity, new Health(lobbyPacket.health.current, lobbyPacket.health.max));
  buildHealthBar(scene, registry, lobbyEntity, LOBBY_SPRITE_SIZE.width, lobbyPacket.health);
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