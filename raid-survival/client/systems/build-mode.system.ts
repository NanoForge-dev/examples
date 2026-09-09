import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { InputEnum, type InputLibrary } from "@nanoforge-dev/input";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";

import { BuildModeComponent } from "../components/build-mode.component";
import { MoneyHudComponent } from "../components/money-hud.component";
import { Building } from "../components/building.component";
import { Player } from "../components/player.component";
import { Lobby } from "../components/lobby/lobby.component";
import { TransformComponent } from "../components/essentials/transform.component";
import { BUILDING_CATALOG, canPlaceBuilding, type OccupiedBox } from "../building-catalog";
import { TOWER_RANGE } from "../building-economy";
import { TILE_SIZE, MAP_COLS, MAP_ROWS, isTreeCell } from "../map-data";
import { sceneManager, playerId } from "../main";
import { NetworkId } from "../components/network-id.component";
import { ChildrenComponent } from "../components/children.component";
import { Weapon } from "../components/weapon.component";
import { SpriteComponent } from "../components/renderable/sprite.component";
import { WeaponShopComponent } from "../components/weapon-shop.component";
import { WEAPON_CATALOG } from "../weapon-catalog";

// Native size of the truck+house crop (objects-animations.txt's "idle" frame), rounded up to
// whole tiles - must match server/systems/packet-handlers/start-game-packet.handler.ts's
// LOBBY_COLLISION_BOX exactly. The lobby's footprint isn't tile-aligned by position (verified
// against that file's constants), so this is a real box, not a tile-index check.
const LOBBY_SPRITE_SIZE = { width: 187, height: 143 };
const tilesFor = (size: number) => Math.ceil(size / TILE_SIZE) * TILE_SIZE;
const LOBBY_COLLISION_BOX = {
  width: tilesFor(LOBBY_SPRITE_SIZE.width),
  height: tilesFor(LOBBY_SPRITE_SIZE.height),
};
// Must match server/systems/packet-handlers/start-game-packet.handler.ts's own PLAYER_COLLISION_BOX
// exactly - the placement preview needs to agree with build-packet.handler.ts's real obstacle
// check (which now blocks on every player's CollisionBox too), or a tile the preview shows as
// placeable could still get rejected server-side.
const PLAYER_COLLISION_BOX = { width: 24, height: 24 };

// GameScene.ts's own initial `this.layer.scale({x: 3, y: 3})` - the game's default, un-zoomed
// view. BuildModeComponent.zoomLevel is a MULTIPLIER on top of this base, not a replacement for
// it (applied below as BASE_WORLD_SCALE * zoomLevel) - so the default zoomLevel of 1 reproduces
// today's normal view exactly, rather than snapping the whole game to 1x the instant this system
// starts writing the layer's scale every tick.
const BASE_WORLD_SCALE = 3;

// Clamp for BuildModeComponent.targetZoomLevel - exported so the zoom buttons' own click handlers
// (start-game-packet.handler.ts, no access to this system's per-tick pass) can clamp identically
// rather than duplicating the bounds. 0.5 (zoomed out, see more map) to 2 (zoomed in further)
// around the 1:1 default, +/-0.1 per click - arbitrary, easy to retune.
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;
export const ZOOM_STEP = 0.1;

// How much of the remaining gap between the live zoomLevel and targetZoomLevel closes per tick -
// same exponential-ease shape as CAMERA_SMOOTHING (camera-follow.system.ts), and deliberately
// similar in magnitude: cameraFollowSystem recomputes its own target fresh every tick from the
// CURRENT live scale, so a zoom that eases in no faster than the camera itself already eases
// toward the player never gets ahead of it - both glide into place together instead of the scale
// snapping instantly and the camera visibly lurching to catch up (the "shake" this replaces).
const ZOOM_SMOOTHING = 0.1;

