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

// zOrderSystem only reorders entities that carry a ZIndexComponent - anything without one stays
// wherever Konva's insertion order left it, permanently below every z-indexed sprite. Health bars
// need to render above whatever's standing near their owner (zombies/players cluster right
// around the lobby), so they get the highest tier - above hands (20).
const HEALTH_BAR_Z_INDEX = 30;
// One tier above the frame, not equal to it: zOrderSystem sorts ties by whatever order
// getZipper() happens to enumerate same-z entities in, which follows underlying storage/slot
// order, not necessarily "frame was built first" - slots get recycled as other entities die
// (zombies, mainly), so that order isn't guaranteed to put the fill after (visually on top of)
// the frame just because buildHealthBar() below always constructs it second. A spawn that
// happens to land the fill in an earlier slot than its own frame renders with the frame's border
// covering the green fill entirely - a bar that "looks empty" even at full health. Giving the
// fill its own strictly-higher z-index makes the SORT itself guarantee it renders on top,
// regardless of enumeration order - not the "which one built the sprite first" tie-break above,
// which was never actually reliable.
const HEALTH_BAR_FILL_Z_INDEX = HEALTH_BAR_Z_INDEX + 1;

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

// "Hold E to revive" progress circle, built for every player (buildReviveIndicator) right above
// their health bar - radius/thickness chosen so its bottom edge clears the health bar's own top
// edge (frame sits HEALTH_BAR_GAP_ABOVE=10px up, 6px tall) with a few pixels of margin.
const REVIVE_RING_RADIUS = 8;
const REVIVE_RING_THICKNESS = 3;
const REVIVE_RING_GAP_ABOVE = 20;
// Above both the revive ring (20) and the "Reloading..." text (RELOAD_TEXT_GAP_ABOVE, 22) so a
// downed player's hint never overlaps either.
const REVIVE_HINT_TEXT_GAP_ABOVE = 34;

// "Press E to..." proximity hint - built for every tower/wall/the lobby (buildInteractIndicator),
// above their health bar (further up than the revive ring's own gap, since a building has no
// revive ring to share space with, but staying consistent with that spacing reads fine).
const INTERACT_INDICATOR_GAP_ABOVE = 22;

// Wave HUD, laid out left-to-right and centered at the top of the screen: "Wave x/y", a
// progress bar over the current wave's sub-waves, then the live zombie count.
const WAVE_TEXT_SIZE = { width: 110, height: 24 };
const WAVE_PROGRESS_BAR_SIZE = { width: 180, height: 14 };
const ALIVE_TEXT_SIZE = { width: 100, height: 24 };
const WAVE_HUD_GAP = 12;
const WAVE_HUD_TOP_MARGIN = 14;
// "Next round in Ns" - centered under the progress bar, only visible during the between-waves
// cooldown (wave-info-packet.handler.ts owns showing/hiding it).
const WAVE_COUNTDOWN_TEXT_SIZE = { height: 18 };
const WAVE_COUNTDOWN_GAP = 6;

// Money HUD, top-left of the screen.
const MONEY_TEXT_SIZE = { width: 140, height: 24 };
const MONEY_HUD_LEFT_MARGIN = 14;
const MONEY_HUD_TOP_MARGIN = 14;

// Build bar, bottom-center of the screen - one button per catalog entry.
const BUILD_BUTTON_SIZE = { width: 90, height: 70 };
const BUILD_BAR_GAP = 10;
const BUILD_BAR_BOTTOM_MARGIN = 20;
const GRID_STROKE = "rgba(245, 242, 233, 0.25)";
// Top-right "+"/"-" camera zoom controls, only visible/hittable in build mode alongside the build
// bar (same idiom as every other bar element) - same bottom-left-corner-anchoring pattern the ammo
// HUD uses, mirrored to the opposite corner.
const ZOOM_BUTTON_SIZE = { width: 36, height: 36 };
const ZOOM_BUTTON_GAP = 8;
const ZOOM_BUTTON_MARGIN = 16;

// Above bullets/zombies (BULLET_Z_INDEX, spawn-packet.handler.ts, is 15) so a bullet spawning at
// the player's own center (weapon.system.ts fires from the player's exact center now) renders
// tucked behind the player's body instead of floating on top of it. Zombies deliberately stay
// below BULLET_Z_INDEX (unchanged) - a bullet should never be hidden behind what it's about to
// hit, only behind the player that fired it.
const PLAYER_Z_INDEX = 16;

