// Display-only mirror of the repair/upgrade costs server/systems/tower.system.ts and
// server/systems/building-interact.system.ts are authoritative over - kept in sync manually
// (client and server are separate bundles, same reasoning building-catalog.ts's header gives).
// Never used to actually apply an effect, only to show a player what pressing E will cost before
// they press it - see building-interact-indicator.system.ts.
export const TOWER_MAX_LEVEL = 6;
export const TOWER_RANGE = 120;
export const TOWER_UPGRADE_COST = 50;
export const TOWER_HEAL_COST = 50;
export const LOBBY_HEAL_COST_PER_HP = 1;
export const WALL_HEAL_COST_PER_HP = 1 / 3;
