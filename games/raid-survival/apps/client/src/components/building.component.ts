import { type BuildingType } from "@raid-survival/shared/building-catalog";

/**
 * Marker + which catalog entry - used by build-mode's occupancy preview to know where existing
 * buildings already are.
 *
 * @component
 * @side client
 */
export class Building {
  name = "Building";

  constructor(public buildingType: BuildingType) {}
}
