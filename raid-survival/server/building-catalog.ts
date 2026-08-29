// What can be built and what it costs. One entry today ("wall"); adding a new type is just
// adding a new key here plus a client-side entry in the build bar
// (client/building-catalog.ts - kept in sync manually, see that file's header comment).
export const BUILDING_CATALOG = {
  wall: { cost: 20, maxHealth: 200 },
} as const;

export type BuildingType = keyof typeof BUILDING_CATALOG;

export function isBuildingType(value: unknown): value is BuildingType {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(BUILDING_CATALOG, value);
}

// World-space axis-aligned box - used generically for anything that can block a placement
// (the lobby, an existing building).
export interface OccupiedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Pure and side-effect-free on purpose: this runs both here (authoritative) and client-side
// (build-packet.handler.ts / the build-mode preview) so the exact same rules produce the exact
// same answer - if they ever drift, the preview would lie about what's actually placeable.
//
// The lobby's own footprint is NOT tile-aligned (LOBBY_POSITION lands on a half-tile Y offset -
// verified against start-game-packet.handler.ts's constants), so this checks real box overlap
// against `obstacles`, not tile-index equality - tile-index equality is only valid for
// comparing two things that are both already tile-aligned (a candidate tile vs. another
// building), which is why every other obstacle (buildings) is expressed the same way, as a box.
export function canPlaceBuilding(
  tileX: number,
  tileY: number,
  tileSize: number,
  cols: number,
  rows: number,
  isTreeCell: (col: number, row: number) => boolean,
  obstacles: OccupiedBox[],
): boolean {
  if (!Number.isInteger(tileX) || !Number.isInteger(tileY)) return false;
  if (tileX < 0 || tileY < 0 || tileX >= cols || tileY >= rows) return false;
  if (isTreeCell(tileX, tileY)) return false;

  const x = tileX * tileSize;
  const y = tileY * tileSize;

  return !obstacles.some(
    (box) => x < box.x + box.width && x + tileSize > box.x && y < box.y + box.height && y + tileSize > box.y,
  );
}
