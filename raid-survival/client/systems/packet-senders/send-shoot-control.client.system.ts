import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Velocity } from "../../components/velocity.component";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";
import { ShootController } from "../../components/shoot.controller";

export function sendShootControl(registry: Registry, ctx: Context) {
  const entities = registry.getZipper([ShootController, Velocity]);
  const network = ctx.libs.getNetwork<NetworkClientLibrary>()

  entities.forEach(({ ShootController }) => {
    if (ShootController.mainWeaponShooting) network.tcp.sendData(new TextEncoder().encode(JSON.stringify({ type: "input", key: "mainWeaponShooting" })));
    if (ShootController.secondWeaponShooting) network.tcp.sendData(new TextEncoder().encode(JSON.stringify({ type: "input", key: "secondWeaponShooting" })));
    network.tcp.sendData(
      new TextEncoder().encode(
        JSON.stringify({
          type: "input",
          shootDirection: { x: ShootController.position.x, y: ShootController.position.y },
        }),
      ),
    );
  });
}
// * Required to generate code
export default sendShootControl.name;
