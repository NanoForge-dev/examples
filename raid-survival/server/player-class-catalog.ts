// A player's class is derived entirely from their chosen skin (MenuScene's skin swatches,
// carried through joinLobby as `client.skin`, 1-3) - the skin picker IS the class picker.
export type PlayerClass = "healer" | "ninja" | "fighter";

export function classForSkin(skin: number): PlayerClass {
  if (skin === 2) return "ninja";
  if (skin === 3) return "fighter";
  return "healer"; // skin 1, and any unexpected value, defaults to healer
}

export const PLAYER_CLASS_CATALOG = {
  // Heal box fully heals instead of the flat amount (loot-box-pickup.system.ts); revives a
  // teammate in 3s instead of 5s (revive.system.ts, reviver's class sets the duration).
  healer: {
    maxHealth: 100,
    speedMultiplier: 1,
    reviveDurationSeconds: 3,
    healBoxFullHeal: true,
  },
  ninja: {
    maxHealth: 100,
    speedMultiplier: 1.3,
    reviveDurationSeconds: 5,
    healBoxFullHeal: false,
  },
  // Spawns with a shotgun instead of smallGun - see start-game-packet.handler.ts's spawn code.
  fighter: {
    maxHealth: 120,
    speedMultiplier: 1,
    reviveDurationSeconds: 5,
    healBoxFullHeal: false,
  },
} as const;
