# input-mouse

A dot follows the mouse, two squares can be dragged with the left button, and a line at the
bottom shows the cursor position and the number of left clicks.

It shows the mouse side of the `input` engine library:

- `followMouse2D` reads `ctx.input.getMousePosition()` (in game coordinates);
- `drag2D` reads `ctx.input.getDragState()`: a drag that starts on a `Draggable2D` rectangle
  carries it until the button is released;
- `showMouseReadout` counts clicks with `ctx.input.isKeyPressed(InputEnum.MouseLeft)`.

```sh
pnpm install
pnpm dev      # play it
pnpm editor   # open it in the editor
```

`image-fill.ts`, the `Position2D`, `DrawableRect2D`, `DrawableCircle2D` and `DrawableText2D`
components and the `draw2D` system are copies of `shared/2d` (see the repository's README).
