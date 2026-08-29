import { Registry } from "@nanoforge-dev/ecs-client";
import { LobbyStatusComponent } from "../../components/lobby/lobby-status";
import { playerId, sceneManager } from "../../main";
import { GameScene } from "../../scenes/GameScene";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { TransformComponent } from "../../components/essentials/transform.component";
import { Velocity } from "../../components/essentials/velocity.component";
import { MoveController } from "../../components/move-controller.component";
import { Layer, Rect, Shape } from "@nanoforge-dev/graphics-2d";
import { NetworkId } from "../../components/network-id.component";
import { Direction } from "../../components/direction.component";
import { ShootController } from "../../components/shoot.controller";
import { ChildrenComponent } from "../../components/children.component";
import { Scene } from "../../scenes/Scene";
import { DirectionRotatorComponent } from "../../components/direction-rotator.component";
import { Lobby } from "../../components/lobby/lobby.component";
import { Health } from "../../components/health.component";
import { ZIndexComponent } from "../../components/essentials/z-index.component";
import { HealthBarFill } from "../../components/health-bar-fill.component";
import { RectComponent } from "../../components/renderable/rect.component";
import { TextComponent } from "../../components/renderable/text.component";
import { WaveHudComponent } from "../../components/wave-hud.component";
import { MoneyHudComponent } from "../../components/money-hud.component";
import { Player } from "../../components/player.component";
import { BuildModeComponent, type BuildBarButton } from "../../components/build-mode.component";
import { BUILDING_CATALOG, type BuildingType } from "../../building-catalog";
import { TILE_SIZE } from "../../map-data";
import { Weapon } from "../../components/weapon.component";
import { AmmoHudComponent } from "../../components/ammo-hud.component";

// zOrderSystem only reorders entities that carry a ZIndexComponent - anything without one stays
// wherever Konva's insertion order left it, permanently below every z-indexed sprite. Health bars
// need to render above whatever's standing near their owner (zombies/players cluster right
// around the lobby), so they get the highest tier - above hands (20).
const HEALTH_BAR_Z_INDEX = 30;

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

// Wave HUD, laid out left-to-right and centered at the top of the screen: "Wave x/y", a
// progress bar over the current wave's sub-waves, then the live zombie count.
const WAVE_TEXT_SIZE = { width: 110, height: 24 };
const WAVE_PROGRESS_BAR_SIZE = { width: 180, height: 14 };
const ALIVE_TEXT_SIZE = { width: 100, height: 24 };
const WAVE_HUD_GAP = 12;
const WAVE_HUD_TOP_MARGIN = 14;

// Money HUD, top-left of the screen.
const MONEY_TEXT_SIZE = { width: 140, height: 24 };
const MONEY_HUD_LEFT_MARGIN = 14;
const MONEY_HUD_TOP_MARGIN = 14;

// Build bar, bottom-center of the screen - one button per catalog entry.
const BUILD_BUTTON_SIZE = { width: 90, height: 70 };
const BUILD_BAR_GAP = 10;
const BUILD_BAR_BOTTOM_MARGIN = 20;
const GRID_STROKE = "rgba(245, 242, 233, 0.25)";

// Held weapon sprite - same LocalTransform as the hand (it's held BY the hand), rotated the same
// way, just above it in z-order.
const WEAPON_ROTATOR_OFFSET = -90;
const WEAPON_Z_INDEX = 21;

// Ammo HUD, bottom-left of the screen.
const AMMO_HUD_LEFT_MARGIN = 14;
const AMMO_HUD_BOTTOM_MARGIN = 14;
const AMMO_ICON_SIZE = { width: 32, height: 32 };
const AMMO_TEXT_SIZE = { width: 100, height: 32 };
const AMMO_HUD_GAP = 10;

