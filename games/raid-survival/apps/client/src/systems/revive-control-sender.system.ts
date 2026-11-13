import "@nanoforge-dev/network/client";
import { ClientPacket } from "@raid-survival/shared/protocol";
import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";

import { ReviveController } from "../components/revive-controller.component";

/**
 * Sends the revive key's state to the server when it changes, and a fresh E press once.
 *
 * @system
 * @side client
 */
export const sendReviveControl = (registry: Registry, ctx: Context) => {
  const entities: { ReviveController: ReviveController }[] = registry.getZipper([ReviveController]);

  entities.forEach(({ ReviveController }) => {
    // Sent only on change - the server recomputes range/progress every tick regardless.
    if (ReviveController.held !== ReviveController.lastSentHeld) {
      ctx.network.packets.send(ClientPacket, {
        type: "input",
        reviveKeyHeld: ReviveController.held,
      });
      ReviveController.lastSentHeld = ReviveController.held;
    }

    // One-shot: sent once per fresh E press, then cleared.
    if (ReviveController.interactRequested) {
      ctx.network.packets.send(ClientPacket, { type: "input", interactRequested: true });
      ReviveController.interactRequested = false;
    }
  });
};
