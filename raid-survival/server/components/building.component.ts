import { type BuildingType } from "../building-catalog";

// Marker + catalog key; physics/combat/health live on CollisionBox/Hitbox/Health instead.
export class Building {
  name = this.constructor.name;

  constructor(public buildingType: BuildingType) {}
}

// * Required to generate code
export default Building.name;
