import { Registry } from "@nanoforge-dev/ecs-client";
import { LobbyStatusComponent } from "../../components/lobby/lobby-status";
import { playerId, sceneManager } from "../../main";
import { GameScene } from "../../scenes/GameScene";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { TransformComponent } from "../../components/essentials/transform.component";
import { Velocity } from "../../components/essentials/velocity.component";
import { MoveController } from "../../components/move-controller.component";
import { Arc, Circle, Layer, Rect, Ring, Shape, Vector2d } from "@nanoforge-dev/graphics-2d";
import { NetworkId } from "../../components/network-id.component";
import { Direction } from "../../components/direction.component";
import { ShootController } from "../../components/shoot.controller";
import { ReviveController } from "../../components/revive-controller.component";
import { ReviveIndicatorComponent } from "../../components/revive-indicator.component";
import { ReviveHintIndicatorComponent } from "../../components/revive-hint-indicator.component";
import { BuildingInteractIndicatorComponent } from "../../components/building-interact-indicator.component";
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
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from "../build-mode.system";
import { WeaponShopComponent } from "../../components/weapon-shop.component";
import { BUILDING_CATALOG, type BuildingType } from "../../building-catalog";
import { TOWER_RANGE } from "../../building-economy";
import { WEAPON_CATALOG, type WeaponType } from "../../weapon-catalog";
import { TILE_SIZE } from "../../map-data";
import { Weapon } from "../../components/weapon.component";
import { AmmoHudComponent } from "../../components/ammo-hud.component";
import { ReloadIndicatorComponent } from "../../components/reload-indicator.component";
import { WeaponReloadOverlayComponent } from "../../components/weapon-reload-overlay.component";
import { CursorComponent } from "../../components/cursor.component";
import { CURSOR_SCALE } from "../cursor.system";
import { addCoinIcon } from "../../hud-helpers";

const HEALTH_BAR_Z_INDEX = 30; // above hands (20) - health bars must render above nearby sprites
// Strictly higher than the frame, not equal - zOrderSystem sorts ties by enumeration order, not
// construction order, so an equal z-index could render the frame's border over the fill.
const HEALTH_BAR_FILL_Z_INDEX = HEALTH_BAR_Z_INDEX + 1;

// Native player sprite size (player-animations.txt, unscaled).
const PLAYER_SPRITE_SIZE = { width: 24, height: 24 };

// Native size of the truck+house crop defined in objects-animations.txt's "idle" frame.
const LOBBY_SPRITE_SIZE = { width: 187, height: 143 };

// ui.png health bar sprites (see health-bar-frame-animations.txt / health-bar-fill-animations.txt).
const HEALTH_BAR_FRAME_SIZE = { width: 23, height: 6 };
const HEALTH_BAR_FILL_SIZE = { width: 12, height: 2 };
// The gray cavity inside the frame's border, in frame-local pixels, where the fill sits.
const HEALTH_BAR_FILL_CAVITY = { x: 2, y: 2, width: 19, height: 2 };
const HEALTH_BAR_FILL_MAX_SCALE_X = HEALTH_BAR_FILL_CAVITY.width / HEALTH_BAR_FILL_SIZE.width;
const HEALTH_BAR_GAP_ABOVE = 10;

// "Hold E to revive" progress circle above each player's health bar.
const REVIVE_RING_RADIUS = 8;
const REVIVE_RING_THICKNESS = 3;
const REVIVE_RING_GAP_ABOVE = 20;
// Above both the revive ring and the "Reloading..." text so a downed player's hint never overlaps.
const REVIVE_HINT_TEXT_GAP_ABOVE = 34;

// "Press E to..." proximity hint above a tower/wall/the lobby's own health bar.
const INTERACT_INDICATOR_GAP_ABOVE = 22;

// Wave HUD: "Wave x/y", a sub-wave progress bar, the live zombie count.
const WAVE_TEXT_SIZE = { width: 110, height: 24 };
const WAVE_PROGRESS_BAR_SIZE = { width: 180, height: 14 };
const ALIVE_TEXT_SIZE = { width: 100, height: 24 };
const WAVE_HUD_GAP = 12;
const WAVE_HUD_TOP_MARGIN = 14;
// "Next round in Ns" - wave-info-packet.handler.ts owns showing/hiding it during cooldown.
const WAVE_COUNTDOWN_TEXT_SIZE = { height: 18 };
const WAVE_COUNTDOWN_GAP = 6;

const MONEY_TEXT_SIZE = { width: 140, height: 24 };
const MONEY_HUD_LEFT_MARGIN = 14;
const MONEY_HUD_TOP_MARGIN = 14;

const BUILD_BUTTON_SIZE = { width: 90, height: 70 };
const BUILD_BAR_GAP = 10;
const BUILD_BAR_BOTTOM_MARGIN = 20;
const GRID_STROKE = "rgba(245, 242, 233, 0.25)";
const ZOOM_BUTTON_SIZE = { width: 36, height: 36 };
const ZOOM_BUTTON_GAP = 8;
const ZOOM_BUTTON_MARGIN = 16;

// Above bullets/zombies so a bullet fired from the player's own center renders tucked behind the
// player's body instead of floating on top of it.
const PLAYER_Z_INDEX = 16;

// Held weapon sprite, just above the hand in z-order. Each weapon's rest-angle rotation offset
// lives in weapon-catalog.ts, since a shotgun's art doesn't rest at the same angle as the pistol's.
const WEAPON_Z_INDEX = 21;
// Exported so weapon-reload-animation.system.ts can rebuild a weapon's LocalTransform (this base
// offset plus that weapon's own catalog.handOffsetDelta) when the equipped type changes.
export const WEAPON_LOCAL_OFFSET: Vector2d = { x: 6, y: 12 };

