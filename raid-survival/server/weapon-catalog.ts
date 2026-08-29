// What a player can hold and how it behaves. One entry today ("smallGun"); adding a new weapon
// is just a new key here plus a client-side entry in client/weapon-catalog.ts (kept in sync
// manually - client and server are separate bundles, same reasoning as building-catalog.ts).
export const WEAPON_CATALOG = {
  smallGun: {
    magazineSize: 8,
    infiniteReserve: true,
    fireRatePerSecond: 1,
    reloadSeconds: 3,
    damage: 5,
    // px/s - "high speed", not specified more precisely than that; 5x player speed (100) reads
    // as fast without being effectively instant at this map's scale. Easy to retune later.
    bulletSpeed: 500,
  },
} as const;

export type WeaponType = keyof typeof WEAPON_CATALOG;
