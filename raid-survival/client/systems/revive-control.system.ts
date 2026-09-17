import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { type InputLibrary } from "@nanoforge-dev/input";

import { ReviveController } from "../components/revive-controller.component";
import { BuildModeComponent } from "../components/build-mode.component";

// Hold-to-channel poll of the revive key - server-authoritative range/timing lives in
// revive.system.ts; this only reports whether the local player is holding E right now.
export function reviveControlSystem(registry: Registry, ctx: Context) {
  const entities: { ReviveController: ReviveController }[] = registry.getZipper([ReviveController]);
  if (entities.length === 0) return;

  const input = ctx.libs.getInput<InputLibrary>();

  const buildModeEntities: { BuildModeComponent: BuildModeComponent }[] = registry.getZipper([
    BuildModeComponent,
  ]);
  const buildModeActive = buildModeEntities[0]?.BuildModeComponent.active ?? false;

  entities.forEach(({ ReviveController }) => {
    // Same build-mode guard shoot-control.system.ts applies to its own inputs.
    const held = buildModeActive ? false : !!input.isKeyPressed(ReviveController.keyRevive);

    // Edge-detected: a fresh E press (not held last tick) requests the one-shot interact action.
    if (held && !ReviveController.wasHeld) {
      ReviveController.interactRequested = true;
    }
    ReviveController.wasHeld = held;
    ReviveController.held = held;
  });
}

// * Required to generate code
export default reviveControlSystem.name;
