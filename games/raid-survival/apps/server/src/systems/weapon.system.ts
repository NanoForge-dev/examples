import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";

import { WeaponInventory, type WeaponFireState } from "../components/weapon-inventory.component";
import { ShootInput } from "../components/shoot-input.component";
import { Position2D } from "../components/position-2d.component";
import { Hitbox } from "../components/hitbox.component";
import { Direction } from "../components/direction.component";
import { Health } from "../components/health.component";
import { WEAPON_CATALOG, type WeaponType } from "@raid-survival/shared/weapon-catalog";
import { broadcast } from "../broadcast";
import { firePellets } from "../fire-pellets";

const broadcastWeaponState = (
  ctx: Context,
  id: number,
  weaponType: WeaponType,
  state: "idle" | "reloading",
  reloadSeconds?: number,
) => {
  broadcast(ctx, { type: "weaponState", id, weaponType, state, reloadSeconds });
};

// A one-shot event, not a state - sent once per shot that actually leaves the gun, so clients can
// play a recoil/muzzle-flash animation at the real moment of firing.
const broadcastWeaponFired = (ctx: Context, id: number, weaponType: WeaponType) => {
  broadcast(ctx, { type: "weaponFired", id, weaponType });
};

const broadcastAmmo = (
  ctx: Context,
  id: number,
  weaponType: WeaponType,
  fireState: WeaponFireState,
  reserveAmmo: number,
) => {
  broadcast(ctx, {
    type: "ammo",
    id,
    weaponType,
    magazineAmmo: fireState.magazineAmmo,
    reserveAmmo,
  });
};

// Fresh player->mouse aim vector, computed at the moment a shot fires - not derived from the
// persisted Direction component, which can be one packet's latency behind the mouse. Falls back
// to `direction` only if no mousePosition has arrived yet.
const computeAimDirection = (
  centerX: number,
  centerY: number,
  mousePosition: { x: number; y: number } | null,
  direction: Direction,
): { x: number; y: number } => {
  if (mousePosition) {
    const dx = mousePosition.x - centerX;
    const dy = mousePosition.y - centerY;
    const length = Math.hypot(dx, dy);
    if (length > 0) return { x: dx / length, y: dy / length };
  }
  return { x: direction.x, y: direction.y };
};

// Owns the weapon state machine (idle/reloading, cooldown, magazine) for the single equipped
// weapon of every player - ShootInput just records what's held/requested, this decides what
// happens and when, every tick, independent of packet frequency.
export const weaponSystem = (registry: Registry, ctx: Context) => {
  const entities: {
    id: number;
    WeaponInventory: WeaponInventory;
    ShootInput: ShootInput;
    Position2D: Position2D;
    Hitbox: Hitbox;
    Direction: Direction;
    Health: Health;
  }[] = registry.getIndexedZipper([
    WeaponInventory,
    ShootInput,
    Position2D,
    Hitbox,
    Direction,
    Health,
  ]);
  if (entities.length === 0) return;
  const delta = ctx.app.delta / 1000;

  for (const {
    id,
    WeaponInventory: inventory,
    ShootInput: input,
    Position2D: position,
    Hitbox: hitbox,
    Direction: direction,
    Health: health,
  } of entities) {
    // Dead players' weapons do nothing.
    if (health.current <= 0) {
      input.reloadRequested = false;
      continue;
    }

    const reloadRequested = input.reloadRequested;
    input.reloadRequested = false;

    const weaponType = inventory.equippedWeaponType;
    const state = inventory.state;
    if (!weaponType || !state) continue; // nothing equipped

    const catalog = WEAPON_CATALOG[weaponType];
    const owned = inventory.owned.find((w) => w.weaponType === weaponType);
    if (!owned) continue; // shouldn't happen (equip requires ownership) - defensive only

    const centerX = position.x + hitbox.offsetX + hitbox.width / 2;
    const centerY = position.y + hitbox.offsetY + hitbox.height / 2;
    const aimDirection = computeAimDirection(centerX, centerY, input.mousePosition, direction);

    if (state.cooldownRemaining > 0) state.cooldownRemaining -= delta;

    if (state.state === "reloading") {
      state.reloadRemaining -= delta;
      if (state.reloadRemaining <= 0) {
        // Pull from reserve, clamped to what's actually available - refilling the magazine
        // unconditionally is only safe for an infiniteReserve weapon like smallGun; for a
        // finite-reserve weapon this would let it reload forever on an empty reserve.
        const needed = catalog.magazineSize - state.magazineAmmo;
        const taken = catalog.infiniteReserve ? needed : Math.min(needed, owned.reserveAmmo);
        state.magazineAmmo += taken;
        if (!catalog.infiniteReserve) owned.reserveAmmo -= taken;
        state.state = "idle";
        broadcastWeaponState(ctx, id, weaponType, "idle");
        broadcastAmmo(ctx, id, weaponType, state, owned.reserveAmmo);
      }
      continue;
    }

    // state.state === "idle" from here on.
    const canReload =
      state.magazineAmmo < catalog.magazineSize &&
      (catalog.infiniteReserve || owned.reserveAmmo > 0);

    if (reloadRequested && canReload) {
      state.state = "reloading";
      state.reloadRemaining = catalog.reloadSeconds;
      broadcastWeaponState(ctx, id, weaponType, "reloading", catalog.reloadSeconds);
      continue;
    }

    if (input.shooting && state.cooldownRemaining <= 0) {
      if (state.magazineAmmo > 0) {
        firePellets(ctx, centerX, centerY, aimDirection, catalog);
        state.magazineAmmo -= 1;
        state.cooldownRemaining = 1 / catalog.fireRatePerSecond;
        broadcastAmmo(ctx, id, weaponType, state, owned.reserveAmmo);
        broadcastWeaponFired(ctx, id, weaponType);
      }

      // Auto-reload the instant the magazine empties - but only if there's reserve left to
      // pull from, or this cycles idle->reloading->idle forever on an empty gun.
      const canAutoReload =
        state.magazineAmmo === 0 && (catalog.infiniteReserve || owned.reserveAmmo > 0);
      if (canAutoReload) {
        state.state = "reloading";
        state.reloadRemaining = catalog.reloadSeconds;
        broadcastWeaponState(ctx, id, weaponType, "reloading", catalog.reloadSeconds);
      }
    }
  }
};
