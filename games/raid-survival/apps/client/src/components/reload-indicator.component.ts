import { Text } from "@nanoforge-dev/graphics-2d";

/**
 * World-space "Reloading..." label above a player's health bar. Positioned every tick by
 * reload-indicator.system.ts since Text isn't a Sprite - spriteSystem never touches it.
 *
 * @component
 * @side client
 */
export class ReloadIndicatorComponent {
  name = "ReloadIndicatorComponent";

  constructor(public text: Text) {}
}
