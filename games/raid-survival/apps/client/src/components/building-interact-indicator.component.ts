import { Text } from "@nanoforge-dev/graphics-2d";

/**
 * "Press E to..." hint shown above an interactable building's health bar. The proximity check is
 * approximated client-side since Hitbox is server-only - see building-interact-indicator.system.ts.
 *
 * @component
 * @side client
 */
export class BuildingInteractIndicatorComponent {
  name = "BuildingInteractIndicatorComponent";

  constructor(
    /** The hint shown next to a building the player can heal or upgrade. */
    public text: Text,
  ) {}
}
