# flappy-bird

Flappy Bird: the bird falls, you flap it up through the gaps between the pipes. Each pair of
pipes passed is a point, and the gap shrinks as the score grows.

| Control             | Action                                    |
| ------------------- | ----------------------------------------- |
| Space, click or tap | Flap (and start, or restart after a fall) |

```sh
pnpm install
pnpm dev      # play it
pnpm editor   # open it in the editor
```

## How it is made

Four scenes (`src/scenes`), each with its entities written out in its `setup`:

| Scene      | Parent      | What                                                               |
| ---------- | ----------- | ------------------------------------------------------------------ |
| `Sky`      | none        | The background and the scrolling ground (three `ScrollLoop` tiles) |
| `Ready`    | `Sky`       | The "get ready" message, until the first flap                      |
| `Play`     | `Sky`       | The bird, three pairs of pipes that come back again, the score     |
| `GameOver` | `"current"` | Loaded over `Play`: its `over` var stops the world                 |

- The pipes are not spawned while playing: `movePipes` brings back a pair that left the screen,
  with a new gap. The top pipe is a `DrawableRect2D` turned by 180 degrees, so the pipe image
  needs no cropping.
- `DrawOrder2D` stacks the shapes (pipes under the ground, the score on top): without it, a scene
  loaded again can draw in another order.
- Sounds are `SoundEffect` entities of `main.ts`, played with `ctx.sound.play(key)`.
- The tunings are component parameters, editable in the editor: `Bird` (gravity, flap, fall
  speed), `PipeSpawner` (speed, interval, gap), `ScrollLoop`, `RestartDelay`.

The files of `src` that are also in `shared/2d` or `shared/arcade` are copies (see the
repository's README).

## Credits

The images and sounds of `assets/` are by Samuel Custodio, under the MIT license
(`assets/LICENSE`).