export function buildHealthBar(
  layer: Layer,
  registry: Registry,
  parentEntity: ReturnType<Registry["spawnEntity"]>,
  parentWidth: number,
  health: { current: number; max: number },
) {
  const frameLocalX = (parentWidth - HEALTH_BAR_FRAME_SIZE.width) / 2;
  const frameLocalY = -HEALTH_BAR_GAP_ABOVE;

  const frame = registry.spawnEntity();
  registry.addComponent(frame, new TransformComponent(0, 0));
  registry.addComponent(
    frame,
    new SpriteComponent("ui.png", { layer, animationsKey: "health-bar-frame-animations.txt" }),
  );
  registry.addComponent(
    frame,
    new ChildrenComponent(parentEntity.getId(), { LocalTransform: { x: frameLocalX, y: frameLocalY } }),
  );
  registry.addComponent(frame, new Direction(0, 0));
  registry.addComponent(frame, new ZIndexComponent(HEALTH_BAR_Z_INDEX));

  const fraction = health.max > 0 ? health.current / health.max : 0;
  const fillScaleX = HEALTH_BAR_FILL_MAX_SCALE_X * fraction;
  // SpriteComponent scales around the sprite's own center, so shrinking it would eat into both
  // edges symmetrically instead of draining from the right. Compensate the local X so the
  // fill's left edge stays anchored to the cavity's left edge regardless of scale.
  const cavityLocalX = frameLocalX + HEALTH_BAR_FILL_CAVITY.x;
  const fillLocalX = cavityLocalX - (HEALTH_BAR_FILL_SIZE.width / 2) * (1 - fillScaleX);
  const fillLocalY = frameLocalY + HEALTH_BAR_FILL_CAVITY.y;

  const fill = registry.spawnEntity();
  registry.addComponent(fill, new TransformComponent(0, 0));
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
    new ChildrenComponent(parentEntity.getId(), { LocalTransform: { x: fillLocalX, y: fillLocalY } }),
  );
  registry.addComponent(fill, new Direction(0, 0));
  registry.addComponent(fill, new ZIndexComponent(HEALTH_BAR_Z_INDEX));
  registry.addComponent(fill, new HealthBarFill(cavityLocalX));
}

function buildPlayer(scene: Scene, playerPacket: any, registry: Registry) {
  if (!scene.layer) return;

  const playerEntity = registry.spawnEntity();
  registry.addComponent(playerEntity, new NetworkId(playerPacket.id));
  registry.addComponent(playerEntity, new Player());
  registry.addComponent(playerEntity, new Direction(0, 0));
  registry.addComponent(playerEntity, new ZIndexComponent(10));
  registry.addComponent(
    playerEntity,
    new TransformComponent(playerPacket.position.x, playerPacket.position.y),
  );
  registry.addComponent(playerEntity, new Velocity(0, 0));
  registry.addComponent(
    playerEntity,
    new SpriteComponent("player1.png", {
      layer: scene.layer,
      animationsKey: "player-animations.txt",
    }),
  );
  if (playerId === playerPacket.id) {
    registry.addComponent(playerEntity, new MoveController());
    registry.addComponent(playerEntity, new ShootController());
  }
  registry.addComponent(playerEntity, new Health(playerPacket.health.current, playerPacket.health.max));
  buildHealthBar(scene.layer || new Layer(), registry, playerEntity, PLAYER_SPRITE_SIZE.width, playerPacket.health);

  const hand = registry.spawnEntity();
  registry.addComponent(hand, new TransformComponent(playerPacket.position.x, playerPacket.position.y));
  registry.addComponent(
    hand,
    new SpriteComponent("hand.png", {
      layer: scene.layer || new Layer(),
    }),
  );
  registry.addComponent(hand, new ChildrenComponent(playerEntity.getId(), { LocalTransform: {x: 6, y: 12} }));
  registry.addComponent(hand, new Direction(0, 0));
  registry.addComponent(hand, new DirectionRotatorComponent(-90));
  registry.addComponent(hand, new ZIndexComponent(20));

  // Every player visibly holds their weapon (not just the local one) - same parenting as the
  // hand it's held by.
  const weapon = registry.spawnEntity();
  registry.addComponent(weapon, new TransformComponent(playerPacket.position.x, playerPacket.position.y));
  registry.addComponent(
    weapon,
    new SpriteComponent("weapons.png", {
      layer: scene.layer || new Layer(),
      animationsKey: "weapons-animations.txt",
    }),
  );
  registry.addComponent(weapon, new ChildrenComponent(playerEntity.getId(), { LocalTransform: { x: 6, y: 12 } }));
  registry.addComponent(weapon, new Direction(0, 0));
  registry.addComponent(weapon, new DirectionRotatorComponent(WEAPON_ROTATOR_OFFSET));
  registry.addComponent(weapon, new ZIndexComponent(WEAPON_Z_INDEX));
  registry.addComponent(weapon, new Weapon(WEAPON_ROTATOR_OFFSET));
}

