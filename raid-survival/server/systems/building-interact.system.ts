import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { Login } from "../components/login.component";
import { Position } from "../components/position.component";
import { Hitbox } from "../components/hitbox.component";
import { Health } from "../components/health.component";
import { ReviveInput } from "../components/revive-input.component";
import { Building } from "../components/building.component";
import { Tower } from "../components/tower.component";
import { Lobby } from "../components/lobby.component";
import { Money } from "../components/money.component";
import { distanceBetweenHitboxes } from "./zombie-ai";
import {
  TOWER_HEAL_COST,
  TOWER_HP_PER_LEVEL,
  TOWER_MAX_LEVEL,
  TOWER_UPGRADE_COST,
} from "./tower.system";
import { sendToInGamePlayers } from "../network-utils";

// Same "close enough to interact" radius for every target type - a player-to-nearby-entity
// E-press check, no reason for a per-type value.
export const INTERACT_RANGE = 20;

// Repair economics for non-tower targets (towers have their own flat heal/upgrade cost - see
// tower.system.ts). Both invented for this feature (the request gave exact numbers, but not a
// unit - "1 gold per hp"/"1 gold for 3 hp" read most naturally as these two rates), easy to
// retune.
const LOBBY_HEAL_COST_PER_HP = 1;
const WALL_HEAL_COST_PER_HP = 1 / 3;

interface Candidate {
  id: number;
  position: Position;
  hitbox: Hitbox;
  health: Health;
  // Present only for a tower - is what makes the upgrade branch (vs. a wall/lobby's heal-only
  // branch) apply below.
  tower: Tower | undefined;
  healCostPerHp: number;
}

// The instant E-press building interaction: heal a damaged building/the lobby to full, or (for a
// tower already at full HP) spend money to upgrade it one level - never both from the same press.
// Reuses ReviveInput's `interactRequested` one-shot (same E key as the hold-to-revive channel, a
// separate action) and `held`-key precedent's held/one-shot split - see input-packet.handler.ts.
export function buildingInteractSystem(registry: Registry, ctx: Context) {
  const players: {
    id: number;
    Login: Login;
    Position: Position;
    Hitbox: Hitbox;
    Health: Health;
    ReviveInput: ReviveInput;
  }[] = registry.getIndexedZipper([Login, Position, Hitbox, Health, ReviveInput]);
  if (players.length === 0) return;

  const buildings: {
    id: number;
    Building: Building;
    Position: Position;
    Hitbox: Hitbox;
    Health: Health;
  }[] = registry.getIndexedZipper([Building, Position, Hitbox, Health]);
  const lobbies: { id: number; Position: Position; Hitbox: Hitbox; Health: Health }[] =
    registry.getIndexedZipper([Lobby, Position, Hitbox, Health]);

  const candidates: Candidate[] = [
    ...buildings.map((b) => ({
      id: b.id,
      position: b.Position,
      hitbox: b.Hitbox,
      health: b.Health,
      tower: registry.getEntityComponent(registry.entityFromIndex(b.id), Tower) ?? undefined,
      healCostPerHp: WALL_HEAL_COST_PER_HP,
    })),
    ...lobbies.map((l) => ({
      id: l.id,
      position: l.Position,
      hitbox: l.Hitbox,
      health: l.Health,
      tower: undefined,
      healCostPerHp: LOBBY_HEAL_COST_PER_HP,
    })),
  ];

  const moneyEntities: { Money: Money }[] = registry.getZipper([Money]);
  const money = moneyEntities[0]?.Money;
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  for (const player of players) {
    const input = player.ReviveInput;
    if (!input.interactRequested) continue;
    // Consumed unconditionally, whether or not anything below actually happens - same "one-shot,
    // cleared regardless of outcome" idea as ShootInput.reloadRequested in weapon.system.ts.
    input.interactRequested = false;

    if (player.Health.current <= 0) continue; // a downed player can't interact with anything
    // An active revive channel (this exact E key, held) claims this press instead - see
    // revive.system.ts, which is registered before this system.
    if (input.targetId !== null) continue;
    if (!money) continue;

    let nearest: Candidate | null = null;
    let nearestDistance = INTERACT_RANGE;
    for (const candidate of candidates) {
      const distance = distanceBetweenHitboxes(
        player.Position,
        player.Hitbox,
        candidate.position,
        candidate.hitbox,
      );
      if (distance <= nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }
    if (!nearest) continue;

    if (nearest.tower) {
      // Tower: flat heal-to-full cost, or a flat per-level upgrade cost once already full.
      if (nearest.health.current < nearest.health.max) {
        if (money.amount < TOWER_HEAL_COST) continue;
        money.amount -= TOWER_HEAL_COST;
        nearest.health.current = nearest.health.max;
      } else if (nearest.tower.level < TOWER_MAX_LEVEL) {
        if (money.amount < TOWER_UPGRADE_COST) continue;
        money.amount -= TOWER_UPGRADE_COST;
        nearest.tower.level += 1;
        nearest.health.max += TOWER_HP_PER_LEVEL;
        nearest.health.current = nearest.health.max;
      } else {
        continue; // already max level and already at full HP - nothing to do
      }

      sendToInGamePlayers(network, {
        type: "towerUpdate",
        id: nearest.id,
        level: nearest.tower.level,
        health: { current: nearest.health.current, max: nearest.health.max },
      });
    } else {
      // Wall/lobby: heal-only, no levels - per-HP cost, rounded up so even 1 missing HP costs at
      // least 1 gold.
      if (nearest.health.current >= nearest.health.max) continue; // nothing to repair
      const missing = nearest.health.max - nearest.health.current;
      const cost = Math.ceil(missing * nearest.healCostPerHp);
      if (money.amount < cost) continue;
      money.amount -= cost;
      nearest.health.current = nearest.health.max;

      // Same generic Health-update event the loot-box heal-box uses - the client applies it to
      // ANY entity by NetworkId, buildings/lobby included, no new packet type needed.
      sendToInGamePlayers(network, {
        type: "heal",
        id: nearest.id,
        health: { current: nearest.health.current, max: nearest.health.max },
      });
    }

    sendToInGamePlayers(network, { type: "money", amount: money.amount });
  }
}

// * Required to generate code
export default buildingInteractSystem.name;
