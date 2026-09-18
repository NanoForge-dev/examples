import type { Registry } from "@nanoforge-dev/ecs-client";
import type { Context } from "@nanoforge-dev/common";
import { sceneManager } from "../main";

export function sceneSystem(registry: Registry, ctx: Context) {
  const scene = sceneManager.getScene()
  scene?.tick(registry, ctx);
}