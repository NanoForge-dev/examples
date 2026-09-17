// Display-only mirror of server/player-class-catalog.ts's skin->class mapping - shown on
// MenuScene's skin-select screen, never used to apply an effect.
export type PlayerClass = "healer" | "ninja" | "fighter";

export function classForSkin(skin: number): PlayerClass {
  if (skin === 2) return "ninja";
  if (skin === 3) return "fighter";
  return "healer"; // skin 1, and any unexpected value, defaults to healer
}

export const PLAYER_CLASS_INFO: Record<PlayerClass, { name: string; description: string }> = {
  healer: {
    name: "Healer",
    description: "Heal boxes fully restore you. Revives teammates in 3s instead of 5s.",
  },
  ninja: {
    name: "Ninja",
    description: "Moves 30% faster than everyone else.",
  },
  fighter: {
    name: "Fighter",
    description: "120 max HP. Starts with a shotgun (2 magazines) instead of the small gun.",
  },
};
