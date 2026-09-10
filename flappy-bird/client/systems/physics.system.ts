import type { Context } from "@nanoforge-dev/common";
import type { Entity, Registry, System } from "@nanoforge-dev/ecs-client";
import type { Image } from "@nanoforge-dev/graphics-2d";
import { PositionComponent, VelocityComponent } from "../components/bird.component";
import type { GameState } from "../game-state";

const GRAVITY = 1500;
const FLAP_VELOCITY = -430;
const MAX_FALL_SPEED = 640;

export function createPhysicsSystem(bird: Entity, birdNode: Image, state: GameState): System {
  return (registry: Registry, ctx: Context) => {
    if (!state.running || state.gameOver) {
      state.prevBirdY = state.currBirdY;
      state.prevBirdRotation = state.currBirdRotation;
      return;
    }

    const pos = registry.getEntityComponent(bird, new PositionComponent(0, 0)) as PositionComponent;
    const vel = registry.getEntityComponent(bird, new VelocityComponent(0)) as VelocityComponent;
    if (!pos || !vel) return;

    const dt = Math.min(ctx.app.delta / 1000, 1 / 30);
    vel.vy = Math.min(vel.vy + GRAVITY * dt, MAX_FALL_SPEED);
    pos.y += vel.vy * dt;

    const rect = { y: pos.y - birdNode.height() / 2 };
    if (rect.y < 0) {
      pos.y -= rect.y;
      if (vel.vy < 0) vel.vy = 0;
    }

    state.prevBirdY = state.currBirdY;
    state.currBirdY = pos.y;
    state.prevBirdRotation = state.currBirdRotation;
    state.currBirdRotation = Math.max(-25, Math.min(90, vel.vy / 8));
  };
}

export function flap(registry: Registry, bird: Entity): void {
  const vel = registry.getEntityComponent(bird, new VelocityComponent(0)) as VelocityComponent;
  if (vel) vel.vy = FLAP_VELOCITY;
}
