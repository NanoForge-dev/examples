import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { type InputLibrary } from "@nanoforge-dev/input";

import { ReviveController } from "../components/revive-controller.component";
import { BuildModeComponent } from "../components/build-mode.component";

// Plain level-triggered poll of the revive key (hold-to-channel, unlike reload's edge-detected
// one-shot press) - server-authoritative range/timing lives entirely in revive.system.ts; this
// only reports "is the local player holding E right now".
export function reviveControlSystem(registry: Registry, ctx: Context) {
  const entities: { ReviveController: ReviveController }[] = registry.getZipper([ReviveController]);
  if (entities.length === 0) return;

  const input = ctx.libs.getInput<InputLibrary>();

  const buildModeEntities: { BuildModeComponent: BuildModeComponent }[] = registry.getZipper([
    BuildModeComponent,
  ]);
  const buildModeActive = buildModeEntities[0]?.BuildModeComponent.active ?? false;

  entities.forEach(({ ReviveController }) => {
    // Same guard shoot-control.system.ts applies to its own inputs - a key meant for the build
    // bar must not also start a revive channel.
    const held = buildModeActive ? false : !!input.isKeyPressed(ReviveController.keyRevive);

    // Edge-detected companion to the held state below - a fresh press (not held last tick, held
    // now) requests the instant tower heal/upgrade action, same E key. isKeyPressed alone is
    // level/held, not "just pressed" (see shoot-control.system.ts's identical reload edge-detect).
    if (held && !ReviveController.wasHeld) {
      ReviveController.interactRequested = true;
    }
    ReviveController.wasHeld = held;
    ReviveController.held = held;
  });
}

// * Required to generate code
export default reviveControlSystem.name;
