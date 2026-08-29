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

  // The weapon shouldn't be drawn/aimed while placing buildings - a click meant to select a
  // build-bar button or place a wall must not read as "holding up a gun" either (see
  // shoot-control.system.ts, which stops it from actually firing for the same reason). Asserted
  // every tick, not just on the toggle edge - spriteSystem creates the underlying Konva node
  // lazily, so a one-shot visible() call made before it exists would silently no-op forever.
  const localPlayers: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([NetworkId]);
  const localPlayer = localPlayers.find((p) => p.NetworkId.id === playerId);
  if (localPlayer) {
    // Same zip shape as reload-indicator.system.ts's identical lookup (weapon resolved via
    // ChildrenComponent.parentId, SpriteComponent fetched separately) - if the weapon entity ever
    // doesn't carry a SpriteComponent, this fails on "sprite missing", not silently on "weapon not
    // found" the way requiring SpriteComponent in the zip itself would.
    const weapons: { id: number; ChildrenComponent: ChildrenComponent }[] = registry.getIndexedZipper([
      Weapon,
      ChildrenComponent,
    ]);
    const weapon = weapons.find((w) => w.ChildrenComponent.parentId === localPlayer.id);
    if (weapon) {
      const sprite = registry.getEntityComponent(registry.entityFromIndex(weapon.id), SpriteComponent);
      sprite?.sprite?.visible(!buildMode.active);
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
    button.rect.stroke(button.buildingType === buildMode.selectedBuildingType ? "#F5F2E9" : "#5E8C61");
  }

  const clickPressed = !!input.isKeyPressed(InputEnum.MouseLeft);

  if (!buildMode.active || !buildMode.selectedBuildingType) {
    buildMode.previewRect.visible(false);
    buildMode.wasPlaceClickPressed = clickPressed;
    return;
  }

  const screenPointer = stage.getPointerPosition();
  const overBar =
    !!screenPointer &&
    screenPointer.x >= buildMode.barBounds.x &&
    screenPointer.x <= buildMode.barBounds.x + buildMode.barBounds.width &&
    screenPointer.y >= buildMode.barBounds.y &&
    screenPointer.y <= buildMode.barBounds.y + buildMode.barBounds.height;

  const pointerPosition = sceneManager.getScene()?.layer?.getRelativePointerPosition();

  // Over the build bar, or the cursor isn't over the map at all - no preview, and a click here
  // is for the bar's own button handlers to deal with, not a placement attempt.
  if (overBar || !pointerPosition) {
    buildMode.previewRect.visible(false);
    buildMode.wasPlaceClickPressed = clickPressed;
    return;
  }

  const tileX = Math.floor(pointerPosition.x / TILE_SIZE);
  const tileY = Math.floor(pointerPosition.y / TILE_SIZE);

  const moneyEntities: { MoneyHudComponent: MoneyHudComponent }[] = registry.getZipper([MoneyHudComponent]);
  const money = moneyEntities[0]?.MoneyHudComponent.amount ?? 0;

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
