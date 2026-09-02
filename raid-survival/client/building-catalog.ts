// Mirrors server/building-catalog.ts - client and server are separate bundles, so this can't be
// a shared import; keep the keys and costs in sync manually. Only carries what the client needs
// to render/build with: cost (build bar affordability + the placement preview) and a display
// color (the server doesn't care about color).
export const BUILDING_CATALOG = {
  wall: { cost: 20, color: "#6B5B4A", label: "Wall" },
} as const;

export type BuildingType = keyof typeof BUILDING_CATALOG;

// World-space axis-aligned box - anything that can block a placement (the lobby, an existing
// building).
export interface OccupiedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Identical to server/building-catalog.ts's canPlaceBuilding - must produce the exact same
// answer given the same inputs, or the preview would lie about what's actually placeable. See
// that file for why this checks real box overlap (the lobby's footprint isn't tile-aligned)
// rather than tile-index equality.
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
