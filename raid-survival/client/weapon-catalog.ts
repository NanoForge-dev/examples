// Display-only mirror of server/weapon-catalog.ts - the actual gameplay numbers (ammo, fire
// rate, reload timing) live server-side and arrive via packets; this only carries what's needed
// to render: a label and which weapons.png crop to use for the held weapon.
export const WEAPON_CATALOG = {
  smallGun: { label: "Small Gun" },
} as const;

export type WeaponType = keyof typeof WEAPON_CATALOG;
