// Tower-specific state (level, fire cooldown) on top of the generic Position/Hitbox/Health.
// Level rises via building-interact.system.ts's E-press upgrade, up to TOWER_MAX_LEVEL;
// tower.system.ts derives fire rate/damage from `level` fresh every tick.
export class Tower {
  name = this.constructor.name;

  level: number = 1;
  // Counts down every tick, same idea as a weapon's cooldownRemaining.
  cooldownRemaining: number = 0;
}

// * Required to generate code
export default Tower.name;
