import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { Cell } from "../components/cell.component";
import { CenterText2D } from "../components/center-text-2d.component";
import { Clickable2D } from "../components/clickable-2d.component";
import { DrawOrder2D } from "../components/draw-order-2d.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { DrawableText2D } from "../components/drawable-text-2d.component";
import { Marker } from "../components/marker.component";
import { Position2D } from "../components/position-2d.component";
import { SceneVarText } from "../components/scene-var-text.component";
import { checkEnd } from "../systems/check-end.system";
import { playCell } from "../systems/play-cell.system";

/**
 * A match: the board, its nine cells and whose turn it is. Player 1 plays X and starts.
 *
 * @scene
 * @side client
 * @vars player, result
 */
export class Match extends EcsScene {
  override setup(registry: Registry, ctx: Context) {
    ctx.scenes.vars.init("player", 1);
    ctx.scenes.vars.init("result", "");

    const background = registry.spawnEntity();
    registry.addComponent(background, new Position2D(0, 0));
    registry.addComponent(background, new DrawableRect2D(700, 700, "#161625"));
    registry.addComponent(background, new DrawOrder2D(0));

    const turn = registry.spawnEntity();
    registry.addComponent(turn, new Position2D(350, 80));
    registry.addComponent(turn, new DrawableText2D("Player 1's turn", 24, "#c5b6d6"));
    registry.addComponent(turn, new SceneVarText("player", "Player {}'s turn"));
    registry.addComponent(turn, new CenterText2D());
    registry.addComponent(turn, new DrawOrder2D(3));

    const board = registry.spawnEntity();
    registry.addComponent(board, new Position2D(100, 140));
    registry.addComponent(board, new DrawableRect2D(500, 500, "#4c2a85", "", 1, 0, 15));
    registry.addComponent(board, new DrawOrder2D(1));

    const cell11 = registry.spawnEntity();
    registry.addComponent(cell11, new Position2D(112.5, 152.5));
    registry.addComponent(cell11, new DrawableRect2D(150, 150, "#23233a", "", 1, 0, 15));
    registry.addComponent(cell11, new Cell(0, 0));
    registry.addComponent(cell11, new Clickable2D("#23233a", "#2e2e4d"));
    registry.addComponent(cell11, new DrawOrder2D(2));

    const cell12 = registry.spawnEntity();
    registry.addComponent(cell12, new Position2D(275, 152.5));
    registry.addComponent(cell12, new DrawableRect2D(150, 150, "#23233a", "", 1, 0, 15));
    registry.addComponent(cell12, new Cell(0, 1));
    registry.addComponent(cell12, new Clickable2D("#23233a", "#2e2e4d"));
    registry.addComponent(cell12, new DrawOrder2D(2));

    const cell13 = registry.spawnEntity();
    registry.addComponent(cell13, new Position2D(437.5, 152.5));
    registry.addComponent(cell13, new DrawableRect2D(150, 150, "#23233a", "", 1, 0, 15));
    registry.addComponent(cell13, new Cell(0, 2));
    registry.addComponent(cell13, new Clickable2D("#23233a", "#2e2e4d"));
    registry.addComponent(cell13, new DrawOrder2D(2));

    const cell21 = registry.spawnEntity();
    registry.addComponent(cell21, new Position2D(112.5, 315));
    registry.addComponent(cell21, new DrawableRect2D(150, 150, "#23233a", "", 1, 0, 15));
    registry.addComponent(cell21, new Cell(1, 0));
    registry.addComponent(cell21, new Clickable2D("#23233a", "#2e2e4d"));
    registry.addComponent(cell21, new DrawOrder2D(2));

    const cell22 = registry.spawnEntity();
    registry.addComponent(cell22, new Position2D(275, 315));
    registry.addComponent(cell22, new DrawableRect2D(150, 150, "#23233a", "", 1, 0, 15));
    registry.addComponent(cell22, new Cell(1, 1));
    registry.addComponent(cell22, new Clickable2D("#23233a", "#2e2e4d"));
    registry.addComponent(cell22, new DrawOrder2D(2));

    const cell23 = registry.spawnEntity();
    registry.addComponent(cell23, new Position2D(437.5, 315));
    registry.addComponent(cell23, new DrawableRect2D(150, 150, "#23233a", "", 1, 0, 15));
    registry.addComponent(cell23, new Cell(1, 2));
    registry.addComponent(cell23, new Clickable2D("#23233a", "#2e2e4d"));
    registry.addComponent(cell23, new DrawOrder2D(2));

    const cell31 = registry.spawnEntity();
    registry.addComponent(cell31, new Position2D(112.5, 477.5));
    registry.addComponent(cell31, new DrawableRect2D(150, 150, "#23233a", "", 1, 0, 15));
    registry.addComponent(cell31, new Cell(2, 0));
    registry.addComponent(cell31, new Clickable2D("#23233a", "#2e2e4d"));
    registry.addComponent(cell31, new DrawOrder2D(2));

    const cell32 = registry.spawnEntity();
    registry.addComponent(cell32, new Position2D(275, 477.5));
    registry.addComponent(cell32, new DrawableRect2D(150, 150, "#23233a", "", 1, 0, 15));
    registry.addComponent(cell32, new Cell(2, 1));
    registry.addComponent(cell32, new Clickable2D("#23233a", "#2e2e4d"));
    registry.addComponent(cell32, new DrawOrder2D(2));

    const cell33 = registry.spawnEntity();
    registry.addComponent(cell33, new Position2D(437.5, 477.5));
    registry.addComponent(cell33, new DrawableRect2D(150, 150, "#23233a", "", 1, 0, 15));
    registry.addComponent(cell33, new Cell(2, 2));
    registry.addComponent(cell33, new Clickable2D("#23233a", "#2e2e4d"));
    registry.addComponent(cell33, new DrawOrder2D(2));

    registry.addSystem(playCell);
    registry.addSystem(checkEnd);
  }

  /** Removes the marks: `playCell` spawned them, so the scene doesn't own them. */
  override teardown(registry: Registry, _ctx: Context) {
    registry.getIndexedZipper([Marker]).forEach(({ id }) => {
      registry.killEntity(registry.entityFromIndex(id));
    });
  }
}
