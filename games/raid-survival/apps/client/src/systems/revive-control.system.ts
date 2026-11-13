import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";
import "@nanoforge-dev/input";

import { BuildModeComponent } from "../components/build-mode.component";
import { ReviveController } from "../components/revive-controller.component";

/**
 * Hold-to-channel poll of the revive key - server-authoritative range/timing lives in
 * revive.system.ts; this only reports whether the local player is holding E right now.
 *
 * @system
 * @side client
 */
export const reviveControlSystem = (registry: Registry, ctx: Context) => {
  const entities: { ReviveController: ReviveController }[] = registry.getZipper([ReviveController]);
  if (entities.length === 0) return;

  const input = ctx.input;

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
};
