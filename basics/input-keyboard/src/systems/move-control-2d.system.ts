import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/input";
import { Velocity2D } from "../components/velocity-2d.component";

import { MoveController2D } from "../components/move-controller-2d.component";

/**
 * Sets the `Velocity2D` of `MoveController2D` entities from the keys held down. Add it before
 * `move2D`.
 *
 * @system
 * @side client
 */
export const moveControl2D = (registry: Registry, ctx: Context) => {
  const held = (key: MoveController2D["left"]) => Number(ctx.input.isKeyPressed(key) === true);

  registry.getZipper([MoveController2D, Velocity2D]).forEach(({ MoveController2D, Velocity2D }) => {
    const { speed, axes, left, right, up, down } = MoveController2D as MoveController2D;
    if (axes !== "vertical") Velocity2D.x = (held(right) - held(left)) * speed;
    if (axes !== "horizontal") Velocity2D.y = (held(down) - held(up)) * speed;
  });
};
