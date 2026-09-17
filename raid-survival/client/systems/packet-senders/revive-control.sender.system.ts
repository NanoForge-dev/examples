import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";

import { ReviveController } from "../../components/revive-controller.component";

export function sendReviveControl(registry: Registry, ctx: Context) {
  const entities: { ReviveController: ReviveController }[] = registry.getZipper([ReviveController]);
  const network = ctx.libs.getNetwork<NetworkClientLibrary>();

  entities.forEach(({ ReviveController }) => {
    // Sent only on change - the server recomputes range/progress every tick regardless.
    if (ReviveController.held !== ReviveController.lastSentHeld) {
      network.tcp.sendData(
        new TextEncoder().encode(
          JSON.stringify({ type: "input", reviveKeyHeld: ReviveController.held }),
        ),
      );
      ReviveController.lastSentHeld = ReviveController.held;
    }

    // One-shot: sent once per fresh E press, then cleared.
    if (ReviveController.interactRequested) {
      network.tcp.sendData(
        new TextEncoder().encode(JSON.stringify({ type: "input", interactRequested: true })),
      );
      ReviveController.interactRequested = false;
    }
  });
}
// * Required to generate code
export default sendReviveControl.name;
