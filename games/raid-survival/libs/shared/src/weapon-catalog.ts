// Gameplay numbers (applied by the server) and render and shop data (used by the client).
// `alwaysOwned` grants a weapon free at spawn, never buyable or refillable: unused today, kept for
// a future weapon. Render data: sprite key and crop sheet, native icon size (HUD fit-scaling),
// world-space scale, an optional pivot (grip point, when not the frame's center) with the
// matching `handOffsetDelta` (a pivot alone only fixes rotation, not position), and the rest-angle
// rotation offset.
export const WEAPON_CATALOG = {
  smallGun: {
    label: "Small Gun",
    spriteKey: "weapons.png",
    animationsKey: "weapons-animations.txt",
    iconAnimation: "idle",
    iconSize: { width: 16, height: 16 },
    scale: 1,
    rotationOffset: 0,
    // Free at spawn to every class but the fighter, buyable as a backup by everyone else.
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
    // Single pellet, zero spread: plain single-bullet fire.
    pellets: 1,
    spreadDegrees: 0,
    bulletSpeed: 500,
  },
  shotgun: {
    label: "Shotgun",
    spriteKey: "Shotgun-Shot.png",
    animationsKey: "shotgun-shot-animations.txt",
    iconAnimation: "idle",
    iconSize: { width: 52, height: 32 }, // native frame size, for the HUD icon's fit-scale
    scale: 0.5,
    // Grip point within the frame (native, unscaled px): what the gun rotates and flips around.
    pivot: { x: 7, y: 21 },
    // The gun shares the hand's transform: unless the pivot equals the hand's own center (8,8),
    // the two sprites land at different points. Retune both together if the gun leaves the hand.
    handOffsetDelta: { x: 1, y: -13 },
    rotationOffset: 0,
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
    spreadDegrees: 25, // total cone width: 5 pellets evenly spaced across ±12.5°
    bulletSpeed: 500,
    // The reload animation is a separate overlay toggled visible, not a swap of the main sprite's
    // image (that reloads asynchronously and flickers).
    reloadSpriteKey: "Shotgun-Reload.png",
    reloadAnimationsKey: "shotgun-reload-animations.txt",
    reloadFrameCount: 37,
    // Client-only visual duration: it stays under the fire-rate interval (0.667s) so a quick
    // second shot restarts the animation cleanly.
    shootFrameCount: 37,
    shootSeconds: 0.5,
  },
  // Highest fire rate and magazine, low damage per shot, wide spread: sprays rather than aims.
  uzi: {
    label: "Uzi",
    spriteKey: "Uzi-Shot.png",
    animationsKey: "uzi-shot-animations.txt",
    iconAnimation: "idle",
    iconSize: { width: 48, height: 32 },
    scale: 0.5,
    rotationOffset: 0,
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
    reloadSpriteKey: "Uzi-Reload.png",
    reloadAnimationsKey: "uzi-reload-animations.txt",
    reloadFrameCount: 16,
    shootFrameCount: 6,
    shootSeconds: 0.2,
  },
  // Slowest fire rate, smallest magazine, highest damage per shot, zero spread. No sniper art
  // exists: the AK sheets stand in for it.
  sniper: {
    label: "Sniper",
    spriteKey: "AK-Shot.png",
    animationsKey: "ak-shot-animations.txt",
    iconAnimation: "idle",
    iconSize: { width: 52, height: 32 },
    scale: 0.5,
    rotationOffset: 0,
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
    reloadSpriteKey: "AK-Reload.png",
    reloadAnimationsKey: "ak-reload-animations.txt",
    reloadFrameCount: 19,
    shootFrameCount: 14,
    shootSeconds: 0.6,
  },
} as const;

export type WeaponType = keyof typeof WEAPON_CATALOG;

export const isWeaponType = (value: unknown): value is WeaponType =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(WEAPON_CATALOG, value);
