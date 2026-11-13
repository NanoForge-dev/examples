import type { Registry } from "@nanoforge-dev/ecs/client";
import type { ServerMessageOf } from "@raid-survival/shared/protocol";

import { MoneyHudComponent } from "../components/money-hud.component";

export const moneyHandler = (packet: ServerMessageOf<"money">, registry: Registry): void => {
  const entities: { MoneyHudComponent: MoneyHudComponent }[] = registry.getZipper([
    MoneyHudComponent,
  ]);
  const hud = entities[0]?.MoneyHudComponent;
  if (!hud) return;

  hud.amount = packet.amount;
  hud.text.text(`Coins: ${packet.amount}`);
};
