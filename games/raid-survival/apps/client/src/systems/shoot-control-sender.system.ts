import "@nanoforge-dev/network/client";
import { ClientPacket } from "@raid-survival/shared/protocol";
import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";
import type { Vector } from "@raid-survival/shared/protocol";

import { Velocity2D } from "../components/velocity-2d.component";
import { ShootController } from "../components/shoot-controller.component";
import { Direction } from "../components/direction.component";

/**
 * Sends the local player's shooting state, reload requests and aim (direction and mouse position)
 * to the server.
 *
 * @system
 * @side client
 */
export const sendShootControl = (registry: Registry, ctx: Context) => {
  const entities: { ShootController: ShootController; Velocity2D: Vector; Direction: Direction }[] =
    registry.getZipper([ShootController, Velocity2D, Direction]);

  entities.forEach(({ ShootController, Direction }) => {
    // Only send "shooting" on change - the server recomputes firing/cooldown every tick regardless.
    if (ShootController.shooting !== ShootController.lastSentShooting) {
      ctx.network.packets.send(ClientPacket, { type: "input", shooting: ShootController.shooting });
      ShootController.lastSentShooting = ShootController.shooting;
    }

    if (ShootController.reloadRequested) {
      ctx.network.packets.send(ClientPacket, { type: "input", reload: true });
      ShootController.reloadRequested = false;
    }

    // `direction` is now purely visual - the server recomputes the actual aim vector from
    // `mousePosition` at the exact moment a shot fires, so it's never stale by even one packet.
    ctx.network.packets.send(ClientPacket, {
      type: "input",
      direction: { x: Direction.x, y: Direction.y },
      mousePosition: { x: ShootController.position.x, y: ShootController.position.y },
    });
  });
};
