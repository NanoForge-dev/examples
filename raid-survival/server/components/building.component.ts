import { type BuildingType } from "../building-catalog";

// Position/CollisionBox/Hitbox/Health carry all the actual physics/combat behavior generically
// (see build-packet.handler.ts) - this is just the marker + which catalog entry it came from.
export class Building {
  name = this.constructor.name;

  constructor(public buildingType: BuildingType) {}
}

// * Required to generate code
export default Building.name;
