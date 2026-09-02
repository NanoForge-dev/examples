import { sceneManager } from "../../main";
import { GameOverScene } from "../../scenes/GameOverScene";

export function gameOverPacketHandler(packet: any): void {
  sceneManager.switchTo(new GameOverScene(packet.zombiesKilled));
}
