import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { WeaponInventory, type HandFireState } from "../components/weapon-inventory.component";
import { ShootInput } from "../components/shoot-input.component";
import { Position } from "../components/position.component";
import { Velocity } from "../components/velocity.component";
import { Hitbox } from "../components/hitbox.component";
import { Direction } from "../components/direction.component";
import { Health } from "../components/health.component";
import { Bullet } from "../components/bullet.component";
import { WEAPON_CATALOG, type WeaponType } from "../weapon-catalog";
import { sendToInGamePlayers } from "../network-utils";

function broadcastWeaponState(
  network: NetworkServerLibrary,
  id: number,
  hand: "left" | "right",
  weaponType: WeaponType,
  state: "idle" | "reloading",
  reloadSeconds?: number,
) {
  sendToInGamePlayers(network, { type: "weaponState", id, hand, weaponType, state, reloadSeconds });
}

// A one-shot event, not a state (unlike broadcastWeaponState's idle/reloading) - sent exactly once
// per shot that actually leaves the gun (magazine wasn't empty, cooldown had elapsed - see the
// call site below), purely so clients can play a recoil/muzzle-flash animation at the real moment
// of firing. Broadcast to everyone, not just the shooter, same reasoning as every other weapon
// broadcast here - every client renders every player's weapons, not just their own.
function broadcastWeaponFired(network: NetworkServerLibrary, id: number, hand: "left" | "right", weaponType: WeaponType) {
  sendToInGamePlayers(network, { type: "weaponFired", id, hand, weaponType });
}

// hand-scoped now, not weapon-scoped - each hand has its own independent magazine (see
// weapon-inventory.component.ts), so a client needs to know WHICH hand's row an ammo update is
// for, not just which weapon type.
function broadcastAmmo(
  network: NetworkServerLibrary,
  id: number,
  hand: "left" | "right",
  weaponType: WeaponType,
  handState: HandFireState,
  reserveAmmo: number,
) {
  sendToInGamePlayers(network, {
    type: "ammo",
    id,
    hand,
    weaponType,
    magazineAmmo: handState.magazineAmmo,
    reserveAmmo,
  });
}

// direction here is a fresh, already-normalized aim vector computed by the caller at the exact
// moment of firing (see computeAimDirection) - not the persisted Direction component, which is
// now purely visual (rotation broadcast to other clients). Plain {x,y}, not the Direction class,
// since Direction also carries a `name` field a literal aim vector has no reason to fake.
function firePellets(
  registry: Registry,
  network: NetworkServerLibrary,
  centerX: number,
  centerY: number,
  direction: { x: number; y: number },
  catalog: (typeof WEAPON_CATALOG)[WeaponType],
) {
  const pellets = catalog.pellets;
  const spreadRad = (catalog.spreadDegrees * Math.PI) / 180;

  for (let i = 0; i < pellets; i++) {
    // Spans [-0.5, 0.5] across the pellets, 0 for a single pellet - i.e. dead center, matching
    // today's single-bullet aim exactly.
    const t = pellets === 1 ? 0 : i / (pellets - 1) - 0.5;
    const angle = t * spreadRad;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const vx = (direction.x * cos - direction.y * sin) * catalog.bulletSpeed;
    const vy = (direction.x * sin + direction.y * cos) * catalog.bulletSpeed;

    const bullet = registry.spawnEntity();
    registry.addComponent(bullet, new Position(centerX, centerY));
    registry.addComponent(bullet, new Velocity(vx, vy));
    registry.addComponent(bullet, new Bullet(catalog.damage));

    sendToInGamePlayers(network, {
      type: "spawn",
      entityType: "bullet",
      id: bullet.getId(),
      position: { x: centerX, y: centerY },
      velocity: { x: vx, y: vy },
    });
  }
}

// Fresh (player -> mouse) aim vector, computed at the moment a shot actually fires - not derived
// from the persisted Direction component, which only gets updated by whatever "direction" packet
// last arrived and is shared with the visual-rotation broadcast, so it can be one packet's worth
// of latency behind the mouse. Falls back to `direction` (the persisted component) only if no
// mousePosition has ever arrived yet (the very first tick or two of a connection) - never crashes,
// never no-ops, just briefly less precise.
function computeAimDirection(
  centerX: number,
  centerY: number,
  mousePosition: { x: number; y: number } | null,
  direction: Direction,
): { x: number; y: number } {
  if (mousePosition) {
    const dx = mousePosition.x - centerX;
    const dy = mousePosition.y - centerY;
    const length = Math.hypot(dx, dy);
    if (length > 0) return { x: dx / length, y: dy / length };
  }
  return { x: direction.x, y: direction.y };
}

