import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { DrawableText2D } from "../components/drawable-text-2d.component";
import { HudText } from "../components/hud-text.component";

const LABELS = { score: "Score", lives: "Lives", level: "Level", best: "Best score" } as const;

/**
 * Writes the var each `HudText` shows: the score, the lives, the level or the best score.
 *
 * @system
 * @side client
 */
export const updateHud = (registry: Registry, ctx: Context) => {
  registry.getZipper([HudText, DrawableText2D]).forEach(({ HudText, DrawableText2D }) => {
    const show = (HudText as HudText).show;
    DrawableText2D.text = `${LABELS[show]} ${ctx.scenes.vars.get(show) ?? "-"}`;
  });
};
