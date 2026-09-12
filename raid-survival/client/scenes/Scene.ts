import { Registry } from "@nanoforge-dev/ecs-client";
import { Layer, Stage } from "@nanoforge-dev/graphics-2d";
import {Context} from "@nanoforge-dev/common";

export interface Scene {
  readonly name: string;
  layer: Layer | undefined;

  load(registry: Registry, stage: Stage): void;
  unload?(registry: Registry, stage: Stage): void;
  tick(registry: Registry, ctx: Context): void;
}