// A weapon's (or its reload overlay's) LocalTransform: WEAPON_LOCAL_OFFSET plus its own
// handOffsetDelta, if it has one. The hand and its weapon share one LocalTransform, but each
// sprite's own pivot renders at its own position plus its own pivot - so unless a weapon's pivot
// numerically matches hand.png's default center pivot (8,8), the two land at different world
// points; handOffsetDelta corrects that gap (see weapon-catalog.ts for the derivation).
function weaponLocalOffset(catalog: { spriteKey: string; handOffsetDelta?: Vector2d }): Vector2d {
  const delta = catalog.handOffsetDelta;
  return delta
    ? { x: WEAPON_LOCAL_OFFSET.x + delta.x, y: WEAPON_LOCAL_OFFSET.y + delta.y }
    : WEAPON_LOCAL_OFFSET;
}

// Ammo HUD, bottom-left of the screen. Hidden entirely whenever nothing is equipped - see
// reload-indicator.system.ts.
const AMMO_HUD_LEFT_MARGIN = 14;
const AMMO_HUD_BOTTOM_MARGIN = 14;
// Exported so weapon-inventory-packet.handler.ts can re-fit-scale the ammo HUD icon when the
// equipped weapon changes after construction.
export const AMMO_ICON_SIZE = { width: 32, height: 32 };
const AMMO_TEXT_SIZE = { width: 100, height: 32 };
const AMMO_HUD_GAP = 10;

// World-space "Reloading..." label above every player's health bar while their weapon reloads -
// visible to everyone nearby, not just a local HUD element (reload-indicator.system.ts).
const RELOAD_TEXT_GAP_ABOVE = 22;

// Custom crosshair cursor, replacing the OS cursor in GameScene. Size/scale shared with
// cursor.system.ts (which positions it every tick), so they can't drift apart.
const CURSOR_Z_INDEX = 100;

// No coin sprite exists in this game's art (see hud-helpers.ts), so currency is drawn as a circle.
const COIN_ICON_RADIUS = 7;
const COIN_ICON_GAP = 4; // between the coin and the number that follows it

// Weapon shop panel, right edge of the screen, shown/hidden alongside the build bar.
const SHOP_PANEL_RIGHT_MARGIN = 20;
const SHOP_ENTRY_WIDTH = 100;
const SHOP_BUY_HEIGHT = 64;
const SHOP_SELECT_BUTTON_HEIGHT = 24;
const SHOP_SELECT_BUTTON_GAP = 4;
const SHOP_ENTRY_GAP = 14;
const SHOP_ENTRY_HEIGHT = SHOP_BUY_HEIGHT + SHOP_SELECT_BUTTON_GAP + SHOP_SELECT_BUTTON_HEIGHT;
const SHOP_TOP_MARGIN = 110; // clears the wave HUD

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
    new ChildrenComponent(parentEntity.getId(), {
      LocalTransform: { x: frameLocalX, y: frameLocalY },
    }),
  );
  registry.addComponent(frame, new Direction(0, 0));
  registry.addComponent(frame, new ZIndexComponent(HEALTH_BAR_Z_INDEX));

  const fraction = health.max > 0 ? health.current / health.max : 0;
  const fillScaleX = HEALTH_BAR_FILL_MAX_SCALE_X * fraction;
  // A sprite scales around its own center, so shrinking it would eat into both edges symmetrically
  // - compensate the local X so the fill's left edge stays anchored regardless of scale.
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
    new ChildrenComponent(parentEntity.getId(), {
      LocalTransform: { x: fillLocalX, y: fillLocalY },
    }),
  );
  registry.addComponent(fill, new Direction(0, 0));
  registry.addComponent(fill, new ZIndexComponent(HEALTH_BAR_FILL_Z_INDEX));
  registry.addComponent(fill, new HealthBarFill(cavityLocalX));
}

// "Press E to..." hint text above a tower/wall/the lobby's own health bar - starts empty/hidden;
// building-interact-indicator.system.ts drives its text/visibility every tick.
export function buildInteractIndicator(
  layer: Layer,
  registry: Registry,
  parentEntity: ReturnType<Registry["spawnEntity"]>,
  parentWidth: number,
) {
  const localX = parentWidth / 2;
  const localY = -INTERACT_INDICATOR_GAP_ABOVE;

  const textComponent = new TextComponent(layer, {
    text: "",
    x: 0,
    y: 0,
    width: 160,
    align: "center",
    offsetX: 80,
    fontSize: 11,
    fontStyle: "bold",
    fill: "#F5F2E9",
    stroke: "#000000",
    strokeWidth: 2,
    fillAfterStrokeEnabled: true,
    listening: false,
    visible: false,
  });

  const indicator = registry.spawnEntity();
  registry.addComponent(indicator, new TransformComponent(0, 0));
  registry.addComponent(
    indicator,
    new ChildrenComponent(parentEntity.getId(), { LocalTransform: { x: localX, y: localY } }),
  );
  registry.addComponent(indicator, new Direction(0, 0));
  registry.addComponent(indicator, new BuildingInteractIndicatorComponent(textComponent.text));
}

// Grey->green "hold E to revive" progress circle, one per player, starting hidden.
// revive-packet.handler.ts drives its visibility/progress from the server's revive.system.ts
// events; revive-indicator.system.ts positions it every tick (raw Konva shapes, not a
// SpriteComponent, so spriteSystem never touches it).
function buildReviveIndicator(
  layer: Layer,
  registry: Registry,
  parentEntity: ReturnType<Registry["spawnEntity"]>,
  parentWidth: number,
) {
  const localX = parentWidth / 2;
  const localY = -REVIVE_RING_GAP_ABOVE;

  const background = new Ring({
    innerRadius: REVIVE_RING_RADIUS - REVIVE_RING_THICKNESS,
    outerRadius: REVIVE_RING_RADIUS,
    fill: "rgba(90, 90, 90, 0.85)",
    visible: false,
  });
  // rotation: -90 so the fill starts from the top and grows clockwise as `angle` increases,
  // rather than starting at Konva's default 3-o'clock position.
  const fill = new Arc({
    innerRadius: REVIVE_RING_RADIUS - REVIVE_RING_THICKNESS,
    outerRadius: REVIVE_RING_RADIUS,
    angle: 0,
    rotation: -90,
    fill: "#4caf50",
    visible: false,
  });
  layer.add(background);
  layer.add(fill);

  const indicator = registry.spawnEntity();
  registry.addComponent(indicator, new TransformComponent(0, 0));
  registry.addComponent(
    indicator,
    new ChildrenComponent(parentEntity.getId(), { LocalTransform: { x: localX, y: localY } }),
  );
  registry.addComponent(indicator, new Direction(0, 0));
  registry.addComponent(indicator, new ReviveIndicatorComponent(background, fill));
}

