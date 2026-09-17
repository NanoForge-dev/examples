import { Registry } from "@nanoforge-dev/ecs-client";
import { WaveHudComponent } from "../../components/wave-hud.component";

export function waveInfoPacketHandler(packet: any, registry: Registry): void {
  const entities: { WaveHudComponent: WaveHudComponent }[] = registry.getZipper([WaveHudComponent]);
  const hud = entities[0]?.WaveHudComponent;
  if (!hud) return;

  hud.waveText.text(`Wave ${packet.wave}/${packet.maxWaves}`);

  const fraction = packet.subWaveCount > 0 ? packet.subWave / packet.subWaveCount : 0;
  hud.progressFill.width(hud.progressTrack.width() * fraction);

  hud.aliveText.text(`${packet.aliveZombies} zombies`);

  if (packet.phase === "cooldown") {
    hud.countdownText.text(`Next round in ${packet.cooldownRemaining}s`);
    hud.countdownText.visible(true);
  } else {
    hud.countdownText.visible(false);
  }
}
