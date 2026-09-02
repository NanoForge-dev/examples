// What a player can own and how each behaves. `alwaysOwned` weapons (smallGun) are granted at
// spawn, never buyable/refillable, and the shop panel never attaches a click handler to them -
// every other field still applies to them uniformly so nothing needs to special-case them beyond
// that one flag. Adding a new weapon is just a new key here plus a client-side entry in
// client/weapon-catalog.ts (kept in sync manually - client and server are separate bundles, same
// reasoning as building-catalog.ts).
export const WEAPON_CATALOG = {
  smallGun: {
    alwaysOwned: true,
    cost: 0,
    magazineSize: 8,
    infiniteReserve: true,
    startingReserve: -1,
    maxReserve: -1,
    ammoRefillAmount: 0,
    ammoRefillCost: 0,
    fireRatePerSecond: 5, // 1 shot every .2s
    reloadSeconds: 3,
    damage: 2,
    // Single pellet, zero spread - firePellets() collapses to exactly today's fireBullet() math
    // at these values (see weapon.system.ts), so smallGun's behavior is provably unchanged by the
    // multi-weapon/pellet generalization, not just "similar".
    pellets: 1,
    spreadDegrees: 0,
    // px/s - "high speed", not specified more precisely than that; 5x player speed (100) reads
    // as fast without being effectively instant at this map's scale. Easy to retune later.
    bulletSpeed: 500,
  },
  shotgun: {
    alwaysOwned: false,
    cost: 150,
    magazineSize: 5,
    infiniteReserve: false,
    startingReserve: 10,
    maxReserve: 40,
    ammoRefillAmount: 5,
    ammoRefillCost: 15,
    // Unspecified by the request beyond "consume 1 bullet, fire 5 pellets" - a deliberately
    // slower/punchier cadence than smallGun's 5/s, and a shorter reload matching its smaller
    // 5-round magazine. Both easy to retune.
    fireRatePerSecond: 1.5,
    reloadSeconds: 2,
    damage: 5, // per pellet
    pellets: 5,
    spreadDegrees: 25, // total cone width - 5 pellets evenly spaced across ±12.5°
    bulletSpeed: 500,
  },
} as const;

export type WeaponType = keyof typeof WEAPON_CATALOG;

export function isWeaponType(value: unknown): value is WeaponType {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(WEAPON_CATALOG, value);
}