// "Hold E to revive" hint text above a player's own revive ring, starting hidden -
// revive-hint-indicator.system.ts drives its visibility every tick.
function buildReviveHintIndicator(
  layer: Layer,
  registry: Registry,
  parentEntity: ReturnType<Registry["spawnEntity"]>,
  parentWidth: number,
) {
  const localX = parentWidth / 2;
  const localY = -REVIVE_HINT_TEXT_GAP_ABOVE;

  const textComponent = new TextComponent(layer, {
    text: "Hold E to revive",
    x: 0,
    y: 0,
    width: 160,
    align: "center",
    offsetX: 80,
    fontSize: 11,
    fontStyle: "bold",
    fill: "#F5F2E9",
    stroke: "#000000",
    strokeWidth: 2,
    fillAfterStrokeEnabled: true,
    listening: false,
    visible: false,
  });

  const indicator = registry.spawnEntity();
  registry.addComponent(indicator, new TransformComponent(0, 0));
  registry.addComponent(
    indicator,
    new ChildrenComponent(parentEntity.getId(), { LocalTransform: { x: localX, y: localY } }),
  );
  registry.addComponent(indicator, new Direction(0, 0));
  registry.addComponent(indicator, new ReviveHintIndicatorComponent(textComponent.text));
}

// World-space "Reloading..." label above each player's health bar, starting hidden -
// reload-indicator.system.ts drives visibility and repositions it every tick (Text isn't a
// Sprite, so spriteSystem never touches it).
function buildReloadIndicator(
  layer: Layer,
  registry: Registry,
  parentEntity: ReturnType<Registry["spawnEntity"]>,
  parentWidth: number,
) {
  const localX = parentWidth / 2;
  const localY = -RELOAD_TEXT_GAP_ABOVE;

  const textComponent = new TextComponent(layer, {
    text: "Reloading...",
    x: 0,
    y: 0,
    width: 100,
    align: "center",
    offsetX: 50,
    fontSize: 12,
    fontStyle: "bold",
    fill: "#F5F2E9",
    listening: false,
    visible: false,
  });

  const indicator = registry.spawnEntity();
  registry.addComponent(indicator, new TransformComponent(0, 0));
  registry.addComponent(
    indicator,
    new ChildrenComponent(parentEntity.getId(), { LocalTransform: { x: localX, y: localY } }),
  );
  registry.addComponent(indicator, new Direction(0, 0));
  registry.addComponent(indicator, new ReloadIndicatorComponent(textComponent.text));
}

