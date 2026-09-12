import { type Registry } from "@nanoforge-dev/ecs-client";

import { NetworkId } from "../components/network-id.component";
import { TransformComponent } from "../components/essentials/transform.component";
import { ChildrenComponent } from "../components/children.component";
import { Health } from "../components/health.component";
import { Lobby } from "../components/lobby/lobby.component";
import { TowerLevelComponent } from "../components/tower-level.component";
import { BuildingInteractIndicatorComponent } from "../components/building-interact-indicator.component";
import {
  LOBBY_HEAL_COST_PER_HP,
  TOWER_HEAL_COST,
  TOWER_MAX_LEVEL,
  TOWER_UPGRADE_COST,
  WALL_HEAL_COST_PER_HP,
} from "../building-economy";
import { playerId } from "../main";

// Native player sprite size (see start-game-packet.handler.ts's own copy) - just enough to
// approximate the local player's center for the proximity check below.
const LOCAL_PLAYER_SIZE = { width: 24, height: 24 };
// The real gate is server-authoritative (building-interact.system.ts's edge-to-edge Hitbox
// check, INTERACT_RANGE=20) - Hitbox is server-only, so this is a generous center-distance
// stand-in purely for deciding when to SHOW the hint text, not for whether E actually works.
const DISPLAY_INTERACT_RANGE = 46;

// Drives every tower/wall/the-lobby's "Press E to..." hint: visible only near the local player,
// text picked from the target's own Health (and TowerLevelComponent, if it has one) - heal cost
// while damaged, or (a full-HP tower only) the next upgrade's cost and current/max level.
export function buildingInteractIndicatorSystem(registry: Registry) {
  const indicators: {
    BuildingInteractIndicatorComponent: BuildingInteractIndicatorComponent;
    ChildrenComponent: ChildrenComponent;
    TransformComponent: TransformComponent;
  }[] = registry.getZipper([
    BuildingInteractIndicatorComponent,
    ChildrenComponent,
    TransformComponent,
  ]);
  if (indicators.length === 0) return;

  const players: { NetworkId: NetworkId; TransformComponent: TransformComponent }[] =
    registry.getZipper([NetworkId, TransformComponent]);
  const localPlayer = players.find((p) => p.NetworkId.id === playerId);
  const playerCenter = localPlayer
    ? {
        x: localPlayer.TransformComponent.x + LOCAL_PLAYER_SIZE.width / 2,
        y: localPlayer.TransformComponent.y + LOCAL_PLAYER_SIZE.height / 2,
      }
    : null;

  for (const {
    BuildingInteractIndicatorComponent: indicator,
    ChildrenComponent: child,
    TransformComponent: transform,
  } of indicators) {
    indicator.text.position({ x: transform.x, y: transform.y });

    if (
      !playerCenter ||
      Math.hypot(transform.x - playerCenter.x, transform.y - playerCenter.y) >
        DISPLAY_INTERACT_RANGE
    ) {
      indicator.text.visible(false);
      continue;
    }

    const parent = registry.entityFromIndex(child.parentId);
    const health = registry.getEntityComponent(parent, Health);
    if (!health) {
      indicator.text.visible(false);
      continue;
    }

    const tower = registry.getEntityComponent(parent, TowerLevelComponent);
    const lobby = registry.getEntityComponent(parent, Lobby);

    let text: string | null = null;
    if (tower) {
      if (health.current < health.max) {
        text = `Press E to repair (${TOWER_HEAL_COST}g)`;
      } else if (tower.level < TOWER_MAX_LEVEL) {
        text = `Press E: upgrade to Lv${tower.level + 1} (${TOWER_UPGRADE_COST}g) - Lv${tower.level}/${TOWER_MAX_LEVEL}`;
      } else {
        text = `Tower Lv${tower.level}/${TOWER_MAX_LEVEL} (max)`;
      }
    } else if (health.current < health.max) {
      const costPerHp = lobby ? LOBBY_HEAL_COST_PER_HP : WALL_HEAL_COST_PER_HP;
      const cost = Math.ceil((health.max - health.current) * costPerHp);
      text = `Press E to repair (${cost}g)`;
    }

    if (text) {
      indicator.text.text(text);
      indicator.text.visible(true);
    } else {
      indicator.text.visible(false);
    }
  }
}

// * Required to generate code
export default buildingInteractIndicatorSystem.name;
