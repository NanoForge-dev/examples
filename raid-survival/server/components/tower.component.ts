// Marker for a "tower" Building entity, carrying the level/fire-timer state generic
// Position/Hitbox/Health don't. Level starts at 1 (just built, matching
// BUILDING_CATALOG.tower.maxHealth) and goes up to TOWER_MAX_LEVEL (see tower.system.ts) via
// tower-interact.system.ts's E-press upgrade, each level raising Health.max by
// TOWER_HP_PER_LEVEL and this tower's own fire rate/damage (tower.system.ts derives both from
// `level` fresh every tick, nothing is cached here beyond the level number itself).
export class Tower {
  name = this.constructor.name;

  level: number = 1;
  // Counts down every tick (tower.system.ts) the same way WeaponFireState.cooldownRemaining does
  // for a player's weapon - independent of the level, which only changes how fast it's reset.
  cooldownRemaining: number = 0;
}

// * Required to generate code
export default Tower.name;
