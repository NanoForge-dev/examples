import { Text } from "@nanoforge-dev/graphics-2d";

// World-space "Reloading..." label above a player's health bar. Positioned every tick by
// reload-indicator.system.ts since Text isn't a Sprite - spriteSystem never touches it.
export class ReloadIndicatorComponent {
  name = this.constructor.name;

  constructor(public text: Text) {}
}

// * Required to generate code
export default ReloadIndicatorComponent.name;
