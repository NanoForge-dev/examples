# breakout

A breakout made of **scenes** (`@nanoforge-dev/scene`): a menu, a game with three levels, a
pause menu and two end screens. Every entity and every system but the background and `draw2D`
belongs to a scene, and goes away with it.

| Key        | Does                                |
| ---------- | ----------------------------------- |
| Enter      | Starts a game, leaves an end screen |
| ← →        | Moves the paddle                    |
| Space      | Serves the ball                     |
| Esc or P   | Pauses, resumes                     |
| Q (paused) | Quits to the menu                   |

```sh
pnpm install
pnpm dev      # play it
pnpm editor   # open it in the editor
```

## The scenes

```text
Menu                 root: the title, the best score
Run                  root: walls, paddle, ball, top bar; vars score, lives
├── Level1           bricks; vars level, bricksLeft, ballSpeed, served
├── Level2
├── Level3
└── (Pause)          no parent of its own: loaded over the current level
GameOver, Victory    roots: the score comes as a param
```

The vars follow their scenes (`src/scene-vars.ts` types and documents them): `score` and `lives`
go with `Run`, so a new game starts from 0 and 3 lives; a level's `bricksLeft` and `served` are
made again by the next level; `paused` exists only while `Pause` is loaded, and the game's
systems wait while it does; `best` is persistent.

## Layout

```text
src/
├── main.ts         the libraries; SceneLibrary starts on Menu and lists every scene by id
├── scenes/         one scene per file: menu, run, level-1 to level-3, pause, game-over, victory
├── systems/        one system per file
├── components/     one component per file
├── level.ts        Level, the base class of the levels (their parent and the next level)
├── scene-vars.ts   the scene vars' types and docs
├── just-pressed.ts justPressed: a key down since the last time a system asked (shared copy)
├── collisions.ts   contact tests of the ball, paddle and walls (shared copy)
└── record-best.ts  keeps the best score
```

The paddle, the ball and the walls are the ones of the pong demos: `bounceBall` sends the ball
back from the `Paddle` and the `Wall` entities (a brick is a `Wall` with a `Brick`), and
`breakBricks` counts the hits. The game's own systems (`controlPaddle`, `moveAll`, `collide`)
call the shared ones unless the game is paused.

Three things to know when writing scenes like these:

- **A scene's parent is read when its module is evaluated** (`static override parent = Run`, in
  `level.ts`). `run.scene.ts` imports no other scene, so the levels always find `Run` defined.
- **The ECS finds a component by its class name.** A component named like a class the bundle
  already has (graphics-2d's `Sprite`, `Text`, `Rect`…) is renamed by the bundler (`Sprite2`), and
  no longer matches its `name` field. `SceneLibrary`'s `scenes` gives each scene an id for the
  same reason.
- **`draw2D` stacks the shapes of one frame in entity order**, and a scene's entities reuse the
  ids of the scene before: two shapes of one scene that overlap may stack either way. The
  background is spawned by `main.ts` for that reason.

The files of `src/` that are also in `shared/2d`, `shared/paddle` or `shared/scenes` are copies (see the
repository's README).
