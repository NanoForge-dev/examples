# input-gamepad

A square moved with a controller's left stick; holding A doubles its speed and pressing it makes
the controller rumble. The bottom line names the connected controller.

It shows the controller side of the `input` engine library (`@nanoforge-dev/input/controller`):
`ControllerLibrary` polls the Gamepad API every frame, and the systems read `ctx.controller`:
`getStick` (with the deadzone applied), `isButtonPressed`, `isButtonJustPressed`, `vibrate` and
`getController`. Buttons follow the standard layout (`ControllerButton.A` is the bottom face
button, Cross on PlayStation).

Browsers only show a controller to the page after one of its buttons is pressed.

```sh
pnpm install
pnpm dev      # play it
pnpm editor   # open it in the editor
```

`image-fill.ts`, the `Position2D`, `Velocity2D`, `Acceleration2D`, `DrawableRect2D`,
`DrawableCircle2D` and `DrawableText2D` components and the `draw2D` and `move2D` systems are
copies of `shared/2d` (see the repository's README).
