import { Text } from "@nanoforge-dev/graphics-2d";
import { SpriteComponent } from "./renderable/sprite.component";

// Ref to the konva Text node built once at game start
// (client/systems/packet-handlers/start-game-packet.handler.ts) and mutated in place by
// ammo-packet.handler.ts on every ammo packet - same pattern as MoneyHudComponent. One of these
// per player now (single equipped weapon, dual wielding removed) - `icon` (the weapon-icon
// SpriteComponent, not just its Konva node) lets reload-indicator.system.ts toggle this row's
// visibility off "is anything equipped" - see there for why it can't just hide the Konva node
// directly at construction time.
export class AmmoHudComponent {
  name = this.constructor.name;

  constructor(
    public text: Text,
    public icon: SpriteComponent,
  ) {}
}

// * Required to generate code
export default AmmoHudComponent.name;
