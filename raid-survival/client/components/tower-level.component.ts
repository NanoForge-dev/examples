// Client-side mirror of Tower.level (server) - purely for display (the interact-proximity
// indicator's "Lv X/6" text and picking which upgrade cost to show). Kept in sync by
// tower-update-packet.handler.ts.
export class TowerLevelComponent {
  name = this.constructor.name;

  constructor(public level: number = 1) {}
}

// * Required to generate code
export default TowerLevelComponent.name;
