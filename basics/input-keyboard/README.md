# input-keyboard

Two squares, moved with the keyboard: the arrows move the red one, WASD the green one.

It shows the `input` engine library: `MoveController2D` names the keys that move an entity, and
the `moveControl2D` system reads them with `ctx.input.isKeyPressed` and sets the entity's
`Velocity2D`.

```sh
pnpm install
pnpm dev      # play it
pnpm editor   # open it in the editor
```

The files of `src/components` and `src/systems` are copies of `shared/2d` (see the repository's
README).
