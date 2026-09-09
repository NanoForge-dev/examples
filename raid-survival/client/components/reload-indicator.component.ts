import { Text } from "@nanoforge-dev/graphics-2d";

// World-space "Reloading..." label built above every player's health bar (see
// buildReloadIndicator, start-game-packet.handler.ts) - visible to everyone nearby, not just a
// local-only HUD element the way it used to be. reload-indicator.system.ts drives its
// visibility every tick off THIS entity's own parent player's Weapon.reloading, and positions it
// every tick from TransformComponent the same way revive-indicator.system.ts positions the
// revive ring - Text isn't a Sprite, so spriteSystem never touches it.
export class ReloadIndicatorComponent {
  name = this.constructor.name;

  constructor(public text: Text) {}
}

// * Required to generate code
export default ReloadIndicatorComponent.name;
