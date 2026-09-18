import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Weapon } from "../components/weapon.component";
import { ChildrenComponent } from "../components/children.component";
import { DirectionRotatorComponent } from "../components/direction-rotator.component";
import { SpriteComponent } from "../components/renderable/sprite.component";
import { WeaponReloadOverlayComponent } from "../components/weapon-reload-overlay.component";
import { WEAPON_CATALOG } from "../weapon-catalog";
import { WEAPON_LOCAL_OFFSET } from "./packet-handlers/start-game-packet.handler";

// Procedural fallback for any weapon with no dedicated reload animation asset (currently
// smallGun): an oscillating tilt on top of the normal aim-tracking rotation.
const RELOAD_TILT_SPEED = 10; // radians/sec of the oscillation clock
const RELOAD_TILT_AMPLITUDE = 25; // degrees

// Owns the held weapon's animation state: idle pose, the reload overlay, and a one-shot "shoot"
// recoil pulse triggered by weapon-fired-packet.handler.ts setting weapon.firing.
//
// Must run after build-mode.system.ts/weapon-visibility.system.ts (main.ts's registration order):
// this system only ever forces the main sprite *hidden* while a reload overlay plays instead, so
// that write needs to be the last word for the tick, not clobbered by those systems re-asserting
// visibility the same tick.
export function weaponReloadAnimationSystem(registry: Registry, ctx: Context) {
  const weapons: {
    Weapon: Weapon;
    ChildrenComponent: ChildrenComponent;
    DirectionRotatorComponent: DirectionRotatorComponent;
    SpriteComponent: SpriteComponent;
  }[] = registry.getZipper([Weapon, ChildrenComponent, DirectionRotatorComponent, SpriteComponent]);
  if (weapons.length === 0) return;

  const overlays: {
    WeaponReloadOverlayComponent: WeaponReloadOverlayComponent;
    ChildrenComponent: ChildrenComponent;
    SpriteComponent: SpriteComponent;
  }[] = registry.getZipper([WeaponReloadOverlayComponent, ChildrenComponent, SpriteComponent]);

  const delta = ctx.app.delta / 1000;

  for (const {
    Weapon: weapon,
    ChildrenComponent: weaponChild,
    DirectionRotatorComponent: rotator,
    SpriteComponent: sprite,
  } of weapons) {
    // Every player has a reload-overlay entity built up front regardless of what's equipped, and
    // a freshly-built Konva Sprite defaults to visible - so it must be explicitly hidden whenever
    // the equipped weapon has no reload asset, not just left alone.
    const overlay = overlays.find((o) => o.ChildrenComponent.parentId === weaponChild.parentId);

    if (!weapon.weaponType) {
      overlay?.SpriteComponent.sprite?.visible(false);
      continue;
    }

    const catalog = WEAPON_CATALOG[weapon.weaponType];
    const reloadAsset = "reloadSpriteKey" in catalog ? catalog : undefined;
    const shootAsset = "shootSeconds" in catalog ? catalog : undefined;

    // Idempotent every tick, not edge-triggered - the equipped weaponType can change without
    // anything else poking this sprite directly. Each weapon can live on its own source image
    // (spriteKey/animationsKey), so switching requires a real setSpriteKey (destroy + rebuild the
    // Konva node); that call doesn't touch scale/pivot/frameRate, so they're re-applied here too.
    // desiredAnimation is computed once below rather than written in two places, since
    // SpriteComponent.setSpriteKey always rebuilds hardcoded on "idle" - setting a different
    // target animation before that rebuild would leave the wrapper's tracked animation already
    // matching it, silently blocking setAnimation()'s dedup guard from applying it for real.
    if (sprite.spriteKey !== catalog.spriteKey) {
      sprite.setSpriteKey(catalog.spriteKey, catalog.animationsKey);
      sprite.setScale({ x: catalog.scale, y: catalog.scale });
      sprite.setPivot("pivot" in catalog ? catalog.pivot : undefined);
      sprite.frameRate =
        "shootFrameCount" in catalog ? catalog.shootFrameCount / catalog.shootSeconds : 7;
      const handOffsetDelta = "handOffsetDelta" in catalog ? catalog.handOffsetDelta : undefined;
      weaponChild.options.LocalTransform = handOffsetDelta
        ? {
            x: WEAPON_LOCAL_OFFSET.x + handOffsetDelta.x,
            y: WEAPON_LOCAL_OFFSET.y + handOffsetDelta.y,
          }
        : WEAPON_LOCAL_OFFSET;
    }

    // weapon-fired-packet.handler.ts sets weapon.firing/firingElapsed on each shot; this counts
    // the pulse down and expires it after shootSeconds. A weapon with no shoot animation still
    // gets `firing` set (the server broadcasts weaponFired for every type), so clear it
    // immediately here rather than let it never expire with no shootSeconds to compare against.
    if (weapon.firing) {
      weapon.firingElapsed += delta;
      if (!shootAsset || weapon.firingElapsed >= shootAsset.shootSeconds) weapon.firing = false;
    }

    const desiredAnimation = weapon.firing && shootAsset ? "shoot" : catalog.iconAnimation;
    if (sprite.sprite && sprite.getAnimation() !== desiredAnimation) {
      sprite.setAnimation(desiredAnimation);
    }

    if (reloadAsset) {
      // Dedicated reload animation - a separate overlay sprite plays it; no added tilt here.
      rotator.offset = weapon.baseRotationOffset;

      overlay?.SpriteComponent.sprite?.visible(weapon.reloading);

      if (weapon.reloading) {
        sprite.sprite?.visible(false);
        if (
          overlay?.SpriteComponent.sprite &&
          overlay.SpriteComponent.getAnimation() !== "reload"
        ) {
          overlay.SpriteComponent.setAnimation("reload");
        }
      }
      continue;
    }

    // No dedicated asset for this weapon - force the overlay hidden (it can be stale-visible from
    // a previously held weapon), then fall back to the procedural tilt.
    overlay?.SpriteComponent.sprite?.visible(false);
    if (!weapon.reloading) {
      rotator.offset = weapon.baseRotationOffset;
      continue;
    }
    weapon.reloadElapsed += delta;
    rotator.offset =
      weapon.baseRotationOffset +
      Math.sin(weapon.reloadElapsed * RELOAD_TILT_SPEED) * RELOAD_TILT_AMPLITUDE;
  }
}

// * Required to generate code
export default weaponReloadAnimationSystem.name;
