import { Text } from "@nanoforge-dev/graphics-2d";

// World-space "press E to..." hint shown above a tower/wall/the lobby's health bar, one per
// interactable entity, visible only to a player standing close enough for the E-press to
// actually do something (building-interact-indicator.system.ts owns the proximity check,
// approximated client-side since Hitbox is server-only - see there). Text alone (no background)
// with a dark stroke for legibility against any tile behind it.
export class BuildingInteractIndicatorComponent {
  name = this.constructor.name;

  constructor(public text: Text) {}
}

// * Required to generate code
export default BuildingInteractIndicatorComponent.name;