// The single hand + its held weapon for a player. `weaponType` null means unequipped: the weapon
// sprite still exists (so weapon-inventory-packet.handler.ts has something to re-point later),
// just hidden - reload-indicator.system.ts/weapon-visibility.system.ts own that visibility.
function buildHandAndWeapon(
  scene: Scene,
  registry: Registry,
  playerEntity: ReturnType<Registry["spawnEntity"]>,
  playerPosition: Vector2d,
  weaponType: WeaponType | null,
) {
  if (!scene.layer) return;
  const localOffset = WEAPON_LOCAL_OFFSET;

  const handEntity = registry.spawnEntity();
  registry.addComponent(handEntity, new TransformComponent(playerPosition.x, playerPosition.y));
  registry.addComponent(handEntity, new SpriteComponent("hand.png", { layer: scene.layer }));
  registry.addComponent(
    handEntity,
    new ChildrenComponent(playerEntity.getId(), { LocalTransform: localOffset }),
  );
  registry.addComponent(handEntity, new Direction(0, 0));
  // mirrorWhenFacingLeft: true - must match the weapon's own DirectionRotatorComponent below, or
  // the hand and gun rotate by different formulas while aiming left and visibly diverge.
  registry.addComponent(handEntity, new DirectionRotatorComponent(-98, true, true));
  registry.addComponent(handEntity, new ZIndexComponent(20));

  // An unequipped player has no weaponType to key off yet, so this defaults to smallGun's art
  // (hidden regardless - see weapon-visibility.system.ts/build-mode.system.ts). Once a real
  // weaponType is equipped, weapon-reload-animation.system.ts re-points spriteKey/animationsKey.
  const initialCatalog = weaponType ? WEAPON_CATALOG[weaponType] : WEAPON_CATALOG.smallGun;
  const rotationOffset = weaponType ? WEAPON_CATALOG[weaponType].rotationOffset : 0;
  const weaponEntity = registry.spawnEntity();
  registry.addComponent(weaponEntity, new TransformComponent(playerPosition.x, playerPosition.y));
  registry.addComponent(
    weaponEntity,
    new SpriteComponent(initialCatalog.spriteKey, {
      layer: scene.layer,
      animationsKey: initialCatalog.animationsKey,
      scale: { x: initialCatalog.scale, y: initialCatalog.scale },
      // Where the hand actually grips this weapon's art, if not the frame's default center pivot.
      ...("pivot" in initialCatalog ? { pivot: initialCatalog.pivot } : {}),
      // Only meaningful for a weapon with its own "shoot" animation. Set once at construction,
      // like the reload overlay's frameRate below, since SpriteComponent.frameRate isn't reactive.
      ...("shootFrameCount" in initialCatalog
        ? { frameRate: initialCatalog.shootFrameCount / initialCatalog.shootSeconds }
        : {}),
    }),
  );
  registry.addComponent(
    weaponEntity,
    new ChildrenComponent(playerEntity.getId(), {
      LocalTransform: weaponLocalOffset(initialCatalog),
    }),
  );
  registry.addComponent(weaponEntity, new Direction(0, 0));
  // mirrorWhenFacingLeft: true - the gun rotates through the full circle, so without this it
  // reads upside-down for the whole left half of the arc.
  registry.addComponent(weaponEntity, new DirectionRotatorComponent(rotationOffset, true, true));
  registry.addComponent(weaponEntity, new ZIndexComponent(WEAPON_Z_INDEX));
  registry.addComponent(weaponEntity, new Weapon(weaponType, rotationOffset));

  // Reload-animation overlay - built once, hidden by default. weapon-reload-animation.system.ts
  // shows it (hiding the main weapon sprite) only while the equipped weapon is reloading.
  // Hardcoded to the shotgun's reload asset - the only weapon with one right now. A separate
  // sprite entity rather than swapping the main weapon's image at reload time: swapping destroys
  // and recreates the Konva node asynchronously, which visibly flickered; toggling visibility
  // between two sprites that already exist is instant.
  const reloadOverlayCatalog = WEAPON_CATALOG.shotgun;
  const reloadOverlayEntity = registry.spawnEntity();
  registry.addComponent(
    reloadOverlayEntity,
    new TransformComponent(playerPosition.x, playerPosition.y),
  );
  registry.addComponent(
    reloadOverlayEntity,
    // Not currentAnimation: "reload" - spriteSystem always constructs its Konva node hardcoded on
    // "idle", so weapon-reload-animation.system.ts applies the real "reload" key once the sprite
    // actually exists.
    new SpriteComponent(reloadOverlayCatalog.reloadSpriteKey, {
      layer: scene.layer,
      animationsKey: reloadOverlayCatalog.reloadAnimationsKey,
      frameRate: reloadOverlayCatalog.reloadFrameCount / reloadOverlayCatalog.reloadSeconds,
      // Same world-space scale and pivot as the held sprite - it's the same asset pack, same
      // resting pose in frame 0.
      scale: { x: reloadOverlayCatalog.scale, y: reloadOverlayCatalog.scale },
      pivot: reloadOverlayCatalog.pivot,
    }),
  );
  registry.addComponent(
    reloadOverlayEntity,
    // This overlay always displays the shotgun's reload asset regardless of what's equipped, so
    // its offset never changes at runtime - fine to compute once here.
    new ChildrenComponent(playerEntity.getId(), {
      LocalTransform: weaponLocalOffset(reloadOverlayCatalog),
    }),
  );
  registry.addComponent(reloadOverlayEntity, new Direction(0, 0));
  registry.addComponent(
    reloadOverlayEntity,
    new DirectionRotatorComponent(reloadOverlayCatalog.rotationOffset, true, true),
  );
  registry.addComponent(reloadOverlayEntity, new ZIndexComponent(WEAPON_Z_INDEX));
  registry.addComponent(reloadOverlayEntity, new WeaponReloadOverlayComponent());
}

function buildPlayer(scene: Scene, playerPacket: any, registry: Registry) {
  if (!scene.layer) return;

  const playerEntity = registry.spawnEntity();
  registry.addComponent(playerEntity, new NetworkId(playerPacket.id));
  registry.addComponent(playerEntity, new Player());
  registry.addComponent(playerEntity, new Direction(0, 0));
  registry.addComponent(playerEntity, new ZIndexComponent(PLAYER_Z_INDEX));
  registry.addComponent(
    playerEntity,
    new TransformComponent(playerPacket.position.x, playerPacket.position.y),
  );
  registry.addComponent(playerEntity, new Velocity(0, 0));
  // player1.png..player3.png share the same 24x24 idle/walk/death layout (see
  // player-animations.txt) - picked in MenuScene's skin swatches and carried through the
  // joinLobby/startGame packets, clamped again here in case a stale/malformed value slipped in.
  const skin =
    Number.isInteger(playerPacket.skin) && playerPacket.skin >= 1 && playerPacket.skin <= 3
      ? playerPacket.skin
      : 1;
  registry.addComponent(
    playerEntity,
    new SpriteComponent(`player${skin}.png`, {
      layer: scene.layer,
      animationsKey: "player-animations.txt",
    }),
  );
  if (playerId === playerPacket.id) {
    registry.addComponent(playerEntity, new MoveController());
    registry.addComponent(playerEntity, new ShootController());
    registry.addComponent(playerEntity, new ReviveController());
  }
  registry.addComponent(
    playerEntity,
    new Health(playerPacket.health.current, playerPacket.health.max),
  );
  buildHealthBar(
    scene.layer || new Layer(),
    registry,
    playerEntity,
    PLAYER_SPRITE_SIZE.width,
    playerPacket.health,
  );
  buildReviveIndicator(
    scene.layer || new Layer(),
    registry,
    playerEntity,
    PLAYER_SPRITE_SIZE.width,
  );
  buildReviveHintIndicator(
    scene.layer || new Layer(),
    registry,
    playerEntity,
    PLAYER_SPRITE_SIZE.width,
  );
  buildReloadIndicator(
    scene.layer || new Layer(),
    registry,
    playerEntity,
    PLAYER_SPRITE_SIZE.width,
  );

  // Every player visibly holds their weapon (not just the local one), so everyone agrees on what
  // everyone else's loadout looks like.
  buildHandAndWeapon(
    scene,
    registry,
    playerEntity,
    playerPacket.position,
    playerPacket.weaponType ?? null,
  );
}

