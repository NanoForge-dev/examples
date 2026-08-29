import { Registry } from "@nanoforge-dev/ecs-client";
import { MoneyHudComponent } from "../../components/money-hud.component";

export function moneyPacketHandler(packet: any, registry: Registry): void {
  const entities: { MoneyHudComponent: MoneyHudComponent }[] = registry.getZipper([MoneyHudComponent]);
  const hud = entities[0]?.MoneyHudComponent;
  if (!hud) return;

  hud.text.text(`Coins: ${packet.amount}`);
}
