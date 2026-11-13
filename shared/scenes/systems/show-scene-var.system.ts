import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";

import { DrawableText2D } from "../components/drawable-text-2d.component";
import { SceneVarText } from "../components/scene-var-text.component";

/**
 * Writes the var of every `SceneVarText` in its entity's `DrawableText2D`, through its template;
 * a var that does not exist shows as `-`.
 *
 * @system
 * @side client
 */
export const showSceneVar = (registry: Registry, ctx: Context) => {
  registry.getZipper([SceneVarText, DrawableText2D]).forEach(({ SceneVarText, DrawableText2D }) => {
    const { variable, template } = SceneVarText as SceneVarText;
    DrawableText2D.text = template.replace("{}", String(ctx.scenes.vars.get(variable) ?? "-"));
  });
};