// Held weapon sprite, just above the hand in z-order. Each weapon's own rest-angle rotation
// offset lives in weapon-catalog.ts (client), since a shotgun's art doesn't rest at the same
// angle as the pistol's.
const WEAPON_Z_INDEX = 21;
// The one hand's original offset, preserved exactly from before dual wielding existed (and after
// its removal). Exported so weapon-reload-animation.system.ts can rebuild a weapon's own
// LocalTransform (this base offset plus that weapon's own catalog.handOffsetDelta, see there)
// when the equipped type changes.
export const WEAPON_LOCAL_OFFSET: Vector2d = { x: 6, y: 12 };

// A weapon entity's (or its reload overlay's) actual LocalTransform: WEAPON_LOCAL_OFFSET plus
// this weapon's own catalog.handOffsetDelta, if it has one. Needed because the hand and its weapon
// share the exact same LocalTransform, but each sprite's own `pivot` (see SpriteComponent) renders
// at THIS ENTITY's own position plus ITS OWN pivot - so if a weapon's pivot isn't numerically equal
// to hand.png's own default pivot (its frame center, since hand.png is an uncropped 16x16 image),
// the two entities' pivots land at different world points even sharing the same LocalTransform. A
// weapon whose pivot happens to coincide (smallGun's 16x16 crop, same size as hand.png, defaults to
// the same (8,8) center) needs no delta; one that doesn't (the shotgun's grip sits well off its own
// 52x32 frame's center) needs this correction or it renders visibly away from the hand - see
// weapon-catalog.ts's handOffsetDelta comment for how it's derived.
function weaponLocalOffset(catalog: { spriteKey: string; handOffsetDelta?: Vector2d }): Vector2d {
  const delta = catalog.handOffsetDelta;
  return delta
    ? { x: WEAPON_LOCAL_OFFSET.x + delta.x, y: WEAPON_LOCAL_OFFSET.y + delta.y }
    : WEAPON_LOCAL_OFFSET;
}

// Ammo HUD, bottom-left of the screen - a single row now (dual wielding removed). Hidden entirely
// (icon+text) whenever nothing is equipped - see reload-indicator.system.ts.
const AMMO_HUD_LEFT_MARGIN = 14;
const AMMO_HUD_BOTTOM_MARGIN = 14;
// Exported so weapon-inventory-packet.handler.ts can re-fit-scale the ammo HUD icon when the
// equipped weapon changes after construction (see there).
export const AMMO_ICON_SIZE = { width: 32, height: 32 };
const AMMO_TEXT_SIZE = { width: 100, height: 32 };
const AMMO_HUD_GAP = 10;

// World-space "Reloading..." label, shown above every player's health bar while their equipped
// weapon is mid-reload - visible to everyone nearby, not just a local HUD element (see
// buildReloadIndicator/reload-indicator.system.ts). Sits above the health bar the same way
// REVIVE_RING_GAP_ABOVE does, just further up so the two never overlap.
const RELOAD_TEXT_GAP_ABOVE = 22;

// Custom crosshair cursor - replaces the OS cursor while in GameScene (see GameScene.load and
// this file's build-bar hover handlers, below). Size/scale shared with cursor.system.ts (which
// positions it every tick), so they can't drift apart.
const CURSOR_Z_INDEX = 100;

// Coin icon, used everywhere a currency amount is shown (no coin sprite exists in this game's
// art - see hud-helpers.ts).
const COIN_ICON_RADIUS = 7;
const COIN_ICON_GAP = 4; // between the coin and the number that follows it

// Weapon shop panel, right edge of the screen, shown/hidden alongside the build bar (build mode
// active). The first right-anchored UI element in this codebase - mirrors the build
// bar/ammo HUD's bottom-anchoring idiom (window.innerHeight - size - margin) horizontally.
const SHOP_PANEL_RIGHT_MARGIN = 20;
const SHOP_ENTRY_WIDTH = 100;
const SHOP_BUY_HEIGHT = 64;
// One "Select"/"Selected" button spanning the full entry width, below the buy button - replaces
// the old two-hand L/R buttons now that dual wielding is gone.
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
    new ChildrenComponent(parentEntity.getId(), {
      LocalTransform: { x: fillLocalX, y: fillLocalY },
    }),
  );
  registry.addComponent(fill, new Direction(0, 0));
  registry.addComponent(fill, new ZIndexComponent(HEALTH_BAR_FILL_Z_INDEX));
  registry.addComponent(fill, new HealthBarFill(cavityLocalX));
}

