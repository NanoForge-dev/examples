import type { Component } from "@nanoforge-dev/ecs-client";

export class PositionComponent implements Component {
  name = this.constructor.name;
  constructor(
    public x: number,
    public y: number,
  ) {}
}

export class VelocityComponent implements Component {
  name = this.constructor.name;
  constructor(public vy: number) {}
}

export class BirdComponent implements Component {
  name = this.constructor.name;
}
