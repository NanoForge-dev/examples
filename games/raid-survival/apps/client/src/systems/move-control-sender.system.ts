import "@nanoforge-dev/network/client";
import { type ClientMessageOf, ClientPacket } from "@raid-survival/shared/protocol";

type MoveKey = "up" | "down" | "left" | "right";
import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";

import { MoveController } from "../components/move-controller.component";
import { Velocity } from "../components/velocity.component";

const compareStringArrays = (array1: string[], array2: string[]) => {
  if (array1.length !== array2.length) return false;
  for (let i = 0; i < array1.length; i++) if (array1[i] !== array2[i]) return false;
  return true;
};

export const sendMoveControl = (registry: Registry, ctx: Context) => {
  const entities = registry.getZipper([MoveController, Velocity]);

  entities.forEach(({ MoveController }) => {
    const keys: ClientMessageOf<"input"> & { moveKeys: MoveKey[] } = { type: "input", moveKeys: [] };
    if (MoveController.movingUp) keys.moveKeys.push("up");
    if (MoveController.movingDown) keys.moveKeys.push("down");
    if (MoveController.movingLeft) keys.moveKeys.push("left");
    if (MoveController.movingRight) keys.moveKeys.push("right");
    if (!compareStringArrays(keys.moveKeys, MoveController.lastMoveKeys))
      ctx.network.packets.send(ClientPacket, keys);
    MoveController.lastMoveKeys = keys.moveKeys;
  });
};
