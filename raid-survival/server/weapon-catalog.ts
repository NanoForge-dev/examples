// `alwaysOwned` grants a weapon free at spawn, never buyable/refillable; unused today but kept
// for a future weapon that needs it. Kept in sync manually with client/weapon-catalog.ts.
export const WEAPON_CATALOG = {
  smallGun: {
    // Free at spawn to every class except fighter (see start-game-packet.handler.ts), buyable as
    // a backup for everyone else.
    alwaysOwned: false,
    cost: 40,
    magazineSize: 8,
    infiniteReserve: true,
    startingReserve: -1,
    maxReserve: -1,
    ammoRefillAmount: 0,
    ammoRefillCost: 0,
    fireRatePerSecond: 5, // 1 shot every .2s
    reloadSeconds: 3,
    damage: 2,
    // Single pellet, zero spread - firePellets() collapses to plain single-bullet fire at these
    // values (see weapon.system.ts).
    pellets: 1,
    spreadDegrees: 0,
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
    fireRatePerSecond: 1.5,
    reloadSeconds: 2,
    damage: 5, // per pellet
    pellets: 5,
    spreadDegrees: 25, // total cone width - 5 pellets evenly spaced across ±12.5°
    bulletSpeed: 500,
  },
  // Highest fire rate/magazine, low per-shot damage, wide spread - sprays rather than aims.
  uzi: {
    alwaysOwned: false,
    cost: 200,
    magazineSize: 30,
    infiniteReserve: false,
    startingReserve: 60,
    maxReserve: 180,
    ammoRefillAmount: 30,
    ammoRefillCost: 20,
    fireRatePerSecond: 12,
    reloadSeconds: 2,
    damage: 3,
    pellets: 1,
    spreadDegrees: 18,
    bulletSpeed: 500,
  },
  // Slowest fire rate/smallest magazine, highest per-shot damage, zero spread.
  sniper: {
    alwaysOwned: false,
    cost: 300,
    magazineSize: 4,
    infiniteReserve: false,
    startingReserve: 8,
    maxReserve: 24,
    ammoRefillAmount: 4,
    ammoRefillCost: 40,
    fireRatePerSecond: 0.8,
    reloadSeconds: 3,
    damage: 40,
    pellets: 1,
    spreadDegrees: 0,
    bulletSpeed: 900,
  },
} as const;

export type WeaponType = keyof typeof WEAPON_CATALOG;

export function isWeaponType(value: unknown): value is WeaponType {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(WEAPON_CATALOG, value);
}
