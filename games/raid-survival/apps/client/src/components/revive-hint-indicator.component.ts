import { Text } from "@nanoforge-dev/graphics-2d";

/**
 * "Hold E to revive" hint shown above a downed player, visible only to the local player when
 * close enough - revive-hint-indicator.system.ts owns the (client-side-approximated) range check.
 *
 * @component
 * @side client
 */
export class ReviveHintIndicatorComponent {
  name = "ReviveHintIndicatorComponent";

  constructor(
    /** The "Hold E to revive" text above a downed teammate. */
    public text: Text,
  ) {}
}
