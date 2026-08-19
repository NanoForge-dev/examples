import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Position } from "../components/position.component";
import { Clickable } from "../components/clickable.component";
import { InputEnum, InputLibrary } from "@nanoforge-dev/input";

export function clickableSystem(registry: Registry, ctx: Context) {
  const entities = registry.getZipper([Position, Clickable]);
  const input = ctx.libs.getInput<InputLibrary>();
  const p = input.getMousePosition();

  if (!p) return;

  entities.forEach(({ Position, Clickable }) => {
    if (
      p.x > Position.x &&
      p.y > Position.y &&
      p.x < Position.x + Clickable.size.x &&
      p.y < Position.y + Clickable.size.y &&
      input.isKeyPressed(InputEnum.MouseLeft)
    ) {
      Clickable.onClick();
    }
  });
}
// * Required to generate code
export default clickableSystem.name;
