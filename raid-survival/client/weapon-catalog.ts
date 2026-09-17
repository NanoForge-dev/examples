// Display-only mirror of server/weapon-catalog.ts - gameplay numbers live server-side and arrive
// via packets. This only carries render/shop data: sprite key + crop sheet, native icon size (for
// HUD fit-scaling), world-space scale, an optional pivot (grip point, if not the frame's center),
// a matching handOffsetDelta when a pivot is set (a pivot alone only fixes rotation, not
// position), rest-angle rotation offset, and the two shop costs.
export const WEAPON_CATALOG = {
  smallGun: {
    label: "Small Gun",
    spriteKey: "weapons.png",
    animationsKey: "weapons-animations.txt",
    iconAnimation: "idle",
    iconSize: { width: 16, height: 16 },
    scale: 1,
    rotationOffset: 0,
    alwaysOwned: false,
    cost: 40,
    ammoRefillCost: 0,
  },
  shotgun: {
    label: "Shotgun",
    spriteKey: "Shotgun-Shot.png",
    animationsKey: "shotgun-shot-animations.txt",
    iconAnimation: "idle",
    iconSize: { width: 52, height: 32 }, // native frame size, for the HUD icon's fit-scale
    scale: 0.5,
    // Grip point within the frame (native, unscaled px) - what the gun rotates/flips around
    // (rotate-to-direction.system.ts). Not the frame's geometric center, so this is required.
    pivot: { x: 7, y: 21 },
    // A pivot alone only fixes rotation, not position: this weapon's TransformComponent is shared
    // with hand.png's, so unless the pivot equals hand.png's own default center (8,8), the two
    // sprites land at different world points. handOffsetDelta corrects that gap - retune both
    // together if the gun stops sitting on the hand.
    handOffsetDelta: { x: 1, y: -13 },
    rotationOffset: 0,
    alwaysOwned: false,
    cost: 150,
    ammoRefillCost: 15,
    // A real reload animation, built once as a separate overlay and toggled visible/hidden rather
    // than swapped at runtime - swapping the main sprite's image on every reload was visibly
    // glitchy (spriteSystem reloads the image asynchronously, causing a flicker).
    reloadSpriteKey: "Shotgun-Reload.png",
    reloadAnimationsKey: "shotgun-reload-animations.txt",
    reloadFrameCount: 37,
    reloadSeconds: 2, // must match server/weapon-catalog.ts's shotgun.reloadSeconds
    // shootSeconds is a client-only visual duration - it just needs to stay under the server's
    // fire-rate interval (0.667s here) so a rapid second shot always restarts the animation
    // cleanly instead of continuing mid-loop.
    shootFrameCount: 37,
    shootSeconds: 0.5,
  },
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
    ammoRefillCost: 20,
    reloadSpriteKey: "Uzi-Reload.png",
    reloadAnimationsKey: "uzi-reload-animations.txt",
    reloadFrameCount: 16,
    reloadSeconds: 2,
    shootFrameCount: 6,
    shootSeconds: 0.2, // well under the ~0.083s fire interval for a clean per-shot restart
  },
  // No dedicated sniper asset exists - AK-Shot.png/AK-Reload.png stand in for it.
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
    ammoRefillCost: 40,
    reloadSpriteKey: "AK-Reload.png",
    reloadAnimationsKey: "ak-reload-animations.txt",
    reloadFrameCount: 19,
    reloadSeconds: 3,
    shootFrameCount: 14,
    shootSeconds: 0.6, // slow fire rate (~1.25s between shots) leaves plenty of room
  },
} as const;

export type WeaponType = keyof typeof WEAPON_CATALOG;

export function isWeaponType(value: unknown): value is WeaponType {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(WEAPON_CATALOG, value);
}
