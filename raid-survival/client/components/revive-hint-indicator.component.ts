import { Text } from "@nanoforge-dev/graphics-2d";

// World-space "Hold E to revive" hint shown above a DOWNED player, one per player (built
// alongside their revive ring - see buildReviveHintIndicator in start-game-packet.handler.ts),
// visible only to the local player, only while they're alive and close enough to a teammate who
// is actually downed - revive-hint-indicator.system.ts owns that check, the same client-side
// distance approximation building-interact-indicator.system.ts uses for its own server-
// authoritative range (Hitbox is server-only). Text alone, matching
// BuildingInteractIndicatorComponent's look - no background, dark stroke for legibility.
export class ReviveHintIndicatorComponent {
  name = this.constructor.name;

  constructor(public text: Text) {}
}

// * Required to generate code
export default ReviveHintIndicatorComponent.name;
