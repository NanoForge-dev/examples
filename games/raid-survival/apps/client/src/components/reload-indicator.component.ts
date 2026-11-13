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

  constructor(
    /** The "Reloading" text above the player. */
    public text: Text,
  ) {}
}
