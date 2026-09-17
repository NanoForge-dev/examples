import { Text } from "@nanoforge-dev/graphics-2d";
import { SpriteComponent } from "./renderable/sprite.component";

// `icon` is the weapon-icon SpriteComponent (not just its Konva node) so reload-indicator.system.ts
// can toggle this row's visibility based on whether anything is equipped.
export class AmmoHudComponent {
  name = this.constructor.name;

  constructor(
    public text: Text,
    public icon: SpriteComponent,
  ) {}
}

// * Required to generate code
export default AmmoHudComponent.name;
