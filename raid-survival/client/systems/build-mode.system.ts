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

// Must match server/systems/packet-handlers/start-game-packet.handler.ts's LOBBY_COLLISION_BOX
// exactly - a real box, not a tile-index check, since the lobby's footprint isn't tile-aligned.
const LOBBY_SPRITE_SIZE = { width: 187, height: 143 };
const tilesFor = (size: number) => Math.ceil(size / TILE_SIZE) * TILE_SIZE;
const LOBBY_COLLISION_BOX = {
  width: tilesFor(LOBBY_SPRITE_SIZE.width),
  height: tilesFor(LOBBY_SPRITE_SIZE.height),
};
// Must match server's own PLAYER_COLLISION_BOX exactly, or the placement preview could show a
// tile as placeable that the server then rejects.
const PLAYER_COLLISION_BOX = { width: 24, height: 24 };

// GameScene's default un-zoomed world scale. zoomLevel is a multiplier on top of this, applied
// below as BASE_WORLD_SCALE * zoomLevel.
const BASE_WORLD_SCALE = 3;

// Clamp for BuildModeComponent.targetZoomLevel - exported so the zoom buttons' click handlers can
// clamp identically without duplicating the bounds.
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;
export const ZOOM_STEP = 0.1;

// How much of the remaining gap between zoomLevel and targetZoomLevel closes per tick - matches
// CAMERA_SMOOTHING's ease shape so the zoom and the camera glide into place together.
const ZOOM_SMOOTHING = 0.1;

export function buildModeSystem(registry: Registry, ctx: Context) {
  const entities: { BuildModeComponent: BuildModeComponent }[] = registry.getZipper([
    BuildModeComponent,
  ]);
  const buildMode = entities[0]?.BuildModeComponent;
  if (!buildMode) return;

  // No SpriteComponent, so zOrderSystem never manages it - re-assert on top every tick.
  const moneyHudEntities: { MoneyHudComponent: MoneyHudComponent }[] = registry.getZipper([
    MoneyHudComponent,
  ]);
  moneyHudEntities[0]?.MoneyHudComponent.coinIcon.moveToTop();
  // Used by both the weapon shop and the building-placement afford check below.
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

  // The local player's weapon sprite shouldn't be visible while placing buildings -
  // weapon-visibility.system.ts owns the same concern for every other player. Asserted every
  // tick since spriteSystem creates the underlying Konva node lazily.
  const localPlayers: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([
    NetworkId,
  ]);
  const localPlayer = localPlayers.find((p) => p.NetworkId.id === playerId);
  if (localPlayer) {
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
    // No SpriteComponent, so zOrderSystem never manages these - re-assert on top every tick.
    buildMode.gridShape.moveToTop();
    buildMode.previewRect.moveToTop();
    buildMode.towerRangeCircles.moveToTop();

    // Refills the array towerRangeCircles' sceneFunc closure reads - done here, not inside that
    // sceneFunc, since Konva can invoke it off-tick where a live registry call isn't safe.
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

  // Eases the live zoomLevel toward targetZoomLevel and applies it to the world scale, so a
  // zoom-button click glides rather than snaps.
  //
  // Gated on the scene actually being GameScene, not just having a `layer` - nothing kills this
  // system on game-over, and MenuScene has its own unrelated unscaled layer.
  buildMode.zoomLevel += (buildMode.targetZoomLevel - buildMode.zoomLevel) * ZOOM_SMOOTHING;
  const scene = sceneManager.getScene();
  if (scene?.name === "GameScene" && scene.layer) {
    const worldScale = BASE_WORLD_SCALE * buildMode.zoomLevel;
    const oldScale = scene.layer.scaleX();

    // Only while the scale is actually changing, so this doesn't keep nudging position by
    // sub-pixel drift once zoomLevel has settled, fighting cameraFollowSystem's edge clamp.
    if (oldScale !== worldScale) {
      // Konva scales a layer's content around its own local (0,0), not the viewport center -
      // changing scale without correcting position would make every world point leap toward/away
      // from that corner. Re-solving position keeps the same world point centered across the
      // scale change instead.
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

  // Weapon shop panel - refresh visibility/button state, then send whatever a click queued up
  // last tick (click handlers have no access to the network client, so they just set intent).
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
      // Reserve only, not magazine - the equipped weapon's live magazine shows in the ammo HUD.
      entry.buyText.text(
        owned
          ? `${catalogEntry.label}\n${owned.reserveAmmo === -1 ? "∞" : owned.reserveAmmo}`
          : catalogEntry.label,
      );

      // Buying outright if unowned, refilling if owned; 0 means nothing purchasable (e.g.
      // smallGun's infiniteReserve has no refill cost) - hide the row rather than show "0".
      const price = owned ? catalogEntry.ammoRefillCost : catalogEntry.cost;
      const canAfford = money >= price;
      entry.costText.visible(buildMode.active && price > 0);
      entry.costIcon?.visible(buildMode.active && price > 0);
      if (price > 0) {
        entry.costIcon?.moveToTop();
        entry.costText.text(`${price}`);
        entry.costText.fill(canAfford ? "#F5F2E9" : "#E05C5C");
      }

      const isEquipped = weaponShop.equippedWeaponType === entry.weaponType;
      entry.selectButton.visible(buildMode.active);
      entry.selectLabel.visible(buildMode.active);
      entry.selectButton.stroke(isEquipped ? "#F5F2E9" : "#5E8C61");
      entry.selectLabel.text(!owned ? "Buy" : isEquipped ? "Selected" : "Select");
    }

    weaponShop.hintText.visible(buildMode.active);
    weaponShop.hintText.moveToTop();

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

  // Over any HUD panel, or the cursor isn't over the map - no preview, a click here belongs to
  // that panel's own button handler, not a placement attempt.
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
  // Mirrors the server's obstacle list - a wall/tower can never be dropped on top of a player.
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
    // Each building's own footprint - a tower's 3x3 must block all 9 tiles, not just its anchor.
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