function buildAmmoHud(
  hudLayer: Layer,
  registry: Registry,
  weaponType: WeaponType | null,
  ammo: { magazineAmmo: number; reserveAmmo: number } | undefined,
) {
  const iconX = AMMO_HUD_LEFT_MARGIN;
  const iconY = window.innerHeight - AMMO_ICON_SIZE.height - AMMO_HUD_BOTTOM_MARGIN;

  // Each weapon can have a different native crop size (e.g. Shotgun-Shot.png's 52x32 vs. a 16x16
  // pistol crop) - fit-scale uniformly into the fixed AMMO_ICON_SIZE box rather than assuming
  // they're all the same size. Nothing equipped defaults to smallGun's icon (hidden regardless).
  const initialIconCatalog = weaponType ? WEAPON_CATALOG[weaponType] : WEAPON_CATALOG.smallGun;
  const iconFitScale = Math.min(
    AMMO_ICON_SIZE.width / initialIconCatalog.iconSize.width,
    AMMO_ICON_SIZE.height / initialIconCatalog.iconSize.height,
  );
  const iconEntity = registry.spawnEntity();
  const iconSprite = new SpriteComponent(initialIconCatalog.spriteKey, {
    layer: hudLayer,
    animationsKey: initialIconCatalog.animationsKey,
    scale: { x: iconFitScale, y: iconFitScale },
  });
  // Not setAnimation() here - spriteSystem builds the sprite lazily, hardcoded on "idle" -
  // reload-indicator.system.ts asserts the real icon animation every tick once it actually exists.
  registry.addComponent(iconEntity, iconSprite);
  registry.addComponent(iconEntity, new TransformComponent(iconX, iconY));

  const magazineAmmo = ammo?.magazineAmmo ?? 0;
  const reserve = ammo?.reserveAmmo === -1 ? "∞" : (ammo?.reserveAmmo ?? 0);
  const textEntity = registry.spawnEntity();
  const textComponent = new TextComponent(hudLayer, {
    text: `${magazineAmmo} / ${reserve}`,
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
  registry.addComponent(hudEntity, new AmmoHudComponent(textComponent.text, iconSprite));
}

function buildCursor(hudLayer: Layer, registry: Registry) {
  const cursorEntity = registry.spawnEntity();
  registry.addComponent(
    cursorEntity,
    new SpriteComponent("ui.png", {
      layer: hudLayer,
      animationsKey: "ui-crosshair-animations.txt",
      scale: { x: CURSOR_SCALE, y: CURSOR_SCALE },
    }),
  );
  registry.addComponent(cursorEntity, new TransformComponent(0, 0));
  registry.addComponent(cursorEntity, new CursorComponent());
  // Must never end up buried under other z-indexed sprites once anything else on the HUD changes
  // - zOrderSystem only reorders entities that have both ZIndexComponent and SpriteComponent.
  registry.addComponent(cursorEntity, new ZIndexComponent(CURSOR_Z_INDEX));
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
  registry.addComponent(
    lobbyEntity,
    new Health(lobbyPacket.health.current, lobbyPacket.health.max),
  );
  buildHealthBar(
    scene.layer || new Layer(),
    registry,
    lobbyEntity,
    LOBBY_SPRITE_SIZE.width,
    lobbyPacket.health,
  );
  buildInteractIndicator(
    scene.layer || new Layer(),
    registry,
    lobbyEntity,
    LOBBY_SPRITE_SIZE.width,
  );
}

function buildWaveHud(layer: Layer, registry: Registry) {
  const totalWidth =
    WAVE_TEXT_SIZE.width +
    WAVE_HUD_GAP +
    WAVE_PROGRESS_BAR_SIZE.width +
    WAVE_HUD_GAP +
    ALIVE_TEXT_SIZE.width;
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

  // Centered under the progress bar, hidden except during the between-waves cooldown -
  // wave-info-packet.handler.ts owns both its text and visibility.
  const countdownTextEntity = registry.spawnEntity();
  const countdownTextComponent = new TextComponent(layer, {
    text: "",
    x: barX,
    y: barY + WAVE_PROGRESS_BAR_SIZE.height + WAVE_COUNTDOWN_GAP,
    width: WAVE_PROGRESS_BAR_SIZE.width,
    height: WAVE_COUNTDOWN_TEXT_SIZE.height,
    align: "center",
    fontSize: 14,
    fontStyle: "bold",
    fill: "#F5F2E9",
    visible: false,
  });
  registry.addComponent(countdownTextEntity, countdownTextComponent);

  const hudEntity = registry.spawnEntity();
  registry.addComponent(
    hudEntity,
    new WaveHudComponent(
      waveTextComponent.text,
      trackComponent.rect,
      fillComponent.rect,
      aliveTextComponent.text,
      countdownTextComponent.text,
    ),
  );
}

function buildMoneyHud(layer: Layer, registry: Registry, amount: number) {
  const coinIcon = addCoinIcon(
    layer,
    MONEY_HUD_LEFT_MARGIN,
    MONEY_HUD_TOP_MARGIN + (MONEY_TEXT_SIZE.height - COIN_ICON_RADIUS * 2) / 2,
    COIN_ICON_RADIUS,
  );

  const moneyTextEntity = registry.spawnEntity();
  const moneyTextComponent = new TextComponent(layer, {
    text: `${amount}`,
    x: MONEY_HUD_LEFT_MARGIN + COIN_ICON_RADIUS * 2 + COIN_ICON_GAP,
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
  registry.addComponent(
    hudEntity,
    new MoneyHudComponent(moneyTextComponent.text, amount, coinIcon),
  );
}

function buildBuildMode(worldLayer: Layer, hudLayer: Layer, registry: Registry) {
  // World-space, so it pans/scales with the camera and aligns to real tiles for free.
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

      // Inverts cameraFollowSystem's own math to find which tile range is on screen - drawing the
      // whole 100x100 map grid regardless of zoom/pan would be thousands of unnecessary lines.
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

  // Shown only while the tower build-bar entry is selected, previewing its range before placement.
  // Radius is set every tick by build-mode.system.ts.
  const rangeCircle = new Circle({
    x: 0,
    y: 0,
    radius: 0,
    stroke: "rgba(245, 242, 233, 0.6)",
    strokeWidth: 1,
    dash: [4, 4],
    fill: "rgba(245, 242, 233, 0.08)",
    visible: false,
    listening: false,
  });
  worldLayer.add(rangeCircle);

  // Every already-built tower's range, drawn by one Shape rather than a Circle per tower - a
  // destroyed tower then needs no cleanup, it just stops being drawn. Distinct from `rangeCircle`
  // above, which only previews one not-yet-placed tower.
  //
  // sceneFunc reads only this plain array, never the registry directly - Konva can call it from
  // its own render loop, off build-mode.system.ts's tick, where registry.getZipper() isn't safe.
  // build-mode.system.ts refills this same array by reference once per tick instead.
  const towerRangeCenters: { x: number; y: number }[] = [];
  const towerRangeCircles = new Shape({
    stroke: "rgba(245, 242, 233, 0.35)",
    strokeWidth: 1,
    dash: [4, 4],
    listening: false,
    visible: false,
    sceneFunc: (context, shape) => {
      context.beginPath();
      for (const { x: centerX, y: centerY } of towerRangeCenters) {
        context.moveTo(centerX + TOWER_RANGE, centerY);
        context.arc(centerX, centerY, TOWER_RANGE, 0, Math.PI * 2);
      }
      context.strokeShape(shape);
    },
  });
  worldLayer.add(towerRangeCircles);

  const catalogEntries = Object.entries(BUILDING_CATALOG) as [
    BuildingType,
    (typeof BUILDING_CATALOG)[BuildingType],
  ][];
  // +1 slot for the "Destroy" button, appended after every catalog entry.
  const buttonCount = catalogEntries.length + 1;
  const totalWidth = buttonCount * BUILD_BUTTON_SIZE.width + (buttonCount - 1) * BUILD_BAR_GAP;
  const barX = window.innerWidth / 2 - totalWidth / 2;
  const barY = window.innerHeight - BUILD_BUTTON_SIZE.height - BUILD_BAR_BOTTOM_MARGIN;

  const destroyX = barX + catalogEntries.length * (BUILD_BUTTON_SIZE.width + BUILD_BAR_GAP);
  const destroyRectComponent = new RectComponent(hudLayer, {
    x: destroyX,
    y: barY,
    width: BUILD_BUTTON_SIZE.width,
    height: BUILD_BUTTON_SIZE.height,
    fill: "#521010",
    stroke: "#8C5E5E",
    strokeWidth: 2,
    cornerRadius: 6,
    visible: false,
  });
  registry.addComponent(registry.spawnEntity(), destroyRectComponent);
  const destroyTextComponent = new TextComponent(hudLayer, {
    text: "Destroy\n(50% refund)",
    x: destroyX,
    y: barY,
    width: BUILD_BUTTON_SIZE.width,
    height: BUILD_BUTTON_SIZE.height,
    align: "center",
    verticalAlign: "middle",
    fontSize: 13,
    fontStyle: "bold",
    fill: "#F5F2E9",
    visible: false,
    listening: false,
  });
  registry.addComponent(registry.spawnEntity(), destroyTextComponent);

  // "-" / "+" zoom buttons, top-right corner. Clicks only move targetZoomLevel; build-mode.system.ts
  // eases the live zoomLevel toward it every tick.
  const zoomInX = window.innerWidth - ZOOM_BUTTON_MARGIN - ZOOM_BUTTON_SIZE.width;
  const zoomOutX = zoomInX - ZOOM_BUTTON_GAP - ZOOM_BUTTON_SIZE.width;
  const zoomY = ZOOM_BUTTON_MARGIN;

  function buildZoomButton(x: number, label: string) {
    const rectComponent = new RectComponent(hudLayer, {
      x,
      y: zoomY,
      width: ZOOM_BUTTON_SIZE.width,
      height: ZOOM_BUTTON_SIZE.height,
      fill: "#104522",
      stroke: "#5E8C61",
      strokeWidth: 2,
      cornerRadius: 6,
      visible: false,
    });
    registry.addComponent(registry.spawnEntity(), rectComponent);
    rectComponent.rect.on("mouseover", () => {
      const stage = hudLayer.getStage();
      if (stage) stage.container().style.cursor = "pointer";
    });
    rectComponent.rect.on("mouseout", () => {
      const stage = hudLayer.getStage();
      if (stage) stage.container().style.cursor = "default";
    });

    const textComponent = new TextComponent(hudLayer, {
      text: label,
      x,
      y: zoomY,
      width: ZOOM_BUTTON_SIZE.width,
      height: ZOOM_BUTTON_SIZE.height,
      align: "center",
      verticalAlign: "middle",
      fontSize: 20,
      fontStyle: "bold",
      fill: "#F5F2E9",
      visible: false,
      listening: false,
    });
    registry.addComponent(registry.spawnEntity(), textComponent);

    return { rect: rectComponent.rect, text: textComponent.text };
  }

  const zoomInButton = buildZoomButton(zoomInX, "+");
  const zoomOutButton = buildZoomButton(zoomOutX, "-");

  const buildMode = new BuildModeComponent(
    gridShape,
    previewRect,
    rangeCircle,
    [],
    {
      rect: destroyRectComponent.rect,
      text: destroyTextComponent.text,
    },
    {
      x: barX,
      y: barY,
      width: totalWidth,
      height: BUILD_BUTTON_SIZE.height,
    },
    towerRangeCircles,
    towerRangeCenters,
    zoomInButton,
    zoomOutButton,
    {
      x: Math.min(zoomInX, zoomOutX),
      y: zoomY,
      width: Math.max(zoomInX, zoomOutX) + ZOOM_BUTTON_SIZE.width - Math.min(zoomInX, zoomOutX),
      height: ZOOM_BUTTON_SIZE.height,
    },
  );
  registry.addComponent(registry.spawnEntity(), buildMode);

  // Only ever moves `targetZoomLevel` - build-mode.system.ts eases the LIVE `zoomLevel` toward it
  // a little every tick rather than snapping straight there, so a click doesn't jump the camera.
  zoomInButton.rect.on("click", () => {
    buildMode.targetZoomLevel = Math.min(MAX_ZOOM, buildMode.targetZoomLevel + ZOOM_STEP);
  });
  zoomOutButton.rect.on("click", () => {
    buildMode.targetZoomLevel = Math.max(MIN_ZOOM, buildMode.targetZoomLevel - ZOOM_STEP);
  });

  destroyRectComponent.rect.on("click", () => {
    // Click again to turn it off - same toggle-off-on-reclick idiom the building buttons use.
    buildMode.destroyMode = !buildMode.destroyMode;
    if (buildMode.destroyMode) buildMode.selectedBuildingType = null;
  });
  destroyRectComponent.rect.on("mouseover", () => {
    const stage = hudLayer.getStage();
    if (stage) stage.container().style.cursor = "pointer";
  });
  destroyRectComponent.rect.on("mouseout", () => {
    const stage = hudLayer.getStage();
    if (stage) stage.container().style.cursor = "default";
  });

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
      buildMode.selectedBuildingType =
        buildMode.selectedBuildingType === buildingType ? null : buildingType;
      if (buildMode.selectedBuildingType) buildMode.destroyMode = false;
    });
    rectComponent.rect.on("mouseover", () => {
      const stage = hudLayer.getStage();
      if (stage) stage.container().style.cursor = "pointer";
    });
    rectComponent.rect.on("mouseout", () => {
      const stage = hudLayer.getStage();
      // "default", not "none" - build mode wants the normal OS cursor, not the crosshair.
      if (stage) stage.container().style.cursor = "default";
    });

    const textComponent = new TextComponent(hudLayer, {
      text: entry.label,
      x,
      y: barY + 8,
      width: BUILD_BUTTON_SIZE.width,
      height: BUILD_BUTTON_SIZE.height / 2,
      align: "center",
      verticalAlign: "middle",
      fontSize: 14,
      fill: "#F5F2E9",
      visible: false,
      listening: false,
    });
    registry.addComponent(registry.spawnEntity(), textComponent);

    const costY = barY + BUILD_BUTTON_SIZE.height - COIN_ICON_RADIUS * 2 - 10;
    const costDigits = String(entry.cost).length;
    const costRowWidth = COIN_ICON_RADIUS * 2 + COIN_ICON_GAP + costDigits * 9;
    const costX = x + (BUILD_BUTTON_SIZE.width - costRowWidth) / 2;
    const coin = addCoinIcon(hudLayer, costX, costY, COIN_ICON_RADIUS);
    coin.visible(false);
    const costTextComponent = new TextComponent(hudLayer, {
      text: `${entry.cost}`,
      x: costX + COIN_ICON_RADIUS * 2 + COIN_ICON_GAP,
      y: costY - 3,
      width: costDigits * 12,
      height: COIN_ICON_RADIUS * 2 + 6,
      fontSize: 14,
      fontStyle: "bold",
      verticalAlign: "middle",
      fill: "#F5F2E9",
      visible: false,
      listening: false,
    });
    registry.addComponent(registry.spawnEntity(), costTextComponent);

    const button: BuildBarButton = {
      buildingType,
      rect: rectComponent.rect,
      text: textComponent.text,
      costText: costTextComponent.text,
      costIcon: coin,
    };
    buildMode.barButtons.push(button);
  });
}

