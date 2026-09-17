import mapCollisionData from "./static/map-collision.json";

// A copy of server/static/map-collision.json, kept in sync manually - the server never sends
// tile/tree data over the network, but build-mode's placement preview needs it client-side.
export const TILE_SIZE = mapCollisionData.tileSize;
export const MAP_COLS = mapCollisionData.cols;
export const MAP_ROWS = mapCollisionData.rows;

export function isTreeCell(col: number, row: number): boolean {
  return mapCollisionData.collision[row]?.[col] === 1;
}
