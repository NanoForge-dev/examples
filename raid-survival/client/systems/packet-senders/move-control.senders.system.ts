import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { MoveController } from "../../components/move-controller.component";
import { Velocity } from "../../components/essentials/velocity.component";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";

function compareStringArrays(array1: string[], array2: string[]) {
  if (array1.length !== array2.length) return false;
  for (let i = 0; i < array1.length; i++) if (array1[i] !== array2[i]) return false;
  return true;
}

export function sendMoveControl(registry: Registry, ctx: Context) {
  const entities = registry.getZipper([MoveController, Velocity]);
  const network = ctx.libs.getNetwork<NetworkClientLibrary>();

  entities.forEach(({ MoveController }) => {
    const keys: { type: string; moveKeys: string[] } = { type: "input", moveKeys: [] };
    if (MoveController.movingUp) keys.moveKeys.push("up");
    if (MoveController.movingDown) keys.moveKeys.push("down");
    if (MoveController.movingLeft) keys.moveKeys.push("left");
    if (MoveController.movingRight) keys.moveKeys.push("right");
    if (!compareStringArrays(keys.moveKeys, MoveController.lastMoveKeys))
      network.tcp.sendData(new TextEncoder().encode(JSON.stringify(keys)));
    MoveController.lastMoveKeys = keys.moveKeys;
  });
}
// * Required to generate code
export default sendMoveControl.name;
