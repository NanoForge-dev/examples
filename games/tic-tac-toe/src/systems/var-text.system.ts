import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";

import { DrawableText2D } from "../components/drawable-text-2d.component";
import { VarText } from "../components/var-text.component";

/**
 * Writes the scene var of each `VarText` into its `DrawableText2D`.
 *
 * @system
 * @side client
 */
export const varText = (registry: Registry, ctx: Context) => {
  registry.getZipper([VarText, DrawableText2D]).forEach(({ VarText, DrawableText2D }) => {
    DrawableText2D.text = VarText.template.replace(
      "{}",
      String(ctx.scenes.vars.get(VarText.key) ?? ""),
    );
  });
};
