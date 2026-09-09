import { type PlayerClass as PlayerClassType } from "../player-class-catalog";

// Marker carrying which class this player is (derived once at spawn from their chosen skin - see
// classForSkin, player-class-catalog.ts - never changes mid-game). Read by move-input.system.ts
// (speed multiplier), revive.system.ts (the reviver's own class sets the channel duration), and
// loot-box-pickup.system.ts (a healer's heal box fully heals instead of the flat amount).
export class PlayerClass {
  name = this.constructor.name;

  constructor(public playerClass: PlayerClassType) {}
}

// * Required to generate code
export default PlayerClass.name;