// "Press E to..." hint text, built alongside a tower/wall/the lobby's own health bar (above it,
// see INTERACT_INDICATOR_GAP_ABOVE) - starts empty/hidden; building-interact-indicator.system.ts
// drives its text and visibility every tick off the local player's proximity and the target's own
// Health (and Tower level, if it has one).
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

// Grey->green "hold E to revive" progress circle, one per player, built alongside their health
// bar (buildHealthBar, above) but sitting higher above them so the two never overlap. Starts
// fully hidden; revive-packet.handler.ts drives visibility/progress from the server's
// authoritative revive.system.ts events, revive-indicator.system.ts positions it every tick (it's
// raw Konva shapes, not a SpriteComponent, so spriteSystem never touches it).
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

// "Hold E to revive" hint text, built alongside a player's own revive ring (above it, see
// REVIVE_HINT_TEXT_GAP_ABOVE) - starts empty/hidden; revive-hint-indicator.system.ts drives its
// visibility every tick off the local player's own proximity/aliveness and this player's Health,
// same idiom as buildInteractIndicator's tower/wall hint above.
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

// World-space "Reloading..." label, one per player, sitting above the health bar (further up
// than the revive ring - RELOAD_TEXT_GAP_ABOVE > REVIVE_RING_GAP_ABOVE - so the two never
// overlap). Starts hidden; reload-indicator.system.ts drives visibility every tick off this
// player's own Weapon.reloading and re-positions it every tick from TransformComponent, the same
// way revive-indicator.system.ts positions the revive ring's Arc/Ring - Text isn't a Sprite, so
// spriteSystem never touches it.
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

