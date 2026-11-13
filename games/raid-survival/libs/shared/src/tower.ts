// Tower and repair economy, applied by the server and shown ahead of time by the client.
export const TOWER_RANGE = 120;
export const TOWER_MAX_LEVEL = 6;
export const TOWER_HP_PER_LEVEL = 50;
export const TOWER_UPGRADE_COST = 50;
// Flat repair-to-full cost, same as one upgrade: a per-missing-HP rate would make repairing a
// heavily damaged level-6 tower cost far more than upgrading it ever did.
export const TOWER_HEAL_COST = 50;
// Repair economics of the other targets.
export const LOBBY_HEAL_COST_PER_HP = 1;
export const WALL_HEAL_COST_PER_HP = 1 / 3;
