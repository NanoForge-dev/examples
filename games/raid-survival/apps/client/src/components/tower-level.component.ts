/**
 * Client-side mirror of Tower.level (server), for display only - kept in sync by
 * handlers/tower-update.handler.ts.
 *
 * @component
 * @side client
 */
export class TowerLevelComponent {
  name = "TowerLevelComponent";

  constructor(
    /** Level of the tower, from 1. */
    public level: number = 1,
  ) {}
}
