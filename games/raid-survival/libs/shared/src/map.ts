import mapCollision from "./map-collision.json";

/** A tile of the map, in tiles from the top-left corner. */
export interface TreeLocation {
  x: number;
  y: number;
}

/** Size of a map tile, in world pixels. */
export const TILE_SIZE = mapCollision.tileSize;
/** Width of the map, in tiles. */
export const MAP_COLS = mapCollision.cols;
/** Height of the map, in tiles. */
export const MAP_ROWS = mapCollision.rows;

/** Whether a tile is a tree: it blocks players, bullets and buildings, and zombies spawn there. */
export const isTreeCell = (col: number, row: number): boolean =>
  mapCollision.collision[row]?.[col] === 1;

/** Every tree tile of the map. */
export const TREE_LOCATIONS: TreeLocation[] = mapCollision.collision.flatMap((row, y) =>
  row.flatMap((blocked, x) => (blocked ? [{ x, y }] : [])),
);
