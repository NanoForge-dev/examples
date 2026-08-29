import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Velocity } from "../../components/essentials/velocity.component";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";
import { ShootController } from "../../components/shoot.controller";
import { Direction } from "../../components/direction.component";
import { Vector2d } from "@nanoforge-dev/graphics-2d";

export function sendShootControl(registry: Registry, ctx: Context) {
  const entities: { ShootController: ShootController, Velocity: Vector2d, Direction: Direction }[] = registry.getZipper([
    ShootController,
    Velocity,
    Direction,
  ]);
  const network = ctx.libs.getNetwork<NetworkClientLibrary>()

  entities.forEach(({ ShootController, Direction }) => {
    // Only send "shooting" when it actually changes - weapon.system.ts (server) recomputes
    // firing/cooldown every tick from the persisted state regardless of packet frequency, so
    // sending this every single frame the button is held (the old behavior) was pure waste, the
    // same inefficiency move-control.senders.system.ts already avoids for move keys.
    if (ShootController.mainWeaponShooting !== ShootController.lastSentMainWeaponShooting) {
      network.tcp.sendData(
        new TextEncoder().encode(JSON.stringify({ type: "input", shooting: ShootController.mainWeaponShooting })),
      );
      ShootController.lastSentMainWeaponShooting = ShootController.mainWeaponShooting;
    }

    if (ShootController.reloadRequested) {
      network.tcp.sendData(new TextEncoder().encode(JSON.stringify({ type: "input", reload: true })));
      ShootController.reloadRequested = false;
    }

    network.tcp.sendData(
      new TextEncoder().encode(
        JSON.stringify({
          type: "input",
          direction: { x: Direction.x, y: Direction.y },
        }),
      ),
    );
  });
}
// * Required to generate code
export default sendShootControl.name;
