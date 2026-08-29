import { Registry } from "@nanoforge-dev/ecs-client";
import { TextComponent } from "../../components/renderable/text.component";
import { FloatingTextComponent } from "../../components/floating-text.component";
import { sceneManager } from "../../main";

const LOOT_TEXT_DURATION = 1.2; // seconds
// World-layer-local units (the 3x world-layer scale blows this up on screen, same space every
// other world sprite/text already renders in).
const LOOT_TEXT_SIZE = { width: 60, height: 16 };
const LOOT_TEXT_FONT_SIZE = 8;

export function lootPacketHandler(packet: any, registry: Registry): void {
  const layer = sceneManager.getScene()?.layer;
  if (!layer) return;

  const textEntity = registry.spawnEntity();
  const textComponent = new TextComponent(layer, {
    text: `+${packet.amount}`,
    x: packet.position.x - LOOT_TEXT_SIZE.width / 2,
    y: packet.position.y,
    width: LOOT_TEXT_SIZE.width,
    height: LOOT_TEXT_SIZE.height,
    align: "center",
    fontSize: LOOT_TEXT_FONT_SIZE,
    fontStyle: "bold",
    fill: "gold",
    listening: false,
  });
  registry.addComponent(textEntity, textComponent);
  // Free-standing on purpose - no ChildrenComponent, no NetworkId - so it's untouched by the
  // zombie's own (delayed) "kill" packet and outlives it; floating-text.system.ts owns its whole
  // lifecycle from here.
  registry.addComponent(textEntity, new FloatingTextComponent(LOOT_TEXT_DURATION));
}
