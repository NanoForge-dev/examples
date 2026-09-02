import { Text } from "@nanoforge-dev/graphics-2d";
import { SpriteComponent } from "./renderable/sprite.component";

// Ref to the konva Text node built once at game start
// (client/systems/packet-handlers/start-game-packet.handler.ts) and mutated in place by
// ammo-packet.handler.ts on every ammo packet - same pattern as MoneyHudComponent. One of these
// per hand now (buildAmmoHud is called twice): `hand` lets ammo-packet.handler.ts route an
// incoming `{weaponType}` ammo update to whichever row currently has that weapon equipped, and
// `icon` (the weapon-icon SpriteComponent, not just its Konva node) lets
// reload-indicator.system.ts toggle this whole row's visibility off "is this hand equipped" -
// see there for why it can't just hide the Konva node directly at construction time.
export class AmmoHudComponent {
  name = this.constructor.name;

  constructor(
    public text: Text,
    public icon: SpriteComponent,
    public hand: "left" | "right",
  ) {}
}

// * Required to generate code
export default AmmoHudComponent.name;