export function buildModeSystem(registry: Registry, ctx: Context) {
  const entities: { BuildModeComponent: BuildModeComponent }[] = registry.getZipper([
    BuildModeComponent,
  ]);
  const buildMode = entities[0]?.BuildModeComponent;
  if (!buildMode) return;

  // Same raw-Konva-node z-order trap as gridShape/previewRect below, and unconditional (unlike
  // those two) since the money HUD is visible outside build mode too - re-assert on top every
  // tick regardless of what else got swept above it by zOrderSystem.
  const moneyHudEntities: { MoneyHudComponent: MoneyHudComponent }[] = registry.getZipper([
    MoneyHudComponent,
  ]);
  moneyHudEntities[0]?.MoneyHudComponent.coinIcon.moveToTop();
  // Pulled up here (used both by the weapon shop below, which runs regardless of build-mode
  // placement state, and by the building-placement afford check further down).
  const money = moneyHudEntities[0]?.MoneyHudComponent.amount ?? 0;

  const input = ctx.libs.getInput<InputLibrary>();
  const network = ctx.libs.getNetwork<NetworkClientLibrary>();
  const stage = ctx.libs.getGraphics<Graphics2DLibrary>().stage;

  const togglePressed = !!input.isKeyPressed(InputEnum.KeyB);
  if (togglePressed && !buildMode.wasTogglePressed) {
    buildMode.active = !buildMode.active;
    if (!buildMode.active) buildMode.selectedBuildingType = null;
    // Set once, right on the transition - a normal, precise OS cursor for selecting/placing
    // while building, the custom crosshair (cursor.system.ts) otherwise. cursor.system.ts leaves
    // style.cursor alone entirely while build mode is active, so this doesn't get fought every
    // tick, and the build bar's own hover/mouseout handlers
    // (start-game-packet.handler.ts) own it from here until the mode toggles off again.
    stage.container().style.cursor = buildMode.active ? "default" : "none";
  }
  buildMode.wasTogglePressed = togglePressed;

  // The weapon(s) shouldn't be drawn/aimed while placing buildings - a click meant to select a
  // build-bar/shop button or place a wall must not read as "holding up a gun" either (see
  // shoot-control.system.ts, which stops it from actually firing for the same reason). This is
  // also the sole owner of the local player's weapon-sprite visibility overall (folding in
  // "is anything even equipped" too) - weapon-visibility.system.ts owns the same concern, minus
  // the build-mode factor, for every other player. Asserted every tick, not just on the toggle
  // edge - spriteSystem creates the underlying Konva node lazily, so a one-shot visible() call
  // made before it exists would silently no-op forever.
  const localPlayers: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([
    NetworkId,
  ]);
  const localPlayer = localPlayers.find((p) => p.NetworkId.id === playerId);
  if (localPlayer) {
    // Same zip shape as reload-indicator.system.ts's identical lookup (weapon resolved via
    // ChildrenComponent.parentId, SpriteComponent fetched separately) - if the weapon entity ever
    // doesn't carry a SpriteComponent, this fails on "sprite missing", not silently on "weapon not
    // found" the way requiring SpriteComponent in the zip itself would.
    const weapons: { id: number; Weapon: Weapon; ChildrenComponent: ChildrenComponent }[] =
      registry.getIndexedZipper([Weapon, ChildrenComponent]);
    const localWeapons = weapons.filter((w) => w.ChildrenComponent.parentId === localPlayer.id);
    for (const w of localWeapons) {
      const sprite = registry.getEntityComponent(registry.entityFromIndex(w.id), SpriteComponent);
      sprite?.sprite?.visible(!buildMode.active && w.Weapon.weaponType !== null);
    }
  }

  buildMode.gridShape.visible(buildMode.active);
  buildMode.towerRangeCircles.visible(buildMode.active);
  if (buildMode.active) {
    // Neither node carries a SpriteComponent, so zOrderSystem never touches them - the moment
    // any z-indexed sprite set changes (the first zombie spawns within seconds of game start),
    // every z-indexed sprite gets swept above whatever isn't in that system's zipper, including
    // these two, permanently. Re-asserting "on top" every tick here is independent of that sweep
    // and keeps them visible regardless of what else moved around them.
    buildMode.gridShape.moveToTop();
    buildMode.previewRect.moveToTop();
    buildMode.towerRangeCircles.moveToTop();

    // Refills the SAME array towerRangeCircles' own sceneFunc closure reads (see
    // start-game-packet.handler.ts) - done here, not inside that sceneFunc, because Konva can
    // invoke sceneFunc from its own render loop, off this system's tick, where a live
    // registry.getZipper() call wouldn't be safe. Only recomputed while visible - a hidden
    // Shape's stale contents from the last time build mode was active can never be drawn.
    const towers: { Building: Building; TransformComponent: TransformComponent }[] =
      registry.getZipper([Building, TransformComponent]);
    buildMode.towerRangeCenters.length = 0;
    for (const { Building: building, TransformComponent: transform } of towers) {
      if (building.buildingType !== "tower") continue;
      const footprint = BUILDING_CATALOG[building.buildingType].footprintTiles;
      buildMode.towerRangeCenters.push({
        x: transform.x + (footprint.width * TILE_SIZE) / 2,
        y: transform.y + (footprint.height * TILE_SIZE) / 2,
      });
    }
  }

  // Ease the LIVE zoomLevel toward targetZoomLevel a little every tick, then apply IT (never
  // targetZoomLevel directly) to the world scale - a "+"/"-" click only moves the target, so the
  // actual on-screen zoom always glides rather than snapping. Applied unconditionally (not gated
  // on buildMode.active) - the buttons that move targetZoomLevel only show up in build mode, but
  // the zoom itself is a camera setting, not a build-mode-only visual, so it keeps easing toward
  // wherever it was left even after build mode toggles back off. cameraFollowSystem reads this
  // same world layer's scale back out every tick for its own centering/clamping math, so writing
  // it here is the entire feature - nothing else needs to know about it.
  //
  // Gated on the current scene actually BEING GameScene (not just having a `layer`, which every
  // Scene does - see Scene.ts) because nothing kills this entity/system on game-over: after a
  // return to MenuScene, buildModeSystem keeps running against the surviving BuildModeComponent,
  // and MenuScene has its own unrelated (unscaled) `layer` for its lobby UI. Without this check,
  // the very next tick after a game ends would stamp GameScene's 3x world scale onto the menu.
  buildMode.zoomLevel += (buildMode.targetZoomLevel - buildMode.zoomLevel) * ZOOM_SMOOTHING;
  const scene = sceneManager.getScene();
  if (scene?.name === "GameScene" && scene.layer) {
    const worldScale = BASE_WORLD_SCALE * buildMode.zoomLevel;
    const oldScale = scene.layer.scaleX();

    // Only while the scale is actually changing - this correction exists to cancel the leap a
    // scale change itself would otherwise cause (see below), not to run every idle tick. Left
    // unconditional, this floating-point round trip (divide by oldScale, multiply by worldScale)
    // would keep nudging position by sub-pixel drift forever even once zoomLevel has settled,
    // fighting cameraFollowSystem's own map-edge clamp (clampCameraAxis) at the moment it matters
    // most - near a border, holding position dead still. Two writers touching that value every
    // frame there is exactly what reads as jitter.
    if (oldScale !== worldScale) {
      // Konva scales a layer's CONTENT around its own local (0,0), which is NOT the viewport
      // center - left alone, changing scale without touching position makes every world point
      // except local (0,0) itself visibly leap toward/away from that corner (the player included,
      // by `player.x * (newScale - oldScale)` pixels - hundreds of pixels for a player far from
      // world origin). Re-solving position so the SAME world point that was centered on screen a
      // moment ago is still centered after the new scale removes that leap entirely, rather than
      // merely easing it out over time: cameraFollowSystem runs right after this (main.ts), reads
      // back an already-correctly-centered position as its "current", and only has its own normal
      // small per-tick catch-up toward the player left to do - not a scale-sized jump to absorb.
      const viewWidth = scene.layer.width();
      const viewHeight = scene.layer.height();
      const pos = scene.layer.position();
      const centeredWorldX = (viewWidth / 2 - pos.x) / oldScale;
      const centeredWorldY = (viewHeight / 2 - pos.y) / oldScale;

      scene.layer.scale({ x: worldScale, y: worldScale });
      scene.layer.position({
        x: viewWidth / 2 - centeredWorldX * worldScale,
        y: viewHeight / 2 - centeredWorldY * worldScale,
      });
    }
  }

  // rect/text alone, same shape as every barButtons entry below - no moveToTop needed the way
  // gridShape/previewRect/towerRangeCircles above need it: those share worldLayer with every
  // z-indexed sprite zOrderSystem reshuffles; hudLayer (here) holds nothing zOrderSystem ever
  // touches, so nothing here ever gets swept out from under a one-time build-time stacking order.
  buildMode.zoomInButton.rect.visible(buildMode.active);
  buildMode.zoomInButton.text.visible(buildMode.active);
  buildMode.zoomOutButton.rect.visible(buildMode.active);
  buildMode.zoomOutButton.text.visible(buildMode.active);

  for (const button of buildMode.barButtons) {
    button.rect.visible(buildMode.active);
    button.text.visible(buildMode.active);
    button.costText.visible(buildMode.active);
    button.costIcon.visible(buildMode.active);
    button.costIcon.moveToTop(); // same raw-Konva z-order trap as gridShape/previewRect above
    button.rect.stroke(
      button.buildingType === buildMode.selectedBuildingType ? "#F5F2E9" : "#5E8C61",
    );
  }
  buildMode.destroyButton.rect.visible(buildMode.active);
  buildMode.destroyButton.text.visible(buildMode.active);
  buildMode.destroyButton.rect.stroke(buildMode.destroyMode ? "#F5F2E9" : "#8C5E5E");

  // Weapon shop panel - visibility/button state refresh, then send whatever a click queued up
  // last tick (start-game-packet.handler.ts's click handlers have no access to the network
  // client, so they just set intent here - same split buildBuildMode/this file already use for
  // building placement).
  const weaponShops: { WeaponShopComponent: WeaponShopComponent }[] = registry.getZipper([
    WeaponShopComponent,
  ]);
  const weaponShop = weaponShops[0]?.WeaponShopComponent;
  if (weaponShop) {
    for (const entry of weaponShop.entries) {
      const catalogEntry = WEAPON_CATALOG[entry.weaponType];
      const owned = weaponShop.owned.get(entry.weaponType);

      entry.buyRect.visible(buildMode.active);
      entry.buyText.visible(buildMode.active);
      // Reserve only, not magazine - a weapon's magazine lives on the single equipped weapon's
      // own fire state now (see weapon-inventory.component.ts, server), so a per-type shop entry
      // has no single "the" magazine number to show for a type that isn't currently equipped. The
      // ammo HUD (bottom-left) is where the equipped weapon's live magazine content actually lives.
      entry.buyText.text(
        owned
          ? `${catalogEntry.label}\n${owned.reserveAmmo === -1 ? "∞" : owned.reserveAmmo}`
          : catalogEntry.label,
      );

      // Whichever price actually applies right now - buying outright if unowned, refilling if
      // owned. 0 means nothing is actually purchasable here (e.g. smallGun's infiniteReserve has
      // no refill cost once owned) - hide the row entirely rather than show a meaningless "0".
      const price = owned ? catalogEntry.ammoRefillCost : catalogEntry.cost;
      const canAfford = money >= price;
      entry.costText.visible(buildMode.active && price > 0);
      entry.costIcon?.visible(buildMode.active && price > 0);
      if (price > 0) {
        entry.costIcon?.moveToTop(); // same raw-Konva z-order trap as gridShape/previewRect above
        entry.costText.text(`${price}`);
        entry.costText.fill(canAfford ? "#F5F2E9" : "#E05C5C");
      }

      const isEquipped = weaponShop.equippedWeaponType === entry.weaponType;
      entry.selectButton.visible(buildMode.active);
      entry.selectLabel.visible(buildMode.active);
      entry.selectButton.stroke(isEquipped ? "#F5F2E9" : "#5E8C61");
      // Not owned yet - this button buys instead of equipping (see its click handler,
      // start-game-packet.handler.ts), so it reads "Buy" rather than an equip state it can't reach.
      entry.selectLabel.text(!owned ? "Buy" : isEquipped ? "Selected" : "Select");
    }

    // Explained once for the whole column rather than per entry - see buildWeaponShop.
    weaponShop.hintText.visible(buildMode.active);
    weaponShop.hintText.moveToTop(); // same raw-Konva z-order trap as gridShape/previewRect above

    if (weaponShop.pendingBuyType) {
      const weaponType = weaponShop.pendingBuyType;
      weaponShop.pendingBuyType = null;
      const packetType = weaponShop.owned.has(weaponType) ? "buyAmmo" : "buyWeapon";
      network.tcp.sendData(
        new TextEncoder().encode(JSON.stringify({ type: packetType, weaponType })),
      );
    }

    if (weaponShop.pendingEquip) {
      const { weaponType } = weaponShop.pendingEquip;
      weaponShop.pendingEquip = null;
      network.tcp.sendData(
        new TextEncoder().encode(JSON.stringify({ type: "equipWeapon", weaponType })),
      );
    }
  }

  const clickPressed = !!input.isKeyPressed(InputEnum.MouseLeft);

  if (!buildMode.active || (!buildMode.selectedBuildingType && !buildMode.destroyMode)) {
    buildMode.previewRect.visible(false);
    buildMode.rangeCircle.visible(false);
    buildMode.wasPlaceClickPressed = clickPressed;
    return;
  }

  const screenPointer = stage.getPointerPosition();
  const overBox = (box: { x: number; y: number; width: number; height: number }) =>
    !!screenPointer &&
    screenPointer.x >= box.x &&
    screenPointer.x <= box.x + box.width &&
    screenPointer.y >= box.y &&
    screenPointer.y <= box.y + box.height;
  const overBar = overBox(buildMode.barBounds);
  const overShop = !!weaponShop && overBox(weaponShop.shopBounds);
  const overZoomButtons = overBox(buildMode.zoomBounds);

  const pointerPosition = sceneManager.getScene()?.layer?.getRelativePointerPosition();

  // Over the build bar, the weapon shop, or the zoom buttons, or the cursor isn't over the map at
  // all - no preview, and a click here is for one of those panels' own button handlers to deal
  // with, not a placement attempt (without the zoom-buttons check, clicking "+"/"-" up in the
  // top-right corner would also place/destroy whatever tile happens to sit behind them).
  if (overBar || overShop || overZoomButtons || !pointerPosition) {
    buildMode.previewRect.visible(false);
    buildMode.rangeCircle.visible(false);
    buildMode.wasPlaceClickPressed = clickPressed;
    return;
  }

  const tileX = Math.floor(pointerPosition.x / TILE_SIZE);
  const tileY = Math.floor(pointerPosition.y / TILE_SIZE);

  if (buildMode.destroyMode) {
    buildMode.rangeCircle.visible(false);

    const allBuildings: {
      Building: Building;
      TransformComponent: TransformComponent;
      NetworkId: NetworkId;
    }[] = registry.getZipper([Building, TransformComponent, NetworkId]);
    const target = allBuildings.find(({ Building: b, TransformComponent: t }) => {
      const footprint = BUILDING_CATALOG[b.buildingType].footprintTiles;
      const buildingTileX = t.x / TILE_SIZE;
      const buildingTileY = t.y / TILE_SIZE;
      return (
        tileX >= buildingTileX &&
        tileX < buildingTileX + footprint.width &&
        tileY >= buildingTileY &&
        tileY < buildingTileY + footprint.height
      );
    });

    if (target) {
      const footprint = BUILDING_CATALOG[target.Building.buildingType].footprintTiles;
      buildMode.previewRect.visible(true);
      buildMode.previewRect.size({
        width: footprint.width * TILE_SIZE,
        height: footprint.height * TILE_SIZE,
      });
      buildMode.previewRect.position({
        x: target.TransformComponent.x,
        y: target.TransformComponent.y,
      });
      buildMode.previewRect.fill("rgba(220, 60, 60, 0.55)");

      if (clickPressed && !buildMode.wasPlaceClickPressed) {
        network.tcp.sendData(
          new TextEncoder().encode(
            JSON.stringify({ type: "destroyBuilding", id: target.NetworkId.id }),
          ),
        );
      }
    } else {
      buildMode.previewRect.visible(false);
    }

    buildMode.wasPlaceClickPressed = clickPressed;
    return;
  }

  const lobbies: { TransformComponent: TransformComponent }[] = registry.getZipper([
    Lobby,
    TransformComponent,
  ]);
  const existingBuildings: { Building: Building; TransformComponent: TransformComponent }[] =
    registry.getZipper([Building, TransformComponent]);
  // Every player (dead or alive, local or not) - mirrors build-packet.handler.ts's server-side
  // obstacle list, which now blocks on every player's CollisionBox too, so a wall/tower can never
  // be dropped on top of one and trap them with no way to walk back out.
  const players: { TransformComponent: TransformComponent }[] = registry.getZipper([
    Player,
    TransformComponent,
  ]);

  const obstacles: OccupiedBox[] = [
    ...lobbies.map(({ TransformComponent: t }) => ({
      x: t.x,
      y: t.y,
      width: LOBBY_COLLISION_BOX.width,
      height: LOBBY_COLLISION_BOX.height,
    })),
    // Each existing building's OWN footprint, not a hardcoded tile - a tower's 3x3 must block
    // placement across all 9 of its tiles, not just its anchor one.
    ...existingBuildings.map(({ Building: b, TransformComponent: t }) => {
      const footprint = BUILDING_CATALOG[b.buildingType].footprintTiles;
      return {
        x: t.x,
        y: t.y,
        width: footprint.width * TILE_SIZE,
        height: footprint.height * TILE_SIZE,
      };
    }),
    ...players.map(({ TransformComponent: t }) => ({
      x: t.x,
      y: t.y,
      width: PLAYER_COLLISION_BOX.width,
      height: PLAYER_COLLISION_BOX.height,
    })),
  ];

  // Guaranteed non-null here: the early guard above only lets execution reach this point when
  // either selectedBuildingType or destroyMode is set, and destroyMode already returned above.
  if (!buildMode.selectedBuildingType) {
    buildMode.wasPlaceClickPressed = clickPressed;
    return;
  }
  const catalogEntry = BUILDING_CATALOG[buildMode.selectedBuildingType];
  const tileFree = canPlaceBuilding(
    tileX,
    tileY,
    TILE_SIZE,
    MAP_COLS,
    MAP_ROWS,
    isTreeCell,
    obstacles,
    catalogEntry.footprintTiles,
  );
  const valid = tileFree && money >= catalogEntry.cost;

  buildMode.previewRect.visible(true);
  buildMode.previewRect.size({
    width: catalogEntry.footprintTiles.width * TILE_SIZE,
    height: catalogEntry.footprintTiles.height * TILE_SIZE,
  });
  buildMode.previewRect.position({ x: tileX * TILE_SIZE, y: tileY * TILE_SIZE });
  buildMode.previewRect.fill(valid ? "rgba(76, 175, 80, 0.55)" : "rgba(220, 60, 60, 0.55)");

  // Only a tower has a firing range worth previewing - centered on the footprint the same way
  // the preview rect itself is anchored.
  if (buildMode.selectedBuildingType === "tower") {
    buildMode.rangeCircle.visible(true);
    buildMode.rangeCircle.radius(TOWER_RANGE);
    buildMode.rangeCircle.position({
      x: tileX * TILE_SIZE + (catalogEntry.footprintTiles.width * TILE_SIZE) / 2,
      y: tileY * TILE_SIZE + (catalogEntry.footprintTiles.height * TILE_SIZE) / 2,
    });
  } else {
    buildMode.rangeCircle.visible(false);
  }

  if (clickPressed && !buildMode.wasPlaceClickPressed && valid) {
    network.tcp.sendData(
      new TextEncoder().encode(
        JSON.stringify({
          type: "build",
          tileX,
          tileY,
          buildingType: buildMode.selectedBuildingType,
        }),
      ),
    );
  }
  buildMode.wasPlaceClickPressed = clickPressed;
}

// * Required to generate code
export default buildModeSystem.name;
