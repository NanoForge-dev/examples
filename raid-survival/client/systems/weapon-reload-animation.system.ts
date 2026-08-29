import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Weapon } from "../components/weapon.component";
import { DirectionRotatorComponent } from "../components/direction-rotator.component";

// Weapons.png has no reload animation frames for this weapon (it's a single static icon, not a
// filmstrip), so this is a procedural tilt instead: while weaponStatePacketHandler has flagged a
// weapon as reloading, oscillate its rotation on top of the normal aim-tracking offset;
// otherwise leave rotate-to-direction.system.ts fully in control, same as before this system
// existed.
const RELOAD_TILT_SPEED = 10; // radians/sec of the oscillation clock
const RELOAD_TILT_AMPLITUDE = 25; // degrees

export function weaponReloadAnimationSystem(registry: Registry, ctx: Context) {
  const entities: { Weapon: Weapon; DirectionRotatorComponent: DirectionRotatorComponent }[] = registry.getZipper([
    Weapon,
    DirectionRotatorComponent,
  ]);
  if (entities.length === 0) return;

  const delta = ctx.app.delta / 1000;

  for (const { Weapon: weapon, DirectionRotatorComponent: rotator } of entities) {
    if (!weapon.reloading) {
      rotator.offset = weapon.baseRotationOffset;
      continue;
    }

    weapon.reloadElapsed += delta;
    rotator.offset = weapon.baseRotationOffset + Math.sin(weapon.reloadElapsed * RELOAD_TILT_SPEED) * RELOAD_TILT_AMPLITUDE;
  }
}

// * Required to generate code
export default weaponReloadAnimationSystem.name;