function buildAmmoHud(
  hudLayer: Layer,
  registry: Registry,
  weapon: { magazineAmmo: number; reserveAmmo: number },
) {
  const iconX = AMMO_HUD_LEFT_MARGIN;
  const iconY = window.innerHeight - AMMO_ICON_SIZE.height - AMMO_HUD_BOTTOM_MARGIN;

  const iconEntity = registry.spawnEntity();
  registry.addComponent(
    iconEntity,
    new SpriteComponent("weapons.png", {
      layer: hudLayer,
      animationsKey: "weapons-animations.txt",
      scale: { x: AMMO_ICON_SIZE.width / 16, y: AMMO_ICON_SIZE.height / 16 },
    }),
  );
  registry.addComponent(iconEntity, new TransformComponent(iconX, iconY));

  const reserve = weapon.reserveAmmo === -1 ? "∞" : weapon.reserveAmmo;
  const textEntity = registry.spawnEntity();
  const textComponent = new TextComponent(hudLayer, {
    text: `${weapon.magazineAmmo} / ${reserve}`,
    x: iconX + AMMO_ICON_SIZE.width + AMMO_HUD_GAP,
    y: iconY,
    width: AMMO_TEXT_SIZE.width,
    height: AMMO_TEXT_SIZE.height,
    fontSize: 20,
    fontStyle: "bold",
    verticalAlign: "middle",
    fill: "#F5F2E9",
  });
  registry.addComponent(textEntity, textComponent);

  const hudEntity = registry.spawnEntity();
  registry.addComponent(hudEntity, new AmmoHudComponent(textComponent.text));
}

function buildLobby(scene: Scene, lobbyPacket: any, registry: Registry) {
  const lobbyEntity = registry.spawnEntity();
  registry.addComponent(lobbyEntity, new NetworkId(lobbyPacket.id));
  registry.addComponent(
    lobbyEntity,
    new TransformComponent(lobbyPacket.position.x, lobbyPacket.position.y),
  );
  registry.addComponent(
    lobbyEntity,
    new SpriteComponent("objects.png", {
      layer: scene.layer || new Layer(),
      animationsKey: "objects-animations.txt",
    }),
  );
  registry.addComponent(lobbyEntity, new Lobby());
  registry.addComponent(lobbyEntity, new ZIndexComponent(10));
  registry.addComponent(lobbyEntity, new Health(lobbyPacket.health.current, lobbyPacket.health.max));
  buildHealthBar(scene.layer || new Layer(), registry, lobbyEntity, LOBBY_SPRITE_SIZE.width, lobbyPacket.health);
}

