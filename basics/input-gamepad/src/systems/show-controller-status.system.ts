import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/input/controller";
import { DrawableText2D } from "../components/drawable-text-2d.component";

import { ControllerStatus } from "../components/controller-status.component";

/**
 * Writes the name of the watched controller, or how to connect one, in the text of every
 * `ControllerStatus` entity.
 *
 * @system
 * @side client
 */
export const showControllerStatus = (registry: Registry, ctx: Context) => {
  registry
    .getZipper([ControllerStatus, DrawableText2D])
    .forEach(({ ControllerStatus, DrawableText2D }) => {
      const index = (ControllerStatus as ControllerStatus).controller;
      const state = ctx.controller.getController(index);
      DrawableText2D.text = state
        ? `Controller ${index + 1}: ${state.id}`
        : `Controller ${index + 1}: plug it in and press a button`;
    });
};