// The single hand + its held weapon for a player (buildPlayer, below). `weaponType` null means
// the player starts unequipped: the weapon sprite still exists (so
// weapon-inventory-packet.handler.ts has something to re-point later without needing to add
// components dynamically), just hidden - see reload-indicator.system.ts, which owns visibility
// for the local player's own HUD, and weapon-visibility.system.ts, which owns it for everyone
// else's.
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
  // mirrorWhenFacingLeft: true - matches the weapon's own DirectionRotatorComponent below. Without
  // this the hand and its held weapon rotate by different formulas while aiming left (only the
  // weapon flipped+re-signed its rotation), diverging by up to 2x the weapon's rest-angle offset -
  // the hand pointing one way while the gun visibly points somewhere else entirely.
  // Was -90 - reduced by the same -8 correction as the weapon offsets in weapon-catalog.ts (see
  // there for why). Unconfirmed magnitude.
  registry.addComponent(handEntity, new DirectionRotatorComponent(-98, true, true));
  registry.addComponent(handEntity, new ZIndexComponent(20));

  // Each weapon type can live on its own source image now (e.g. shotgun's Shotgun-Shot.png), not
  // just a shared weapons.png - an unequipped player has no weaponType to key off yet, so it
  // starts out looking like smallGun's (its sprite is hidden regardless - weapon-visibility.
  // system.ts/build-mode.system.ts - so the choice is arbitrary, just needs to be a valid,
  // loadable pair).
  // weapon-reload-animation.system.ts's per-tick pass re-points spriteKey/animationsKey/scale
  // (and hides this in favor of the reload overlay below) once a real weaponType is equipped.
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
      // Where the hand actually grips this weapon's art, when that isn't just the frame's
      // geometric center (see SpriteComponent's `pivot` option and weapon-catalog.ts's shotgun
      // entry) - omitted (default centering, every sprite's original behavior) for weapons that
      // don't override it.
      ...("pivot" in initialCatalog ? { pivot: initialCatalog.pivot } : {}),
      // Only meaningful for a weapon with its own "shoot" animation (see catalog.shootSeconds) -
      // otherwise irrelevant, since a weapon with no shoot animation only ever plays its single-
      // frame "idle" pose, for which frame rate is moot. Set once at construction, like the
      // reload overlay's frameRate below, since SpriteComponent.frameRate isn't reactive.
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
  // reads upside-down for the whole left half of the arc (see rotate-to-direction.system.ts).
  registry.addComponent(weaponEntity, new DirectionRotatorComponent(rotationOffset, true, true));
  registry.addComponent(weaponEntity, new ZIndexComponent(WEAPON_Z_INDEX));
  registry.addComponent(weaponEntity, new Weapon(weaponType, rotationOffset));

  // Reload-animation overlay - built once, always (regardless of what's initially equipped),
  // hidden by default. weapon-reload-animation.system.ts shows it (and hides the main weapon
  // sprite above) only while the equipped weapon actually has a reloadSpriteKey AND is reloading.
  // Hardcoded to the shotgun's reload asset for now - it's the only weapon with one; if a second
  // weapon type gains its own reload animation, this needs to become per-equipped-type instead
  // (rebuilt or re-keyed on equip, not just visibility-toggled).
  // A completely separate, independently-loaded sprite entity rather than swapping the main
  // weapon's own image at reload time on purpose: swapping destroys and recreates the Konva node
  // (setSpriteKey), which is asynchronous and was visibly glitchy (the weapon flickering out for
  // a frame or more on every reload) - toggling visibility between two sprites that already exist
  // is instant.
  const reloadOverlayCatalog = WEAPON_CATALOG.shotgun;
  const reloadOverlayEntity = registry.spawnEntity();
  registry.addComponent(
    reloadOverlayEntity,
    new TransformComponent(playerPosition.x, playerPosition.y),
  );
  registry.addComponent(
    reloadOverlayEntity,
    // Not currentAnimation: "reload" here - spriteSystem always constructs its Konva node
    // hardcoded on "idle" regardless of what's requested (see SpriteComponent.setSpriteKey's own
    // comment for the full story), so that would just set the wrapper's tracked state without it
    // ever reaching the real object. weapon-reload-animation.system.ts applies the real "reload"
    // key once the sprite actually exists, the same idempotent-every-tick way it already does for
    // the main weapon icon.
    new SpriteComponent(reloadOverlayCatalog.reloadSpriteKey, {
      layer: scene.layer,
      animationsKey: reloadOverlayCatalog.reloadAnimationsKey,
      frameRate: reloadOverlayCatalog.reloadFrameCount / reloadOverlayCatalog.reloadSeconds,
      // Same world-space scale AND pivot as the held sprite (reloadSpriteKey is the same
      // 52x32-per-frame asset pack, same resting pose in frame 0, as the held Shotgun-Shot.png) -
      // without scale this renders at its native size, roughly 2x too big next to the player;
      // without pivot it's centered on the frame's empty space instead of on the hand.
      scale: { x: reloadOverlayCatalog.scale, y: reloadOverlayCatalog.scale },
      pivot: reloadOverlayCatalog.pivot,
    }),
  );
  registry.addComponent(
    reloadOverlayEntity,
    // Same handOffsetDelta correction as the held sprite above, and for the same reason - never
    // changes at runtime (this overlay always displays the shotgun's reload asset regardless of
    // what's currently equipped - see the comment above), so it's fine to compute once here rather
    // than needing weapon-reload-animation.system.ts to re-derive it every tick.
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
  // A single row now (dual wielding removed) - same bottom-left corner the old single-weapon HUD
  // used.
  const iconX = AMMO_HUD_LEFT_MARGIN;
  const iconY = window.innerHeight - AMMO_ICON_SIZE.height - AMMO_HUD_BOTTOM_MARGIN;

  // Each weapon can live on its own source image now (see client/weapon-catalog.ts's
  // spriteKey/animationsKey), so the icon isn't always weapons.png any more either. Fit-scale
  // (uniform, aspect-preserving) each weapon's own native crop size into the fixed AMMO_ICON_SIZE
  // box, rather than assuming every icon is the same size - Shotgun-Shot.png's crop is a much
  // bigger 52x32, and scaling that by a 16-based factor on both axes would overflow the slot and
  // run into the ammo text next to it. Nothing equipped yet has no weaponType; default to
  // smallGun's image/icon size since the sprite is hidden in that state anyway.
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
  // Not setAnimation() here - the sprite doesn't exist yet (spriteSystem builds it lazily,
  // hardcoded on "idle" regardless of what's requested), so a call this early would only set the
  // wrapper's tracked state without ever reaching the real Konva object once it's created, then
  // silently block a later correction via setAnimation's own dedup guard. reload-indicator.system.ts
  // asserts the real icon animation every tick once the sprite actually exists instead.
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

  // Shown only while the tower build-bar entry is selected, centered on the placement preview -
  // lets a player see how much ground a tower would actually cover before committing to a spot.
  // Radius is set every tick by build-mode.system.ts (TOWER_RANGE, client/building-economy.ts).
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

  // Every ALREADY-BUILT tower's own range, all drawn by one Shape rather than a Circle per tower -
  // a destroyed tower's circle then needs no cleanup of its own in kill-packet.handler.ts, it
  // simply stops being drawn the next tick. Distinct from `rangeCircle` above, which only ever
  // previews ONE not-yet-placed tower while its build-bar entry is selected.
  //
  // The sceneFunc below deliberately reads ONLY this plain array, never the registry directly -
  // Konva can call sceneFunc from its own render loop, off build-mode.system.ts's tick (e.g. a
  // batched redraw after .visible()/.moveToTop()), and calling registry.getZipper() from an
  // arbitrary point in the frame like that isn't safe. build-mode.system.ts refills THIS SAME
  // array (by reference, via BuildModeComponent.towerRangeCenters) from live
  // Building/TransformComponent state once per tick instead.
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

  // "-" / "+" zoom buttons, top-right corner (screen-space, hudLayer) - "+" rightmost (closest to
  // the corner), "-" to its left, the conventional left-to-right zoom-out-to-zoom-in order. Clicks
  // here only move BuildModeComponent.targetZoomLevel; build-mode.system.ts eases the live
  // zoomLevel toward it every tick and applies that to the world layer's scale.
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
      // These buttons are only ever visible/hittable while build mode is active (see
      // build-mode.system.ts), and build mode wants the normal OS cursor, not the custom
      // crosshair - "default" is correct here, not "none" (cursor.system.ts owns "none" only
      // while build mode is off, when this handler can't fire at all).
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

    // Coin icon + cost, centered under the label - replaces the old "20g" text suffix.
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

// One column, one entry per catalog weapon, right-anchored - shown/hidden alongside the build bar
// (both gated on BuildModeComponent.active, checked in build-mode.system.ts, which also owns this
// panel's per-tick button-state refresh and the shopBounds click-guard). Clicking a weapon's icon
// buys it if unowned, buys an ammo refill if already owned (smallGun is `alwaysOwned` - no click
// handler is ever attached to it, so it's never clickable, matching "you can't click it"). Two
// small L/R buttons under every entry, including smallGun, assign/unassign that weapon to that
// hand - clicking a hand button that's already assigned to this weapon unassigns it.
function buildWeaponShop(hudLayer: Layer, registry: Registry, localPlayer: any) {
  const catalogEntries = Object.entries(WEAPON_CATALOG) as [
    WeaponType,
    (typeof WEAPON_CATALOG)[WeaponType],
  ][];
  const panelX = window.innerWidth - SHOP_ENTRY_WIDTH - SHOP_PANEL_RIGHT_MARGIN;
  const totalHeight =
    catalogEntries.length * SHOP_ENTRY_HEIGHT + (catalogEntries.length - 1) * SHOP_ENTRY_GAP;

  const weaponShop = new WeaponShopComponent([], {
    x: panelX,
    y: SHOP_TOP_MARGIN,
    width: SHOP_ENTRY_WIDTH,
    height: totalHeight,
  });
  // Seeded from the local player's starting loadout - nothing broadcasts a weaponInventory/ammo
  // packet at spawn (only buy/refill/equip events do), so without this the shop would show
  // smallGun as unowned and unselected until the first purchase.
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

    // Cost row (coin icon + number) - alwaysOwned weapons (smallGun) never show one at all, per
    // "no cost shown", not just a hidden/zeroed one.
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

    // One button per entry now (dual wielding removed) - toggles this weapon equipped/unequipped;
    // its label flips between "Select" and "Selected" (build-mode.system.ts owns that per tick).
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
      // Reserve comes from the shared per-type record; magazine is on the single equipped
      // weapon's own state now (see weapon-inventory.component.ts, server) and arrives as its own
      // magazineAmmo field instead of living inside the weapons[] entry.
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
