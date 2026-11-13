import type { Vector } from "@raid-survival/shared/protocol";

// Sizes and limits shared by the game's world building and its systems.

/** Zoom limits and step of the build mode's zoom buttons, on top of the world's base scale. */
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;
export const ZOOM_STEP = 0.1;

/** The crosshair that replaces the OS cursor during a game: native size and scale. */
export const CURSOR_ICON_SIZE = { width: 8, height: 8 };
export const CURSOR_SCALE = 3;

/** Where a weapon sits relative to its player, before its catalog's `handOffsetDelta`. */
export const WEAPON_LOCAL_OFFSET: Vector = { x: 6, y: 12 };

/** Size of the weapon icon of the ammo HUD, which fit-scales each weapon's art into it. */
export const AMMO_ICON_SIZE = { width: 32, height: 32 };
