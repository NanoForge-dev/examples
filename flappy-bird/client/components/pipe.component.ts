import type { Component, Entity } from "@nanoforge-dev/ecs-client";
import type { Group } from "@nanoforge-dev/graphics-2d";

export interface HitRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PipeComponent implements Component {
  name = this.constructor.name;
  scored: boolean;
  prevX: number;
  hitTop: HitRect;
  hitBottom: HitRect;
  constructor(
    public entity: Entity,
    public x: number,
    topY: number,
    topHeight: number,
    pipeWidth: number,
    bottomY: number,
    bottomHeight: number,
    public topGroup: Group,
    public bottomGroup: Group,
  ) {
    this.scored = false;
    this.prevX = x;
    this.hitTop = { x, y: topY, width: pipeWidth, height: topHeight };
    this.hitBottom = { x, y: bottomY, width: pipeWidth, height: bottomHeight };
  }
}
