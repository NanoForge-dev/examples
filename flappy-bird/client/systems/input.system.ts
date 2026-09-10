import type { Registry, System } from "@nanoforge-dev/ecs-client";
import { InputEnum, type InputLibrary } from "@nanoforge-dev/input";

export function createInputSystem(input: InputLibrary, onFlap: () => void): System {
  let wasPressed = false;
  return (_registry: Registry) => {
    const pressed = Boolean(
      input.isKeyPressed(InputEnum.Space) || input.isKeyPressed(InputEnum.MouseLeft),
    );
    if (pressed && !wasPressed) {
      onFlap();
    }
    wasPressed = pressed;
  };
}
