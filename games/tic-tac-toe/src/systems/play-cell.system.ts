import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";
import "@nanoforge-dev/sound";

import { Cell } from "../components/cell.component";
import { Clickable2D } from "../components/clickable-2d.component";
import { DrawOrder2D } from "../components/draw-order-2d.component";
import { DrawableCircle2D } from "../components/drawable-circle-2d.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Marker } from "../components/marker.component";
import { Position2D } from "../components/position-2d.component";

/** Room between a mark and the edges of its cell, as a part of the cell. */
const PADDING = 0.15;
/** Thickness of the bars of an X, in pixels. */
const BAR = 8;

/**
 * Puts the mark of the player whose turn it is in the empty cell they clicked, plays the marker
 * sound, and gives the turn to the other player.
 *
 * @system
 * @side client
 * @vars player, over
 */
export const playCell = (registry: Registry, ctx: Context) => {
  const vars = ctx.scenes.vars;
  if (vars.has("over")) return;

  registry
    .getZipper([Cell, Clickable2D, Position2D, DrawableRect2D])
    .forEach(({ Cell, Clickable2D, Position2D: place, DrawableRect2D: square }) => {
      if (!Clickable2D.clicked || Cell.mark) return;
      const player = vars.get("player") ?? 1;
      const size = square.width;
      const padding = size * PADDING;
      Cell.mark = player === 1 ? "X" : "O";

      if (Cell.mark === "O") {
        const disc = registry.spawnEntity();
        registry.addComponent(disc, new Position2D(place.x + size / 2, place.y + size / 2));
        registry.addComponent(disc, new DrawableCircle2D(size / 2 - padding, "#c084fc"));
        registry.addComponent(disc, new Marker());
        registry.addComponent(disc, new DrawOrder2D(3));
      } else {
        // Two bars along the diagonals, turned around their top-left corner: each one starts
        // half its thickness aside, so that it is centered on its diagonal.
        const length = (size - padding * 2) * Math.SQRT2;
        const shift = (BAR / 2) * Math.SQRT1_2;
        const bars = [
          { x: place.x + padding + shift, y: place.y + padding - shift, rotation: 45 },
          {
            x: place.x + size - padding + shift,
            y: place.y + padding + shift,
            rotation: 135,
          },
        ];
        for (const { x, y, rotation } of bars) {
          const bar = registry.spawnEntity();
          registry.addComponent(bar, new Position2D(x, y));
          registry.addComponent(
            bar,
            new DrawableRect2D(length, BAR, "#f87171", "", 1, rotation, BAR / 2),
          );
          registry.addComponent(bar, new Marker());
          registry.addComponent(bar, new DrawOrder2D(3));
        }
      }

      ctx.sound.play("marker");
      vars.set("player", player === 1 ? 2 : 1);
    });
};
