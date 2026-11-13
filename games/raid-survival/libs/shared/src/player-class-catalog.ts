// A player's class comes from the skin picked in the menu (1-3): the skin picker is the class
// picker.
export type PlayerClass = "healer" | "ninja" | "fighter";

export const classForSkin = (skin: number): PlayerClass => {
  if (skin === 2) return "ninja";
  if (skin === 3) return "fighter";
  return "healer"; // skin 1, and any unexpected value
};

export const PLAYER_CLASS_CATALOG = {
  // A heal box heals fully instead of the flat amount; revives a teammate in 3s instead of 5s.
  healer: {
    name: "Healer",
    description: "Heal boxes fully restore you. Revives teammates in 3s instead of 5s.",
    maxHealth: 100,
    speedMultiplier: 1,
    reviveDurationSeconds: 3,
    healBoxFullHeal: true,
  },
  ninja: {
    name: "Ninja",
    description: "Moves 30% faster than everyone else.",
    maxHealth: 100,
    speedMultiplier: 1.3,
    reviveDurationSeconds: 5,
    healBoxFullHeal: false,
  },
  // Spawns with a shotgun instead of the small gun (the server's start-game handler).
  fighter: {
    name: "Fighter",
    description: "120 max HP. Starts with a shotgun (2 magazines) instead of the small gun.",
    maxHealth: 120,
    speedMultiplier: 1,
    reviveDurationSeconds: 5,
    healBoxFullHeal: false,
  },
} as const;
