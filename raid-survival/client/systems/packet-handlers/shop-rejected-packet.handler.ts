import { Registry } from "@nanoforge-dev/ecs-client";
import { TransformComponent } from "../../components/essentials/transform.component";
import { NetworkId } from "../../components/network-id.component";
import { TextComponent } from "../../components/renderable/text.component";
import { FloatingTextComponent } from "../../components/floating-text.component";
import { playerId, sceneManager } from "../../main";

const REJECTED_TEXT_DURATION = 1.5; // seconds
const REJECTED_TEXT_SIZE = { width: 140, height: 16 }; // world-layer-local units
const REJECTED_TEXT_FONT_SIZE = 8;

// Shared handler for buyWeapon/buyAmmo/equipWeapon rejections (a success is reflected via the
// separate weaponInventory/money/ammo broadcasts instead). Shown as floating text above the local
// player, reusing loot-packet.handler.ts's floating-text mechanism.
export function shopRejectedPacketHandler(packet: any, registry: Registry): void {
  const layer = sceneManager.getScene()?.layer;
  if (!layer) return;

  const players: { NetworkId: NetworkId; TransformComponent: TransformComponent }[] =
    registry.getZipper([NetworkId, TransformComponent]);
  const player = players.find((entity) => entity.NetworkId.id === playerId);
  if (!player) return;

  const textEntity = registry.spawnEntity();
  const textComponent = new TextComponent(layer, {
    text: packet.reason ?? "rejected",
    x: player.TransformComponent.x - REJECTED_TEXT_SIZE.width / 2,
    y: player.TransformComponent.y - 16,
    width: REJECTED_TEXT_SIZE.width,
    height: REJECTED_TEXT_SIZE.height,
    align: "center",
    fontSize: REJECTED_TEXT_FONT_SIZE,
    fontStyle: "bold",
    fill: "red",
    listening: false,
  });
  registry.addComponent(textEntity, textComponent);
  registry.addComponent(textEntity, new FloatingTextComponent(REJECTED_TEXT_DURATION));
}
