import { type Registry } from "@nanoforge-dev/ecs-client";

import { NetworkId } from "../components/network-id.component";
import { TransformComponent } from "../components/essentials/transform.component";
import { ChildrenComponent } from "../components/children.component";
import { Health } from "../components/health.component";
import { BuildModeComponent } from "../components/build-mode.component";
import { ReviveHintIndicatorComponent } from "../components/revive-hint-indicator.component";
import { playerId } from "../main";

// Native player sprite size (see start-game-packet.handler.ts's own copy) - just enough to
// approximate the local player's center for the proximity check below.
const LOCAL_PLAYER_SIZE = { width: 24, height: 24 };
// The real gate is server-authoritative (revive.system.ts's edge-to-edge Hitbox check,
// REVIVE_RANGE=20) - Hitbox is server-only, so this is a generous center-distance stand-in
// purely for deciding when to SHOW the hint, not for whether holding E actually works. Same idea
// (and same value) as building-interact-indicator.system.ts's DISPLAY_INTERACT_RANGE.
const DISPLAY_REVIVE_RANGE = 46;

// Drives every player's "Hold E to revive" hint: visible only to the LOCAL player, only above a
// TEAMMATE who is actually downed (Health.current <= 0) and close enough, and only while the
// local player is themselves alive (a downed player can't revive anyone - revive.system.ts,
// server) and not in build mode (reviveControlSystem zeroes the E-hold there too).
export function reviveHintIndicatorSystem(registry: Registry) {
  const indicators: {
    ReviveHintIndicatorComponent: ReviveHintIndicatorComponent;
    ChildrenComponent: ChildrenComponent;
    TransformComponent: TransformComponent;
  }[] = registry.getZipper([ReviveHintIndicatorComponent, ChildrenComponent, TransformComponent]);
  if (indicators.length === 0) return;

  const players: {
    NetworkId: NetworkId;
    TransformComponent: TransformComponent;
    Health: Health;
  }[] = registry.getZipper([NetworkId, TransformComponent, Health]);
  const localPlayer = players.find((p) => p.NetworkId.id === playerId);
  const localAlive = !!localPlayer && localPlayer.Health.current > 0;
  const playerCenter = localPlayer
    ? {
        x: localPlayer.TransformComponent.x + LOCAL_PLAYER_SIZE.width / 2,
        y: localPlayer.TransformComponent.y + LOCAL_PLAYER_SIZE.height / 2,
      }
    : null;

  const buildModeEntities: { BuildModeComponent: BuildModeComponent }[] = registry.getZipper([
    BuildModeComponent,
  ]);
  const buildModeActive = buildModeEntities[0]?.BuildModeComponent.active ?? false;

  for (const {
    ReviveHintIndicatorComponent: indicator,
    ChildrenComponent: child,
    TransformComponent: transform,
  } of indicators) {
    indicator.text.position({ x: transform.x, y: transform.y });

    if (!localAlive || !playerCenter || buildModeActive) {
      indicator.text.visible(false);
      continue;
    }

    const targetHealth = registry.getEntityComponent(
      registry.entityFromIndex(child.parentId),
      Health,
    );
    if (!targetHealth || targetHealth.current > 0) {
      indicator.text.visible(false);
      continue;
    }

    const distance = Math.hypot(transform.x - playerCenter.x, transform.y - playerCenter.y);
    const visible = distance <= DISPLAY_REVIVE_RANGE;
    indicator.text.visible(visible);
    // Same z-order burial fix as revive-indicator.system.ts's ring/arc (see there for the full
    // explanation) - this Text has no SpriteComponent either, so zOrderSystem never manages it and
    // it would otherwise sink beneath every zombie/player sprite the instant any of them reorder.
    if (visible) indicator.text.moveToTop();
  }
}

// * Required to generate code
export default reviveHintIndicatorSystem.name;