function buildWaveHud(layer: Layer, registry: Registry) {
  const totalWidth =
    WAVE_TEXT_SIZE.width + WAVE_HUD_GAP + WAVE_PROGRESS_BAR_SIZE.width + WAVE_HUD_GAP + ALIVE_TEXT_SIZE.width;
  const startX = window.innerWidth / 2 - totalWidth / 2;

  const waveTextEntity = registry.spawnEntity();
  const waveTextComponent = new TextComponent(layer, {
    text: "Wave -/-",
    x: startX,
    y: WAVE_HUD_TOP_MARGIN,
    width: WAVE_TEXT_SIZE.width,
    height: WAVE_TEXT_SIZE.height,
    fontSize: 18,
    fontStyle: "bold",
    verticalAlign: "middle",
    fill: "#F5F2E9",
  });
  registry.addComponent(waveTextEntity, waveTextComponent);

  const barX = startX + WAVE_TEXT_SIZE.width + WAVE_HUD_GAP;
  const barY = WAVE_HUD_TOP_MARGIN + (WAVE_TEXT_SIZE.height - WAVE_PROGRESS_BAR_SIZE.height) / 2;

  const trackEntity = registry.spawnEntity();
  const trackComponent = new RectComponent(layer, {
    x: barX,
    y: barY,
    width: WAVE_PROGRESS_BAR_SIZE.width,
    height: WAVE_PROGRESS_BAR_SIZE.height,
    fill: "#2B2B2B",
    stroke: "#F5F2E9",
    strokeWidth: 1,
    cornerRadius: 3,
  });
  registry.addComponent(trackEntity, trackComponent);

  // Drawn on top of the track, grown from 0 width by wave-info-packet.handler.ts as sub-waves
  // complete.
  const fillEntity = registry.spawnEntity();
  const fillComponent = new RectComponent(layer, {
    x: barX,
    y: barY,
    width: 0,
    height: WAVE_PROGRESS_BAR_SIZE.height,
    fill: "#4CAF50",
    cornerRadius: 3,
  });
  registry.addComponent(fillEntity, fillComponent);

  const aliveTextEntity = registry.spawnEntity();
  const aliveTextComponent = new TextComponent(layer, {
    text: "0 zombies",
    x: barX + WAVE_PROGRESS_BAR_SIZE.width + WAVE_HUD_GAP,
    y: WAVE_HUD_TOP_MARGIN,
    width: ALIVE_TEXT_SIZE.width,
    height: ALIVE_TEXT_SIZE.height,
    fontSize: 18,
    fontStyle: "bold",
    verticalAlign: "middle",
    fill: "#F5F2E9",
  });
  registry.addComponent(aliveTextEntity, aliveTextComponent);

  const hudEntity = registry.spawnEntity();
  registry.addComponent(
    hudEntity,
    new WaveHudComponent(waveTextComponent.text, trackComponent.rect, fillComponent.rect, aliveTextComponent.text),
  );
}

function buildMoneyHud(layer: Layer, registry: Registry, amount: number) {
  const moneyTextEntity = registry.spawnEntity();
  const moneyTextComponent = new TextComponent(layer, {
    text: `Coins: ${amount}`,
    x: MONEY_HUD_LEFT_MARGIN,
    y: MONEY_HUD_TOP_MARGIN,
    width: MONEY_TEXT_SIZE.width,
    height: MONEY_TEXT_SIZE.height,
    fontSize: 18,
    fontStyle: "bold",
    verticalAlign: "middle",
    fill: "#F5F2E9",
  });
  registry.addComponent(moneyTextEntity, moneyTextComponent);

  const hudEntity = registry.spawnEntity();
  registry.addComponent(hudEntity, new MoneyHudComponent(moneyTextComponent.text, amount));
}

