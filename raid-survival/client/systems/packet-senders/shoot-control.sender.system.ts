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

    // Same dedup as mainWeaponShooting above - this is the one missing piece that makes the
    // already-wired right-click input (ShootController.secondWeaponShooting,
    // shoot-control.system.ts) actually reach the server.
    if (ShootController.secondWeaponShooting !== ShootController.lastSentSecondWeaponShooting) {
      network.tcp.sendData(
        new TextEncoder().encode(
          JSON.stringify({ type: "input", rightShooting: ShootController.secondWeaponShooting }),
        ),
      );
      ShootController.lastSentSecondWeaponShooting = ShootController.secondWeaponShooting;
    }

    if (ShootController.reloadRequested) {
      network.tcp.sendData(new TextEncoder().encode(JSON.stringify({ type: "input", reload: true })));
      ShootController.reloadRequested = false;
    }

    // `direction` is purely visual from here on (rotation broadcast to other clients) -
    // weapon.system.ts (server) no longer aims bullets with it. `mousePosition` (world-space,
    // same coordinate space Position/Hitbox already live in - see shoot-control.system.ts, which
    // computes both from the same getRelativePointerPosition() call) is what the server
    // recomputes a fresh aim vector from at the exact moment a shot fires, so a shot can never
    // use a Direction value that's gone stale relative to the mouse by even one packet.
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