// One column, one entry per catalog weapon, shown/hidden alongside the build bar. Clicking a
// weapon's top row buys it if unowned, refills ammo if already owned; the row underneath
// equips/unequips it - build-mode.system.ts owns the per-tick button state and click handling.
function buildWeaponShop(hudLayer: Layer, registry: Registry, localPlayer: any) {
  const catalogEntries = Object.entries(WEAPON_CATALOG) as [
    WeaponType,
    (typeof WEAPON_CATALOG)[WeaponType],
  ][];
  const panelX = window.innerWidth - SHOP_ENTRY_WIDTH - SHOP_PANEL_RIGHT_MARGIN;
  const totalHeight =
    catalogEntries.length * SHOP_ENTRY_HEIGHT + (catalogEntries.length - 1) * SHOP_ENTRY_GAP;

  // One caption for the whole column rather than repeating it on every entry - SHOP_ENTRY_WIDTH is
  // only 100px, too narrow for a per-entry hint alongside the price/ammo count.
  const hintTextComponent = new TextComponent(hudLayer, {
    text: "Click a weapon to buy it or refill its ammo",
    x: panelX,
    y: SHOP_TOP_MARGIN + totalHeight + SHOP_ENTRY_GAP,
    width: SHOP_ENTRY_WIDTH,
    align: "center",
    fontSize: 10,
    fontStyle: "italic",
    fill: "#9CB89C",
    visible: false,
    listening: false,
  });
  registry.addComponent(registry.spawnEntity(), hintTextComponent);

  const weaponShop = new WeaponShopComponent(
    [],
    {
      x: panelX,
      y: SHOP_TOP_MARGIN,
      width: SHOP_ENTRY_WIDTH,
      height: totalHeight,
    },
    hintTextComponent.text,
  );
  // Seeded from the local player's starting loadout - nothing broadcasts a weaponInventory/ammo
  // packet at spawn, so without this the shop would show smallGun as unowned until first purchase.
  if (localPlayer) {
    weaponShop.equippedWeaponType = localPlayer.weaponType ?? null;
    for (const w of localPlayer.weapons ?? []) {
      weaponShop.owned.set(w.weaponType, { reserveAmmo: w.reserveAmmo });
    }
  }
  registry.addComponent(registry.spawnEntity(), weaponShop);

  catalogEntries.forEach(([weaponType, catalogEntry], index) => {
    const entryY = SHOP_TOP_MARGIN + index * (SHOP_ENTRY_HEIGHT + SHOP_ENTRY_GAP);

    const buyRectComponent = new RectComponent(hudLayer, {
      x: panelX,
      y: entryY,
      width: SHOP_ENTRY_WIDTH,
      height: SHOP_BUY_HEIGHT,
      fill: "#104522",
      stroke: "#5E8C61",
      strokeWidth: 2,
      cornerRadius: 6,
      visible: false,
    });
    registry.addComponent(registry.spawnEntity(), buyRectComponent);

    const buyTextComponent = new TextComponent(hudLayer, {
      text: catalogEntry.label,
      x: panelX,
      y: entryY + 4,
      width: SHOP_ENTRY_WIDTH,
      height: SHOP_BUY_HEIGHT - 24,
      align: "center",
      fontSize: 13,
      fontStyle: "bold",
      fill: "#F5F2E9",
      visible: false,
      listening: false,
    });
    registry.addComponent(registry.spawnEntity(), buyTextComponent);

    // alwaysOwned weapons never show a cost row at all, not just a hidden/zeroed one.
    const costY = entryY + SHOP_BUY_HEIGHT - COIN_ICON_RADIUS * 2 - 6;
    const coinX = panelX + 14;
    const costTextComponent = new TextComponent(hudLayer, {
      text: "",
      x: coinX + COIN_ICON_RADIUS * 2 + COIN_ICON_GAP,
      y: costY - 3,
      width: SHOP_ENTRY_WIDTH - (coinX - panelX) - COIN_ICON_RADIUS * 2 - COIN_ICON_GAP,
      height: COIN_ICON_RADIUS * 2 + 6,
      fontSize: 14,
      fontStyle: "bold",
      verticalAlign: "middle",
      fill: "#F5F2E9",
      visible: false,
      listening: false,
    });
    registry.addComponent(registry.spawnEntity(), costTextComponent);

    let costIcon: ReturnType<typeof addCoinIcon> | undefined;
    if (!catalogEntry.alwaysOwned) {
      costIcon = addCoinIcon(hudLayer, coinX, costY, COIN_ICON_RADIUS);
      costIcon.visible(false);

      buyRectComponent.rect.on("click", () => {
        weaponShop.pendingBuyType = weaponType;
      });
      buyRectComponent.rect.on("mouseover", () => {
        const stage = hudLayer.getStage();
        if (stage) stage.container().style.cursor = "pointer";
      });
      buyRectComponent.rect.on("mouseout", () => {
        const stage = hudLayer.getStage();
        if (stage) stage.container().style.cursor = "default";
      });
    }

    // Toggles this weapon equipped/unequipped when owned; label flips between
    // "Select"/"Selected"/"Buy" - build-mode.system.ts owns that per tick.
    const selectButtonComponent = new RectComponent(hudLayer, {
      x: panelX,
      y: entryY + SHOP_BUY_HEIGHT + SHOP_SELECT_BUTTON_GAP,
      width: SHOP_ENTRY_WIDTH,
      height: SHOP_SELECT_BUTTON_HEIGHT,
      fill: "#104522",
      stroke: "#5E8C61",
      strokeWidth: 2,
      cornerRadius: 4,
      visible: false,
    });
    registry.addComponent(registry.spawnEntity(), selectButtonComponent);
    const selectLabelComponent = new TextComponent(hudLayer, {
      text: "Select",
      x: panelX,
      y: entryY + SHOP_BUY_HEIGHT + SHOP_SELECT_BUTTON_GAP,
      width: SHOP_ENTRY_WIDTH,
      height: SHOP_SELECT_BUTTON_HEIGHT,
      align: "center",
      verticalAlign: "middle",
      fontSize: 12,
      fill: "#F5F2E9",
      visible: false,
      listening: false,
    });
    registry.addComponent(registry.spawnEntity(), selectLabelComponent);
    selectButtonComponent.rect.on("click", () => {
      // Not owned yet - this button reads "Buy" (build-mode.system.ts), so clicking it should buy
      // the weapon, not fire off an equip request the server can only reject ("not owned").
      if (!weaponShop.owned.has(weaponType)) {
        weaponShop.pendingBuyType = weaponType;
        return;
      }
      weaponShop.pendingEquip = {
        weaponType: weaponShop.equippedWeaponType === weaponType ? null : weaponType,
      };
    });
    selectButtonComponent.rect.on("mouseover", () => {
      const stage = hudLayer.getStage();
      if (stage) stage.container().style.cursor = "pointer";
    });
    selectButtonComponent.rect.on("mouseout", () => {
      const stage = hudLayer.getStage();
      if (stage) stage.container().style.cursor = "default";
    });

    weaponShop.entries.push({
      weaponType,
      buyRect: buyRectComponent.rect,
      buyText: buyTextComponent.text,
      costText: costTextComponent.text,
      costIcon,
      selectButton: selectButtonComponent.rect,
      selectLabel: selectLabelComponent.text,
    });
  });
}

