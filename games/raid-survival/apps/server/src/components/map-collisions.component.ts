import type { TreeLocation } from "@raid-survival/shared/map";

/**
 * The trees of the map, which block players and bullets. One per game.
 *
 * @component
 * @side server
 */
export class MapCollisions {
  name = "MapCollisions";

  private readonly treeCells: Set<string>;

  constructor(
    /** Size of a tile, in pixels. */
    public tileSize = 16,
    /** Width of the map, in tiles. */
    public cols = 0,
    /** Height of the map, in tiles. */
    public rows = 0,
    /** The tree tiles. */
    public treeLocations: TreeLocation[] = [],
  ) {
    this.treeCells = new Set(treeLocations.map(({ x, y }) => `${x},${y}`));
  }

  isTreeCell(cellX: number, cellY: number): boolean {
    return this.treeCells.has(`${cellX},${cellY}`);
  }
}
