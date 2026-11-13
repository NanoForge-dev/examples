import { Text } from "@nanoforge-dev/graphics-2d";
import { SpriteComponent } from "./sprite.component";

/**
 * `icon` is the weapon-icon SpriteComponent (not just its Konva node) so reload-indicator.system.ts
 * can toggle this row's visibility based on whether anything is equipped.
 *
 * @component
 * @side client
 */
export class AmmoHudComponent {
  name = "AmmoHudComponent";

  constructor(
    public text: Text,
    public icon: SpriteComponent,
  ) {}
}
