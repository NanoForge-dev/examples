import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/input/controller";
import { Velocity2D } from "../components/velocity-2d.component";

import { ControllerMove2D } from "../components/controller-move-2d.component";

/**
 * Sets the `Velocity2D` of `ControllerMove2D` entities from their controller's left stick, twice
 * as fast while the boost button is held, and rumbles when it is pressed. Add it before `move2D`.
 *
 * @system
 * @side client
 */
export const controllerMove2D = (registry: Registry, ctx: Context) => {
  registry.getZipper([ControllerMove2D, Velocity2D]).forEach(({ ControllerMove2D, Velocity2D }) => {
    const { speed, controller, boost } = ControllerMove2D as ControllerMove2D;
    const stick = ctx.controller.getStick("left", controller);
    const factor = ctx.controller.isButtonPressed(boost, controller) ? 2 : 1;
    Velocity2D.x = stick.x * speed * factor;
    Velocity2D.y = stick.y * speed * factor;
    if (ctx.controller.isButtonJustPressed(boost, controller))
      void ctx.controller.vibrate({ duration: 150, strongMagnitude: 0.5 }, controller);
  });
};
