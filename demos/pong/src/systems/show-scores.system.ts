import type { Registry } from "@nanoforge-dev/ecs";

import { DrawableText2D } from "../components/drawable-text-2d.component";
import { Goal } from "../components/goal.component";
import { ScoreText } from "../components/score-text.component";

/**
 * Writes each player's points in their `ScoreText`.
 *
 * @system
 * @side client
 */
export const showScores = (registry: Registry) => {
  const goals = registry.getZipper([Goal]);

  registry.getZipper([ScoreText, DrawableText2D]).forEach(({ ScoreText, DrawableText2D }) => {
    const goal = goals.find(({ Goal }) => Goal.player === ScoreText.player);
    if (goal) DrawableText2D.text = `${goal.Goal.points}`;
  });
};
