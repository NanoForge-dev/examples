import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Velocity } from "../../components/essentials/velocity.component";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";
import { ShootController } from "../../components/shoot.controller";
import { Direction } from "../../components/direction.component";
import { Vector2d } from "@nanoforge-dev/graphics-2d";

export function sendShootControl(registry: Registry, ctx: Context) {
  const entities: { ShootController: ShootController; Velocity: Vector2d; Direction: Direction }[] =
    registry.getZipper([ShootController, Velocity, Direction]);
  const network = ctx.libs.getNetwork<NetworkClientLibrary>();

  entities.forEach(({ ShootController, Direction }) => {
    // Only send "shooting" on change - the server recomputes firing/cooldown every tick regardless.
    if (ShootController.shooting !== ShootController.lastSentShooting) {
      network.tcp.sendData(
        new TextEncoder().encode(
          JSON.stringify({ type: "input", shooting: ShootController.shooting }),
        ),
      );
      ShootController.lastSentShooting = ShootController.shooting;
    }

    if (ShootController.reloadRequested) {
      network.tcp.sendData(
        new TextEncoder().encode(JSON.stringify({ type: "input", reload: true })),
      );
      ShootController.reloadRequested = false;
    }

    // `direction` is now purely visual - the server recomputes the actual aim vector from
    // `mousePosition` at the exact moment a shot fires, so it's never stale by even one packet.
    network.tcp.sendData(
      new TextEncoder().encode(
        JSON.stringify({
          type: "input",
          direction: { x: Direction.x, y: Direction.y },
          mousePosition: { x: ShootController.position.x, y: ShootController.position.y },
        }),
      ),
    );
  });
}
// * Required to generate code
export default sendShootControl.name;
