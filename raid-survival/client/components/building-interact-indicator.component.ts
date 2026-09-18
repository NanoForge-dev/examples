import { Text } from "@nanoforge-dev/graphics-2d";

// "Press E to..." hint shown above an interactable building's health bar. The proximity check is
// approximated client-side since Hitbox is server-only - see building-interact-indicator.system.ts.
export class BuildingInteractIndicatorComponent {
  name = this.constructor.name;

  constructor(public text: Text) {}
}

// * Required to generate code
export default BuildingInteractIndicatorComponent.name;
