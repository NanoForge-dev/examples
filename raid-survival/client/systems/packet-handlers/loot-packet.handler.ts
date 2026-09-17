import { Registry } from "@nanoforge-dev/ecs-client";
import { TextComponent } from "../../components/renderable/text.component";
import { FloatingTextComponent } from "../../components/floating-text.component";
import { sceneManager } from "../../main";

const LOOT_TEXT_DURATION = 1.2; // seconds
const LOOT_TEXT_SIZE = { width: 60, height: 16 }; // world-layer-local units
const LOOT_TEXT_FONT_SIZE = 8;

export function lootPacketHandler(packet: any, registry: Registry): void {
  const layer = sceneManager.getScene()?.layer;
  if (!layer) return;

  const textEntity = registry.spawnEntity();
  const textComponent = new TextComponent(layer, {
    // text/color are optional overrides for heal/ammo loot boxes - a plain coin drop omits both.
    text: packet.text ?? `+${packet.amount}`,
    x: packet.position.x - LOOT_TEXT_SIZE.width / 2,
    y: packet.position.y,
    width: LOOT_TEXT_SIZE.width,
    height: LOOT_TEXT_SIZE.height,
    align: "center",
    fontSize: LOOT_TEXT_FONT_SIZE,
    fontStyle: "bold",
    fill: packet.color ?? "gold",
    listening: false,
  });
  registry.addComponent(textEntity, textComponent);
  // No ChildrenComponent/NetworkId - untouched by the zombie's own delayed "kill" packet.
  registry.addComponent(textEntity, new FloatingTextComponent(LOOT_TEXT_DURATION));
}
