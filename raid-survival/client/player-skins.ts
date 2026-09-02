// Four player sprites (player1.png..player4.png) share the same player-animations.txt frame
// layout, so any of them can drop straight into SpriteComponent's spriteKey interchangeably -
// picking a different one per player is purely cosmetic, no server-side data needed.
export const PLAYER_SKINS = ["player1.png", "player2.png", "player3.png", "player4.png"];

export function pickPlayerSkin(index: number): string {
  const safeIndex = ((index % PLAYER_SKINS.length) + PLAYER_SKINS.length) % PLAYER_SKINS.length;
  return PLAYER_SKINS[safeIndex] ?? "player1.png";
}
