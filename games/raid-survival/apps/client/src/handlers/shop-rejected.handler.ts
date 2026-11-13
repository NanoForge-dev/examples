import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";
import "@nanoforge-dev/scene";
import type { ServerMessageOf } from "@raid-survival/shared/protocol";

import { FloatingTextComponent } from "../components/floating-text.component";
import { NetworkId } from "../components/network-id.component";
import { TextComponent } from "../components/text.component";
import { TransformComponent } from "../components/transform.component";
import { gameView } from "../game-view";

const REJECTED_TEXT_DURATION = 1.5; // seconds
const REJECTED_TEXT_SIZE = { width: 140, height: 16 }; // world-layer-local units
const REJECTED_TEXT_FONT_SIZE = 8;

// Shared handler for buyWeapon/buyAmmo/equipWeapon rejections (a success is reflected via the
// separate weaponInventory/money/ammo broadcasts instead). Shown as floating text above the local
// player, reusing loot.handler.ts's floating-text mechanism.
export const shopRejectedHandler = (
  packet: ServerMessageOf<"buyWeapon" | "buyAmmo" | "equipWeapon">,
  registry: Registry,
  ctx: Context,
): void => {
  const layer = gameView(registry)?.world;
  if (!layer) return;

  const players: { NetworkId: NetworkId; TransformComponent: TransformComponent }[] =
    registry.getZipper([NetworkId, TransformComponent]);
  const player = players.find((entity) => entity.NetworkId.id === ctx.scenes.vars.get("playerId"));
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
};
