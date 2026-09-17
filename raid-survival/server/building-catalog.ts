// `maxHealth` is level-1 (just-built) HP; tower.component.ts owns level/HP/fire-rate progression
// from there. `footprintTiles` is tiles wide/tall - kept in sync manually with
// client/building-catalog.ts.
export const BUILDING_CATALOG = {
  wall: { cost: 20, maxHealth: 200, footprintTiles: { width: 1, height: 1 } },
  tower: { cost: 100, maxHealth: 100, footprintTiles: { width: 3, height: 3 } },
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

// Pure, and duplicated verbatim client-side (client/building-catalog.ts) so the placement preview
// can't drift from what the server actually allows. Checks real box overlap rather than tile-index
// equality because the lobby's own footprint isn't tile-aligned.
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
