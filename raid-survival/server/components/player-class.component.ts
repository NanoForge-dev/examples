import { type PlayerClass as PlayerClassType } from "../player-class-catalog";

// Derived once at spawn from the chosen skin (classForSkin) and never changes. Read by
// move-input/revive/loot-box-pickup systems.
export class PlayerClass {
  name = this.constructor.name;

  constructor(public playerClass: PlayerClassType) {}
}

// * Required to generate code
export default PlayerClass.name;
