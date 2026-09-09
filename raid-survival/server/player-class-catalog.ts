// A player's class is derived entirely from their chosen skin (MenuScene's skin swatches,
// carried through joinLobby as `client.skin`, 1-3) - no separate class-selection UI exists, the
// skin picker IS the class picker. Stats/abilities here are what the request specified; the
// mapping itself (skin -> class) and every number below were invented for this feature, easy to
// retune.
export type PlayerClass = "healer" | "ninja" | "fighter";

export function classForSkin(skin: number): PlayerClass {
  if (skin === 2) return "ninja";
  if (skin === 3) return "fighter";
  return "healer"; // skin 1, and any unexpected value, defaults to healer
}

export const PLAYER_CLASS_CATALOG = {
  // Runs at normal speed; a heal box fully heals them instead of the usual flat amount
  // (loot-box-pickup.system.ts); revives a teammate in 3s instead of the 5s everyone else takes
  // (revive.system.ts) - the class channeling the revive is what sets the duration, not who's
  // being revived.
  healer: {
    maxHealth: 100,
    speedMultiplier: 1,
    reviveDurationSeconds: 3,
    healBoxFullHeal: true,
  },
  // 30% faster movement, otherwise identical to the baseline.
  ninja: {
    maxHealth: 100,
    speedMultiplier: 1.3,
    reviveDurationSeconds: 5,
    healBoxFullHeal: false,
  },
  // Tankier (120 max HP vs the 100 baseline) and spawns with a shotgun (2 magazines' worth of
  // ammo) instead of smallGun - see start-game-packet.handler.ts's spawn code, which reads
  // maxHealth from here but derives the starting-weapon grant itself (a class catalog entry alone
  // can't express "which weapon", since only fighter overrides it).
  fighter: {
    maxHealth: 120,
    speedMultiplier: 1,
    reviveDurationSeconds: 5,
    healBoxFullHeal: false,
  },
} as const;
