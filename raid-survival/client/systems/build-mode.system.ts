import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { InputEnum, type InputLibrary } from "@nanoforge-dev/input";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";

import { BuildModeComponent } from "../components/build-mode.component";
import { MoneyHudComponent } from "../components/money-hud.component";
import { Building } from "../components/building.component";
import { Lobby } from "../components/lobby/lobby.component";
import { TransformComponent } from "../components/essentials/transform.component";
import { BUILDING_CATALOG, canPlaceBuilding, type OccupiedBox } from "../building-catalog";
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
const LOBBY_COLLISION_BOX = { width: tilesFor(LOBBY_SPRITE_SIZE.width), height: tilesFor(LOBBY_SPRITE_SIZE.height) };

export function buildModeSystem(registry: Registry, ctx: Context) {
  const entities: { BuildModeComponent: BuildModeComponent }[] = registry.getZipper([BuildModeComponent]);
  const buildMode = entities[0]?.BuildModeComponent;
  if (!buildMode) return;

  // Same raw-Konva-node z-order trap as gridShape/previewRect below, and unconditional (unlike
  // those two) since the money HUD is visible outside build mode too - re-assert on top every
  // tick regardless of what else got swept above it by zOrderSystem.
  const moneyHudEntities: { MoneyHudComponent: MoneyHudComponent }[] = registry.getZipper([MoneyHudComponent]);
  moneyHudEntities[0]?.MoneyHudComponent.coinIcon.moveToTop();

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
  // "is this hand even equipped" too) - weapon-visibility.system.ts owns the same concern, minus
  // the build-mode factor, for every other player. Asserted every tick, not just on the toggle
  // edge - spriteSystem creates the underlying Konva node lazily, so a one-shot visible() call
  // made before it exists would silently no-op forever.
  const localPlayers: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([NetworkId]);
  const localPlayer = localPlayers.find((p) => p.NetworkId.id === playerId);
  if (localPlayer) {
    // Same zip shape as reload-indicator.system.ts's identical lookup (weapon resolved via
    // ChildrenComponent.parentId, SpriteComponent fetched separately) - if the weapon entity ever
    // doesn't carry a SpriteComponent, this fails on "sprite missing", not silently on "weapon not
    // found" the way requiring SpriteComponent in the zip itself would.
    const weapons: { id: number; Weapon: Weapon; ChildrenComponent: ChildrenComponent }[] = registry.getIndexedZipper([
      Weapon,
      ChildrenComponent,
    ]);
    const localWeapons = weapons.filter((w) => w.ChildrenComponent.parentId === localPlayer.id);
    for (const w of localWeapons) {
      const sprite = registry.getEntityComponent(registry.entityFromIndex(w.id), SpriteComponent);
      sprite?.sprite?.visible(!buildMode.active && w.Weapon.weaponType !== null);
    }
  }

  buildMode.gridShape.visible(buildMode.active);
  if (buildMode.active) {
    // Neither node carries a SpriteComponent, so zOrderSystem never touches them - the moment
    // any z-indexed sprite set changes (the first zombie spawns within seconds of game start),
    // every z-indexed sprite gets swept above whatever isn't in that system's zipper, including
    // these two, permanently. Re-asserting "on top" every tick here is independent of that sweep
    // and keeps them visible regardless of what else moved around them.
    buildMode.gridShape.moveToTop();
    buildMode.previewRect.moveToTop();
  }
  for (const button of buildMode.barButtons) {
    button.rect.visible(buildMode.active);
    button.text.visible(buildMode.active);
    button.costText.visible(buildMode.active);
    button.costIcon.visible(buildMode.active);
    button.costIcon.moveToTop(); // same raw-Konva z-order trap as gridShape/previewRect above
    button.rect.stroke(button.buildingType === buildMode.selectedBuildingType ? "#F5F2E9" : "#5E8C61");
  }

  // Weapon shop panel - visibility/button state refresh, then send whatever a click queued up
  // last tick (start-game-packet.handler.ts's click handlers have no access to the network
  // client, so they just set intent here - same split buildBuildMode/this file already use for
  // building placement).
  const weaponShops: { WeaponShopComponent: WeaponShopComponent }[] = registry.getZipper([WeaponShopComponent]);
  const weaponShop = weaponShops[0]?.WeaponShopComponent;
  if (weaponShop) {
    for (const entry of weaponShop.entries) {
      const catalogEntry = WEAPON_CATALOG[entry.weaponType];
      const owned = weaponShop.owned.get(entry.weaponType);

      entry.buyRect.visible(buildMode.active);
      entry.buyText.visible(buildMode.active);
      // Reserve only, not magazine - a weapon's magazine is per-hand now (see
      // weapon-inventory.component.ts, server), so a per-type shop entry has no single "the"
      // magazine number to show. The ammo HUD rows (bottom-left, one per hand) are where per-hand
      // magazine content actually lives.
      entry.buyText.text(owned ? `${catalogEntry.label}\n${owned.reserveAmmo === -1 ? "∞" : owned.reserveAmmo}` : catalogEntry.label);

      if (!catalogEntry.alwaysOwned) {
        entry.costText.visible(buildMode.active);
        entry.costIcon?.visible(buildMode.active);
        entry.costIcon?.moveToTop(); // same raw-Konva z-order trap as gridShape/previewRect above
        entry.costText.text(owned ? `${catalogEntry.ammoRefillCost}` : `${catalogEntry.cost}`);
      }

      entry.leftButton.visible(buildMode.active);
      entry.rightButton.visible(buildMode.active);
      entry.leftButton.stroke(weaponShop.leftWeaponType === entry.weaponType ? "#F5F2E9" : "#5E8C61");
      entry.rightButton.stroke(weaponShop.rightWeaponType === entry.weaponType ? "#F5F2E9" : "#5E8C61");
    }

    if (weaponShop.pendingBuyType) {
      const weaponType = weaponShop.pendingBuyType;
      weaponShop.pendingBuyType = null;
      const packetType = weaponShop.owned.has(weaponType) ? "buyAmmo" : "buyWeapon";
      network.tcp.sendData(new TextEncoder().encode(JSON.stringify({ type: packetType, weaponType })));
    }

    if (weaponShop.pendingEquip) {
      const { hand, weaponType } = weaponShop.pendingEquip;
      weaponShop.pendingEquip = null;
      network.tcp.sendData(new TextEncoder().encode(JSON.stringify({ type: "equipWeapon", hand, weaponType })));
    }
  }

  const clickPressed = !!input.isKeyPressed(InputEnum.MouseLeft);

  if (!buildMode.active || !buildMode.selectedBuildingType) {
    buildMode.previewRect.visible(false);
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

  const pointerPosition = sceneManager.getScene()?.layer?.getRelativePointerPosition();

  // Over the build bar or the weapon shop, or the cursor isn't over the map at all - no preview,
  // and a click here is for one of those panels' own button handlers to deal with, not a
  // placement attempt.
  if (overBar || overShop || !pointerPosition) {
    buildMode.previewRect.visible(false);
    buildMode.wasPlaceClickPressed = clickPressed;
    return;
  }

  const tileX = Math.floor(pointerPosition.x / TILE_SIZE);
  const tileY = Math.floor(pointerPosition.y / TILE_SIZE);

  const money = moneyHudEntities[0]?.MoneyHudComponent.amount ?? 0;

  const lobbies: { TransformComponent: TransformComponent }[] = registry.getZipper([Lobby, TransformComponent]);
  const existingBuildings: { TransformComponent: TransformComponent }[] = registry.getZipper([
    Building,
    TransformComponent,
  ]);

  const obstacles: OccupiedBox[] = [
    ...lobbies.map(({ TransformComponent: t }) => ({
      x: t.x,
      y: t.y,
      width: LOBBY_COLLISION_BOX.width,
      height: LOBBY_COLLISION_BOX.height,
    })),
    ...existingBuildings.map(({ TransformComponent: t }) => ({ x: t.x, y: t.y, width: TILE_SIZE, height: TILE_SIZE })),
  ];

  const catalogEntry = BUILDING_CATALOG[buildMode.selectedBuildingType];
  const tileFree = canPlaceBuilding(tileX, tileY, TILE_SIZE, MAP_COLS, MAP_ROWS, isTreeCell, obstacles);
  const valid = tileFree && money >= catalogEntry.cost;

  buildMode.previewRect.visible(true);
  buildMode.previewRect.position({ x: tileX * TILE_SIZE, y: tileY * TILE_SIZE });
  buildMode.previewRect.fill(valid ? "rgba(76, 175, 80, 0.55)" : "rgba(220, 60, 60, 0.55)");

  if (clickPressed && !buildMode.wasPlaceClickPressed && valid) {
    network.tcp.sendData(
      new TextEncoder().encode(
        JSON.stringify({ type: "build", tileX, tileY, buildingType: buildMode.selectedBuildingType }),
      ),
    );
  }
  buildMode.wasPlaceClickPressed = clickPressed;
}

// * Required to generate code
export default buildModeSystem.name;
