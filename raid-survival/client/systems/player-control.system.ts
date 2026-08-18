import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { LocalPlayerComponent, PlayerComponent } from "../components/player.component";
import { VelocityComponent } from "../components/velocity.component";
import { InputEnum, InputLibrary } from "@nanoforge-dev/input";
import { RenderableComponent } from "../components/renderable.component";
import { PositionComponent } from "../components/position.component";

const SPEED = 200;

export const playerControlSystem = (registry: Registry, ctx: Context) => {
  const entities: {
    LocalPlayerComponent: LocalPlayerComponent;
    PlayerComponent: PlayerComponent;
    VelocityComponent: VelocityComponent;
  }[] = registry.getZipper([LocalPlayerComponent, PlayerComponent, VelocityComponent]);
  const input = ctx.libs.getInput<InputLibrary>()

  for (const entity of entities) {
    let dx = 0;
    let dy = 0;

    if (input.isKeyPressed(InputEnum.KeyW) || input.isKeyPressed(InputEnum.ArrowUp)) dy -= 1;
    if (input.isKeyPressed(InputEnum.KeyS) || input.isKeyPressed(InputEnum.ArrowDown)) dy += 1;
    if (input.isKeyPressed(InputEnum.KeyA) || input.isKeyPressed(InputEnum.ArrowLeft)) dx -= 1;
    if (input.isKeyPressed(InputEnum.KeyD) || input.isKeyPressed(InputEnum.ArrowRight)) dx += 1;

    const len = Math.hypot(dx, dy) || 1;
    entity.VelocityComponent.x = (dx / len) * SPEED;
    entity.VelocityComponent.y = (dy / len) * SPEED;

    if (entity.PlayerComponent) entity.PlayerComponent.target = input.getMousePosition();
  }
};

export const playerAnimationSystem = (registry: Registry) => {
  const entities: {
    PlayerComponent: PlayerComponent;
    RenderableComponent: RenderableComponent;
    VelocityComponent: VelocityComponent;
    PositionComponent: PositionComponent;
  }[] = registry.getZipper([
    PlayerComponent,
    RenderableComponent,
    VelocityComponent,
    PositionComponent,
  ]);

  for (const entity of entities) {
    if (!entity.RenderableComponent.sprite) continue;
    if (
      entity.VelocityComponent.y != 0 ||
      (entity.VelocityComponent.x != 0 && entity.RenderableComponent.getAnimation() != "walk")
    ) {
      entity.RenderableComponent.setAnimation("walk");
    } else if (entity.VelocityComponent.x == 0 && entity.RenderableComponent.getAnimation() != "idle") {
      entity.RenderableComponent.setAnimation("idle");
    }

    if (entity.PlayerComponent.target.x < entity.PositionComponent.x && !entity.RenderableComponent.isFlipped()) {
      entity.RenderableComponent.flip();
    } else if (
      entity.PlayerComponent.target.x > entity.PositionComponent.x &&
      entity.RenderableComponent.isFlipped()
    ) {
      entity.RenderableComponent.unflip();
    }
  }
}

// * Required to generate code
export default playerControlSystem.name;
