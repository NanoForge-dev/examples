import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Weapon } from "../components/weapon.component";
import { ChildrenComponent } from "../components/children.component";
import { DirectionRotatorComponent } from "../components/direction-rotator.component";
import { SpriteComponent } from "../components/renderable/sprite.component";
import { WeaponReloadOverlayComponent } from "../components/weapon-reload-overlay.component";
import { WEAPON_CATALOG } from "../weapon-catalog";
import { HAND_LOCAL_OFFSETS } from "./packet-handlers/start-game-packet.handler";

// Procedural fallback for any weapon with no dedicated reload animation asset (currently
// smallGun) - an oscillating tilt on top of the normal aim-tracking rotation, since weapons.png
// has no reload frames for it (a single static icon, not a filmstrip).
const RELOAD_TILT_SPEED = 10; // radians/sec of the oscillation clock
const RELOAD_TILT_AMPLITUDE = 25; // degrees

// Owns every held-weapon animation state for both hands of every player: the resting "idle" pose,
// the reload overlay (unchanged from its original name/purpose), and now also a one-shot "shoot"
// recoil/muzzle-flash pulse played on the MAIN sprite itself whenever weapon-fired-packet.handler.ts
// flags weapon.firing (see below) - there's no separate overlay for it the way reload has one,
// since "shoot" is just another named animation living in the exact same spriteKey/animationsKey
// as "idle", not a different image to swap to.
//
// Runs after build-mode.system.ts/weapon-visibility.system.ts (main.ts's registration order) so
// this system's own visibility write - forcing the main weapon sprite hidden while a dedicated
// reload animation is playing instead - is the last word for that one tick, not clobbered by
// those systems re-asserting "equipped, so visible" the same tick. It only ever forces *hidden*;
// when NOT reloading it leaves the sprite's visibility alone entirely, so whatever those systems
// decided (equipped/build-mode/etc.) simply stands.
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
    // Every hand gets a reload-overlay entity built up front (buildHandAndWeapon,
    // start-game-packet.handler.ts) regardless of what's equipped, and a freshly-built Konva
    // Sprite defaults to visible - so it must be explicitly hidden here whenever this hand's
    // current weapon has no reload asset to play, not just left alone. Found before the
    // early-return below so an unequipped hand's stale overlay (e.g. after unequipping a
    // shotgun) gets hidden too.
    const overlay = overlays.find(
      (o) => o.ChildrenComponent.parentId === weaponChild.parentId && o.WeaponReloadOverlayComponent.hand === weapon.hand,
    );

    if (!weapon.weaponType) {
      // nothing equipped in this hand - main sprite hidden, and the overlay must be forced
      // hidden too (see comment above).
      overlay?.SpriteComponent.sprite?.visible(false);
      continue;
    }

    const catalog = WEAPON_CATALOG[weapon.weaponType];
    const reloadAsset = "reloadSpriteKey" in catalog ? catalog : undefined;
    const shootAsset = "shootSeconds" in catalog ? catalog : undefined;

    // Idempotent every tick, not edge-triggered. Two separate corrections, both needed because a
    // hand's equipped weaponType can change (an equip event, or just this loop moving from one
    // weapon's catalog entry to another as weaponType flips) without anything else ever poking
    // this sprite directly - see weapon-inventory-packet.handler.ts, which deliberately leaves the
    // held sprite alone and relies on this pass to catch up next tick instead:
    //
    // 1. spriteKey: each weapon can live on its own source image now (client/weapon-catalog.ts's
    //    spriteKey/animationsKey), not just a shared weapons.png - re-equipping a hand to a
    //    different weapon type needs a real setSpriteKey (destroy + rebuild the Konva node), not
    //    just a different animation name within the same image. setSpriteKey doesn't touch
    //    scale/pivot/frameRate, so the catalog's own values are re-applied right after it - the
    //    new spriteKey's art isn't necessarily drawn at the same physical size, gripped at the
    //    same point within its frame, or meant to play its "shoot" animation at the same speed, as
    //    the old one's (see weapon-catalog.ts's header comment). frameRate in particular is easy
    //    to miss here since, unlike scale/pivot, a mismatch is invisible until the NEXT weapon
    //    that actually has a multi-frame animation to play - a single-frame "idle" pose doesn't
    //    care what frameRate says. LocalTransform (this entity's OWN position relative to the
    //    player, not read by spriteSystem at all) also needs the same re-derivation - see
    //    weapon-catalog.ts's handOffsetDelta comment for why a pivot change alone can't be
    //    positionally correct without it.
    // 2. animation key: spriteSystem always constructs a fresh Konva Sprite hardcoded on "idle"
    //    regardless of what's requested (see SpriteComponent.setSpriteKey's own comment), so
    //    anything that ever asked for a DIFFERENT animation key before the live sprite existed
    //    (buildHandAndWeapon at spawn, an equip event, or the setSpriteKey call just above) would
    //    otherwise have its wrapper-tracked _currentAnimation already matching the desired key,
    //    silently blocking setAnimation()'s dedup guard from ever actually applying it to the real
    //    object. This is what was rendering an equipped shotgun as smallGun's icon: smallGun's
    //    iconAnimation IS "idle", so the same bug was invisible for it and only visible for
    //    anything else. Computed once as `desiredAnimation` (idle, or "shoot" while a firing pulse
    //    is live - see below) and applied once here, rather than writing it in two places that
    //    could otherwise race and stomp each other within the same tick.
    if (sprite.spriteKey !== catalog.spriteKey) {
      sprite.setSpriteKey(catalog.spriteKey, catalog.animationsKey);
      sprite.setScale({ x: catalog.scale, y: catalog.scale });
      sprite.setPivot("pivot" in catalog ? catalog.pivot : undefined);
      // Plain public field, not a setXxx (matches SpriteComponent's own frameRate declaration) -
      // read fresh at the next Sprite-construction only, same as scale/pivot above.
      sprite.frameRate = "shootFrameCount" in catalog ? catalog.shootFrameCount / catalog.shootSeconds : 7;
      const baseOffset = HAND_LOCAL_OFFSETS[weapon.hand];
      const handOffsetDelta = "handOffsetDelta" in catalog ? catalog.handOffsetDelta : undefined;
      weaponChild.options.LocalTransform = handOffsetDelta
        ? { x: baseOffset.x + handOffsetDelta.x, y: baseOffset.y + handOffsetDelta.y }
        : baseOffset;
    }

    // A one-shot recoil/muzzle-flash pulse - weapon-fired-packet.handler.ts sets weapon.firing
    // true (and firingElapsed back to 0) the instant this hand's weaponFired broadcast arrives;
    // this is what counts that clock up and expires the pulse again once catalog.shootSeconds has
    // elapsed. A weapon with no shoot animation (shootAsset undefined, e.g. smallGun) can still
    // have `firing` set true (the server broadcasts weaponFired for every weapon type, not just
    // ones the client happens to have art for) - immediately clearing it below is what makes that
    // a harmless no-op instead of a pulse that (with no shootSeconds to compare against) would
    // otherwise never expire.
    if (weapon.firing) {
      weapon.firingElapsed += delta;
      if (!shootAsset || weapon.firingElapsed >= shootAsset.shootSeconds) weapon.firing = false;
    }

    const desiredAnimation = weapon.firing && shootAsset ? "shoot" : catalog.iconAnimation;
    if (sprite.sprite && sprite.getAnimation() !== desiredAnimation) {
      sprite.setAnimation(desiredAnimation);
    }

    if (reloadAsset) {
      // Has a dedicated reload animation - a separate overlay sprite (built once in
      // buildHandAndWeapon, never swapped) plays it; this weapon's own rotation stays exactly at
      // the normal aim-tracking offset throughout, no added tilt.
      rotator.offset = weapon.baseRotationOffset;

      overlay?.SpriteComponent.sprite?.visible(weapon.reloading);

      if (weapon.reloading) {
        sprite.sprite?.visible(false);
        if (overlay?.SpriteComponent.sprite && overlay.SpriteComponent.getAnimation() !== "reload") {
          overlay.SpriteComponent.setAnimation("reload");
        }
      }
      continue;
    }

    // No dedicated asset for this weapon (e.g. smallGun) - force the overlay hidden (it can be
    // stale-visible from spawn, or left over from this hand previously holding the shotgun), then
    // the original procedural tilt, unchanged.
    overlay?.SpriteComponent.sprite?.visible(false);
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
