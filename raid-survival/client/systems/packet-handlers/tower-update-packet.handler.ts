import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { Health } from "../../components/health.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { TowerLevelComponent } from "../../components/tower-level.component";
import { updateHealthBarFill } from "../health-bar-update";

// Result of a tower heal or upgrade (only `level` tells them apart - unchanged vs. +1). Always
// applies Health and re-asserts the sprite frame; setAnimation() no-ops if the key is unchanged.
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
