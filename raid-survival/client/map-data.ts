import mapCollisionData from "./static/map-collision.json";

// A copy of server/static/map-collision.json (server/systems/packet-handlers/
// start-game-packet.handler.ts) - the server never sends tile/tree data over the network today,
// and build-mode's occupancy preview (build-mode.system.ts) needs it client-side to color tiles
// red/green the same way build-packet.handler.ts's canPlaceBuilding validates them. Kept in sync
// manually, same reasoning as building-catalog.ts.
export const TILE_SIZE = mapCollisionData.tileSize;
export const MAP_COLS = mapCollisionData.cols;
export const MAP_ROWS = mapCollisionData.rows;

export function isTreeCell(col: number, row: number): boolean {
  return mapCollisionData.collision[row]?.[col] === 1;
}