// Owns the whole weapon state machine (idle/reloading, cooldown, magazine) for every EQUIPPED
// hand of every player - ShootInput just records what's currently held/requested, this decides
// what actually happens and when, every tick, independent of packet frequency (same split as
// move-input.system.ts / move.system.ts).
//
// Iterates hand slots, not owned weapons, on purpose (the reverse of this system's first version):
// each hand's magazine/reload/cooldown is its own HandFireState now (see
// weapon-inventory.component.ts), fully independent of the other hand's - a weapon type can only
// occupy one hand at a time (equip-weapon-packet.handler.ts auto-moves it otherwise), but the two
// hands are still usually different types with their own timers either way. Reserve is what's
// actually shared across a type's ownership (OwnedWeapon.reserveAmmo), read/written by whichever
// single hand currently holds that type.
export function weaponSystem(registry: Registry, ctx: Context) {
  const entities: {
    id: number;
    WeaponInventory: WeaponInventory;
    ShootInput: ShootInput;
    Position: Position;
    Hitbox: Hitbox;
    Direction: Direction;
    Health: Health;
  }[] = registry.getIndexedZipper([WeaponInventory, ShootInput, Position, Hitbox, Direction, Health]);
  if (entities.length === 0) return;

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  const delta = ctx.app.delta / 1000;

  for (const {
    id,
    WeaponInventory: inventory,
    ShootInput: input,
    Position: position,
    Hitbox: hitbox,
    Direction: direction,
    Health: health,
  } of entities) {
    // Dead - weapons do nothing until (if ever) they respawn, matching move-input.system.ts's
    // dead-player guard.
    if (health.current <= 0) {
      input.reloadRequested = false;
      continue;
    }

    // Snapshotted once, before the per-weapon loop, and cleared exactly once here - not inside
    // the loop, or only the first owned weapon processed would ever see it.
    const reloadRequested = input.reloadRequested;
    input.reloadRequested = false;

    // Same muzzle point + aim vector for every owned weapon this player fires this tick - neither
    // depends on which weapon, only on this player's position/mouse, so both are computed once
    // per player rather than once per owned weapon.
    const centerX = position.x + hitbox.offsetX + hitbox.width / 2;
    const centerY = position.y + hitbox.offsetY + hitbox.height / 2;
    const aimDirection = computeAimDirection(centerX, centerY, input.mousePosition, direction);

    for (const hand of ["left", "right"] as const) {
      const weaponType = hand === "left" ? inventory.leftWeaponType : inventory.rightWeaponType;
      const state = hand === "left" ? inventory.leftState : inventory.rightState;
      if (!weaponType || !state) continue; // nothing equipped in this hand

      const catalog = WEAPON_CATALOG[weaponType];
      const owned = inventory.owned.find((w) => w.weaponType === weaponType);
      if (!owned) continue; // shouldn't happen (equip requires ownership) - defensive only

      if (state.cooldownRemaining > 0) state.cooldownRemaining -= delta;

      if (state.state === "reloading") {
        state.reloadRemaining -= delta;
        if (state.reloadRemaining <= 0) {
          // Pull from reserve, clamped to what's actually available - refilling the magazine
          // unconditionally (as a naive port of the old single-weapon code would) is only safe
          // for an infiniteReserve weapon like smallGun; for a finite-reserve weapon this would
          // let it reload forever on an empty reserve.
          const needed = catalog.magazineSize - state.magazineAmmo;
          const taken = catalog.infiniteReserve ? needed : Math.min(needed, owned.reserveAmmo);
          state.magazineAmmo += taken;
          if (!catalog.infiniteReserve) owned.reserveAmmo -= taken;
          state.state = "idle";
          broadcastWeaponState(network, id, hand, weaponType, "idle");
          broadcastAmmo(network, id, hand, weaponType, state, owned.reserveAmmo);
        }
        continue;
      }

      // state.state === "idle" from here on.
      const canReload = state.magazineAmmo < catalog.magazineSize && (catalog.infiniteReserve || owned.reserveAmmo > 0);

      if (reloadRequested && canReload) {
        state.state = "reloading";
        state.reloadRemaining = catalog.reloadSeconds;
        broadcastWeaponState(network, id, hand, weaponType, "reloading", catalog.reloadSeconds);
        continue;
      }

      const wantsFire = hand === "left" ? input.shooting : input.rightShooting;

      if (wantsFire && state.cooldownRemaining <= 0) {
        if (state.magazineAmmo > 0) {
          firePellets(registry, network, centerX, centerY, aimDirection, catalog);
          state.magazineAmmo -= 1;
          state.cooldownRemaining = 1 / catalog.fireRatePerSecond;
          broadcastAmmo(network, id, hand, weaponType, state, owned.reserveAmmo);
          broadcastWeaponFired(network, id, hand, weaponType);
        }

        // Auto-reload the instant the magazine empties - but only if there's reserve left to
        // pull from, or this cycles idle->reloading->idle forever on an empty gun.
        const canAutoReload = state.magazineAmmo === 0 && (catalog.infiniteReserve || owned.reserveAmmo > 0);
        if (canAutoReload) {
          state.state = "reloading";
          state.reloadRemaining = catalog.reloadSeconds;
          broadcastWeaponState(network, id, hand, weaponType, "reloading", catalog.reloadSeconds);
        }
      }
    }
  }
}

// * Required to generate code
export default weaponSystem.name;
