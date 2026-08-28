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
    if (ShootController.mainWeaponShooting) network.tcp.sendData(new TextEncoder().encode(JSON.stringify({ type: "input", key: "mainWeaponShooting" })));
    if (ShootController.secondWeaponShooting) network.tcp.sendData(new TextEncoder().encode(JSON.stringify({ type: "input", key: "secondWeaponShooting" })));
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