function buildBuildMode(worldLayer: Layer, hudLayer: Layer, registry: Registry) {
  // World-space, so it pans/scales with the camera and aligns to real tiles for free - only
  // drawn (and only hit by build-mode.system.ts's placement math, which uses the same layer) once
  // build mode is toggled on.
  const gridShape = new Shape({
    stroke: GRID_STROKE,
    strokeWidth: 1,
    listening: false,
    visible: false,
    sceneFunc: (context, shape) => {
      const layer = shape.getLayer();
      if (!layer) return;
      const scale = layer.scaleX() || 1;
      const pos = layer.position();

      // Same camera-relative math cameraFollowSystem uses to place the layer in the first place,
      // inverted to find which world-space tile range is currently on screen - drawing the whole
      // map's grid (100x100 tiles) regardless of zoom/pan would be thousands of unnecessary lines.
      const minX = -pos.x / scale;
      const minY = -pos.y / scale;
      const maxX = (layer.width() - pos.x) / scale;
      const maxY = (layer.height() - pos.y) / scale;

      const startCol = Math.floor(minX / TILE_SIZE);
      const endCol = Math.ceil(maxX / TILE_SIZE);
      const startRow = Math.floor(minY / TILE_SIZE);
      const endRow = Math.ceil(maxY / TILE_SIZE);

      context.beginPath();
      for (let col = startCol; col <= endCol; col++) {
        const x = col * TILE_SIZE;
        context.moveTo(x, minY);
        context.lineTo(x, maxY);
      }
      for (let row = startRow; row <= endRow; row++) {
        const y = row * TILE_SIZE;
        context.moveTo(minX, y);
        context.lineTo(maxX, y);
      }
      context.strokeShape(shape);
    },
  });
  worldLayer.add(gridShape);

  const previewRect = new Rect({
    x: 0,
    y: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
    fill: "rgba(76, 175, 80, 0.55)",
    visible: false,
    listening: false,
  });
  worldLayer.add(previewRect);

  const catalogEntries = Object.entries(BUILDING_CATALOG) as [BuildingType, (typeof BUILDING_CATALOG)[BuildingType]][];
  const totalWidth =
    catalogEntries.length * BUILD_BUTTON_SIZE.width + (catalogEntries.length - 1) * BUILD_BAR_GAP;
  const barX = window.innerWidth / 2 - totalWidth / 2;
  const barY = window.innerHeight - BUILD_BUTTON_SIZE.height - BUILD_BAR_BOTTOM_MARGIN;

  const buildMode = new BuildModeComponent(gridShape, previewRect, [], {
    x: barX,
    y: barY,
    width: totalWidth,
    height: BUILD_BUTTON_SIZE.height,
  });
  registry.addComponent(registry.spawnEntity(), buildMode);

  catalogEntries.forEach(([buildingType, entry], index) => {
    const x = barX + index * (BUILD_BUTTON_SIZE.width + BUILD_BAR_GAP);

    const rectComponent = new RectComponent(hudLayer, {
      x,
      y: barY,
      width: BUILD_BUTTON_SIZE.width,
      height: BUILD_BUTTON_SIZE.height,
      fill: "#104522",
      stroke: "#5E8C61",
      strokeWidth: 2,
      cornerRadius: 6,
      visible: false,
    });
    registry.addComponent(registry.spawnEntity(), rectComponent);

    rectComponent.rect.on("click", () => {
      // Click again to deselect.
      buildMode.selectedBuildingType = buildMode.selectedBuildingType === buildingType ? null : buildingType;
    });
    rectComponent.rect.on("mouseover", () => {
      const stage = hudLayer.getStage();
      if (stage) stage.container().style.cursor = "pointer";
    });
    rectComponent.rect.on("mouseout", () => {
      const stage = hudLayer.getStage();
      if (stage) stage.container().style.cursor = "default";
    });

    const textComponent = new TextComponent(hudLayer, {
      text: `${entry.label}\n${entry.cost}g`,
      x,
      y: barY,
      width: BUILD_BUTTON_SIZE.width,
      height: BUILD_BUTTON_SIZE.height,
      align: "center",
      verticalAlign: "middle",
      fontSize: 14,
      fill: "#F5F2E9",
      visible: false,
      listening: false,
    });
    registry.addComponent(registry.spawnEntity(), textComponent);

    const button: BuildBarButton = { buildingType, rect: rectComponent.rect, text: textComponent.text };
    buildMode.barButtons.push(button);
  });
}

function launchGame(packet: any, registry: Registry) {
  const newScene = new GameScene();
  sceneManager.switchTo(newScene);

  buildLobby(newScene, packet.lobby, registry);

  for (const player of packet.players) {
    buildPlayer(newScene, player, registry);
  }

  if (newScene.hudLayer) {
    buildWaveHud(newScene.hudLayer, registry);
    buildMoneyHud(newScene.hudLayer, registry, packet.money);
    if (newScene.layer) buildBuildMode(newScene.layer, newScene.hudLayer, registry);

    const localPlayer = packet.players.find((player: any) => player.id === playerId);
    if (localPlayer) buildAmmoHud(newScene.hudLayer, registry, localPlayer.weapon);
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