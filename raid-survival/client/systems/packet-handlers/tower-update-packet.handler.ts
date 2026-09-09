import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { Health } from "../../components/health.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { TowerLevelComponent } from "../../components/tower-level.component";
import { updateHealthBarFill } from "../health-bar-update";

// building-interact.system.ts's E-press heal/upgrade result for a tower - sent for both outcomes
// (only `level` tells them apart: unchanged on a heal, +1 on an upgrade), so this always applies
// Health and always re-asserts the level's sprite frame. setAnimation() no-ops when the key is
// already current (see SpriteComponent), so calling it unconditionally on a heal (same level) is
// free.
export function towerUpdatePacketHandler(packet: any, registry: Registry): void {
  const targets: {
    id: number;
    NetworkId: NetworkId;
    Health: Health;
    SpriteComponent: SpriteComponent;
    TowerLevelComponent: TowerLevelComponent;
  }[] = registry.getIndexedZipper([NetworkId, Health, SpriteComponent, TowerLevelComponent]);
  const target = targets.find((entity) => entity.NetworkId.id === packet.id);
  if (!target) return;

  target.Health.current = packet.health.current;
  target.Health.max = packet.health.max;
  const fraction = target.Health.max > 0 ? target.Health.current / target.Health.max : 0;
  updateHealthBarFill(registry, target.id, fraction);

  target.TowerLevelComponent.level = packet.level;
  target.SpriteComponent.setAnimation(`level${packet.level}`);
}
