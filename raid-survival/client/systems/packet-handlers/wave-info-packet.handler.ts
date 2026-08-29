import { Registry } from "@nanoforge-dev/ecs-client";
import { WaveHudComponent } from "../../components/wave-hud.component";

export function waveInfoPacketHandler(packet: any, registry: Registry): void {
  const entities: { WaveHudComponent: WaveHudComponent }[] = registry.getZipper([WaveHudComponent]);
  const hud = entities[0]?.WaveHudComponent;
  if (!hud) return;

  hud.waveText.text(`Wave ${packet.wave}/${packet.maxWaves}`);

  // Rect geometry is anchored at its own (x, y) top-left, unlike Sprite scaling - no center-
  // anchor compensation needed here (contrast hit-packet.handler.ts's health bar fill).
  const fraction = packet.subWaveCount > 0 ? packet.subWave / packet.subWaveCount : 0;
  hud.progressFill.width(hud.progressTrack.width() * fraction);

  hud.aliveText.text(`${packet.aliveZombies} zombies`);
}
