import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { Weapon } from "../components/weapon.component";
import { ShootInput } from "../components/shoot-input.component";
import { Position } from "../components/position.component";
import { Velocity } from "../components/velocity.component";
import { Hitbox } from "../components/hitbox.component";
import { Direction } from "../components/direction.component";
import { Health } from "../components/health.component";
import { Bullet } from "../components/bullet.component";
import { WEAPON_CATALOG } from "../weapon-catalog";
import { sendToInGamePlayers } from "../network-utils";

function broadcastWeaponState(network: NetworkServerLibrary, id: number, state: "idle" | "reloading", reloadSeconds?: number) {
  sendToInGamePlayers(network, { type: "weaponState", id, state, reloadSeconds });
}

function broadcastAmmo(network: NetworkServerLibrary, id: number, weapon: Weapon) {
  sendToInGamePlayers(network, {
    type: "ammo",
    id,
    magazineAmmo: weapon.magazineAmmo,
    reserveAmmo: weapon.reserveAmmo,
  });
}

function fireBullet(
  registry: Registry,
  network: NetworkServerLibrary,
  position: Position,
  hitbox: Hitbox,
  direction: Direction,
  damage: number,
  speed: number,
) {
  const centerX = position.x + hitbox.offsetX + hitbox.width / 2;
  const centerY = position.y + hitbox.offsetY + hitbox.height / 2;

  const bullet = registry.spawnEntity();
  registry.addComponent(bullet, new Position(centerX, centerY));
  registry.addComponent(bullet, new Velocity(direction.x * speed, direction.y * speed));
  registry.addComponent(bullet, new Bullet(damage));

  sendToInGamePlayers(network, {
    type: "spawn",
    entityType: "bullet",
    id: bullet.getId(),
    position: { x: centerX, y: centerY },
    velocity: { x: direction.x * speed, y: direction.y * speed },
  });
}

// Owns the whole weapon state machine (idle/reloading, cooldown, magazine) for every player with
// a Weapon - ShootInput just records what's currently held/requested, this decides what actually
// happens and when, every tick, independent of how often a packet arrives (same split as
// move-input.system.ts / move.system.ts).
export function weaponSystem(registry: Registry, ctx: Context) {
  const entities: {
    id: number;
    Weapon: Weapon;
    ShootInput: ShootInput;
    Position: Position;
    Hitbox: Hitbox;
    Direction: Direction;
    Health: Health;
  }[] = registry.getIndexedZipper([Weapon, ShootInput, Position, Hitbox, Direction, Health]);
  if (entities.length === 0) return;

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  const delta = ctx.app.delta / 1000;

  for (const { id, Weapon: weapon, ShootInput: input, Position: position, Hitbox: hitbox, Direction: direction, Health: health } of entities) {
    // Dead - the weapon does nothing until (if ever) they respawn, matching move-input.system.ts's
    // dead-player guard.
    if (health.current <= 0) {
      input.reloadRequested = false;
      continue;
    }

    const catalog = WEAPON_CATALOG[weapon.weaponType];

    if (weapon.cooldownRemaining > 0) weapon.cooldownRemaining -= delta;

    if (weapon.state === "reloading") {
      weapon.reloadRemaining -= delta;
      if (weapon.reloadRemaining <= 0) {
        weapon.magazineAmmo = catalog.magazineSize;
        weapon.state = "idle";
        broadcastWeaponState(network, id, "idle");
        broadcastAmmo(network, id, weapon);
      }
      input.reloadRequested = false;
      continue;
    }

    // state === "idle" from here on.
    const wantsReload = input.reloadRequested && weapon.magazineAmmo < catalog.magazineSize;
    input.reloadRequested = false;

    if (wantsReload) {
      weapon.state = "reloading";
      weapon.reloadRemaining = catalog.reloadSeconds;
      broadcastWeaponState(network, id, "reloading", catalog.reloadSeconds);
      continue;
    }

    if (input.shooting && weapon.cooldownRemaining <= 0) {
      if (weapon.magazineAmmo > 0) {
        fireBullet(registry, network, position, hitbox, direction, catalog.damage, catalog.bulletSpeed);
        weapon.magazineAmmo -= 1;
        weapon.cooldownRemaining = 1 / catalog.fireRatePerSecond;
        broadcastAmmo(network, id, weapon);
      }

      // Auto-reload the instant the magazine is empty - whether it just emptied from this shot,
      // or the player kept holding the trigger on an already-empty gun.
      if (weapon.magazineAmmo === 0) {
        weapon.state = "reloading";
        weapon.reloadRemaining = catalog.reloadSeconds;
        broadcastWeaponState(network, id, "reloading", catalog.reloadSeconds);
      }
    }
  }
}

// * Required to generate code
export default weaponSystem.name;
