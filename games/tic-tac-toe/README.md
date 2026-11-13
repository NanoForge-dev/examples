# tic-tac-toe

Tic-tac-toe for two players on one screen. Player 1 plays X and starts; the first to line up three
marks wins. A popup tells who won, or that it is a draw, and starts a new match.

| Control         | Action                        |
| --------------- | ----------------------------- |
| Click a cell    | Put your mark in it           |
| Click `Restart` | Start a new match (end popup) |

```sh
pnpm install
pnpm dev      # play it
pnpm editor   # open it in the editor
```

## How it is made

Two scenes (`src/scenes`), each with its entities written out in its `setup`:

| Scene      | Parent      | What                                                     |
| ---------- | ----------- | -------------------------------------------------------- |
| `Match`    | none        | The board, its nine `Cell` entities and whose turn it is |
| `EndPopup` | `"current"` | Loaded over `Match`: the result and the `Restart` button |

- The game state is in scene vars (`src/scene-vars.ts`): `player`, `result` and `over`.
- The mouse goes through the input library: `click2D` lights up the `Clickable2D` rectangle under
  the cursor and tells which one was clicked.
- `playCell` spawns the marks (`Marker` entities); `Match` removes them when it ends.
- `SceneVarText` shows a scene var in a text, `CenterText2D` centers a text on its position, and
  `DrawOrder2D` stacks the shapes (the popup over the board).
- The marker sound is a `SoundEffect` entity of `main.ts`, played with `ctx.sound.play("marker")`.

The files of `src` that are also in `shared/2d`, `shared/arcade` or `shared/scenes` are copies (see the
repository's README).

## Credits

`assets/marker.mp3` comes from the first version of this game, in this repository; its source is
not recorded.
