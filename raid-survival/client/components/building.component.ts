import { type BuildingType } from "../building-catalog";

// Marker + which catalog entry - used by build-mode's occupancy preview to know where existing
// buildings already are.
export class Building {
  name = this.constructor.name;

  constructor(public buildingType: BuildingType) {}
}

// * Required to generate code
export default Building.name;
