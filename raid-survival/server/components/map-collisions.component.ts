export interface TreeLocation {
  x: number;
  y: number;
}

export class MapCollisions {
  name = this.constructor.name;

  private readonly treeCells: Set<string>;

  constructor(
    public tileSize: number,
    public cols: number,
    public rows: number,
    public treeLocations: TreeLocation[],
  ) {
    this.treeCells = new Set(treeLocations.map(({ x, y }) => `${x},${y}`));
  }

  isTreeCell(cellX: number, cellY: number): boolean {
    return this.treeCells.has(`${cellX},${cellY}`);
  }
}

// * Required to generate code
export default MapCollisions.name;