function launchGame(packet: any, registry: Registry) {
  const newScene = new GameScene();
  sceneManager.switchTo(newScene);

  buildLobby(newScene, packet.lobby, registry);

  packet.players.forEach((player: any) => {
    buildPlayer(newScene, player, registry);
  });

  if (newScene.hudLayer) {
    buildWaveHud(newScene.hudLayer, registry);
    buildMoneyHud(newScene.hudLayer, registry, packet.money);
    if (newScene.layer) buildBuildMode(newScene.layer, newScene.hudLayer, registry);

    const localPlayer = packet.players.find((player: any) => player.id === playerId);
    buildWeaponShop(newScene.hudLayer, registry, localPlayer);

    if (localPlayer) {
      // Reserve comes from the shared per-type record; magazine is on the equipped weapon's own
      // state and arrives as its own field instead of living inside the weapons[] entry.
      const findAmmo = (weaponType: WeaponType | null, magazineAmmo: number) => {
        if (!weaponType) return undefined;
        const reserveAmmo =
          localPlayer.weapons.find((w: any) => w.weaponType === weaponType)?.reserveAmmo ?? 0;
        return { magazineAmmo, reserveAmmo };
      };
      buildAmmoHud(
        newScene.hudLayer,
        registry,
        localPlayer.weaponType,
        findAmmo(localPlayer.weaponType, localPlayer.magazineAmmo),
      );
    }

    buildCursor(newScene.hudLayer, registry);
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
