// `maxHealth` is the level-1 (just built) HP: the tower constants in `tower.ts` drive its level,
// HP and fire rate from there. `footprintTiles` is in tiles.
export const BUILDING_CATALOG = {
  wall: {
    cost: 20,
    maxHealth: 200,
    color: "#6B5B4A",
    label: "Wall",
    footprintTiles: { width: 1, height: 1 },
  },
  tower: {
    cost: 100,
    maxHealth: 100,
    color: "#4A5D3A",
    label: "Tower",
    footprintTiles: { width: 3, height: 3 },
  },
} as const;

export type BuildingType = keyof typeof BUILDING_CATALOG;

export const isBuildingType = (value: unknown): value is BuildingType =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(BUILDING_CATALOG, value);

/** World-space axis-aligned box: anything that can block a placement (the lobby, a building). */
export interface OccupiedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Whether a building fits at a tile: the server's check, and the client's placement preview.
 * Checks real box overlap rather than tile-index equality, because the lobby's footprint isn't
 * tile-aligned.
 */
export const canPlaceBuilding = (
  tileX: number,
  tileY: number,
  tileSize: number,
  cols: number,
  rows: number,
  isTreeCell: (col: number, row: number) => boolean,
  obstacles: OccupiedBox[],
  footprintTiles: { width: number; height: number } = { width: 1, height: 1 },
): boolean => {
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
};
