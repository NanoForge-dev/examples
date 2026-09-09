// Mirrors server/building-catalog.ts - client and server are separate bundles, so this can't be
// a shared import; keep the keys, costs, and footprintTiles in sync manually. Only carries what
// the client needs to render/build with: cost (build bar affordability + the placement preview),
// a display color (the server doesn't care about color), and footprintTiles (how many tiles
// wide/tall - the placement preview/obstacle sizing needs this to match the server exactly, same
// reasoning canPlaceBuilding's own header comment gives).
export const BUILDING_CATALOG = {
  wall: { cost: 20, color: "#6B5B4A", label: "Wall", footprintTiles: { width: 1, height: 1 } },
  tower: { cost: 100, color: "#4A5D3A", label: "Tower", footprintTiles: { width: 3, height: 3 } },
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
// rather than tile-index equality, and for footprintTiles' default/meaning.
export function canPlaceBuilding(
  tileX: number,
  tileY: number,
  tileSize: number,
  cols: number,
  rows: number,
  isTreeCell: (col: number, row: number) => boolean,
  obstacles: OccupiedBox[],
  footprintTiles: { width: number; height: number } = { width: 1, height: 1 },
): boolean {
  if (!Number.isInteger(tileX) || !Number.isInteger(tileY)) return false;
  if (tileX < 0 || tileY < 0) return false;
  if (tileX + footprintTiles.width > cols || tileY + footprintTiles.height > rows) return false;

  for (let dy = 0; dy < footprintTiles.height; dy++) {
    for (let dx = 0; dx < footprintTiles.width; dx++) {
      if (isTreeCell(tileX + dx, tileY + dy)) return false;
    }
  }

  const x = tileX * tileSize;
  const y = tileY * tileSize;
  const width = footprintTiles.width * tileSize;
  const height = footprintTiles.height * tileSize;

  return !obstacles.some(
    (box) =>
      x < box.x + box.width && x + width > box.x && y < box.y + box.height && y + height > box.y,
  );
}
