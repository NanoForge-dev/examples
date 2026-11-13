/**
 * Client-side mirror of Tower.level (server), for display only - kept in sync by
 * tower-update-packet.handler.ts.
 *
 * @component
 * @side client
 */
export class TowerLevelComponent {
  name = "TowerLevelComponent";

  constructor(public level: number = 1) {}
}
