# Shared components and systems

Code that several examples need, kept **identical** in each of them (`pnpm check` enforces it:
a file at `src/<path>` whose `<path>` is in `shared/<group>/` must be an exact copy). It is
temporary: each entry names the package of the
[components-systems](https://github.com/NanoForge-dev/components-systems) registry that has it, or
should get it. Once an example can install that package (`nf install`), delete its copies and import
the package instead.

A shared path must be unique across all groups: `pnpm check` fails when two groups hold the same
`<path>`. It also takes every game file at a shared path for a copy: it fails when that file is
not one, and `pnpm fix` overwrites it (and prints it). So a shared path is reserved in every
example: give a new shared file a specific name (`pong-protocol.ts`, not `protocol.ts`). The
`paddle` group keeps its generic file names for now (`collisions.ts`,
`components/ball.component.ts`, `systems/serve-ball.system.ts`…): a game with its own ball must
name its file differently.

## 1. Already in the library: `shared/2d`

A copy of the library (registry 2.0.0) with its imports made relative, its systems written as arrow
functions, and each file renamed with the CLI's `.component.ts` / `.system.ts` suffix. Replacing a
copy with the package changes no game logic.

| File                                         | Package                  | Used by                                                                                                                      |
| -------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `components/position-2d.component.ts`        | `@nanoforge/basics`      | every 2D example, both apps of the network games, raid-survival server                                                       |
| `components/velocity-2d.component.ts`        | `@nanoforge/basics`      | input-gamepad, input-keyboard, network server, pong, pong-network, pong-3d, breakout, flappy-bird, raid-survival (both apps) |
| `components/acceleration-2d.component.ts`    | `@nanoforge/basics`      | same as `move2D`                                                                                                             |
| `systems/move-2d.system.ts`                  | `@nanoforge/basics`      | input-gamepad, input-keyboard, network server, pong, pong-network, pong-3d, breakout, raid-survival server                   |
| `components/drawable-rect-2d.component.ts`   | `@nanoforge/graphics-2d` | every 2D client                                                                                                              |
| `components/drawable-circle-2d.component.ts` | `@nanoforge/graphics-2d` | every 2D client                                                                                                              |
| `components/drawable-text-2d.component.ts`   | `@nanoforge/graphics-2d` | every 2D client                                                                                                              |
| `image-fill.ts` (helper)                     | `@nanoforge/graphics-2d` | every 2D client                                                                                                              |
| `systems/draw-2d.system.ts`                  | `@nanoforge/graphics-2d` | every 2D client                                                                                                              |
| `components/move-controller-2d.component.ts` | `@nanoforge/controls-2d` | input-keyboard, pong, breakout                                                                                               |
| `systems/move-control-2d.system.ts`          | `@nanoforge/controls-2d` | input-keyboard, pong, breakout                                                                                               |

"Every 2D client": input-gamepad, input-keyboard, input-mouse, music, network, scenes, sound,
sprite-2d, pong, pong-network, breakout, flappy-bird, tic-tac-toe.

## 2. Not in the library yet: shared by several examples

| File                                                                                                           | Used by                                                                                                | Proposed package                                                                        |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `paddle/components/hitbox-rect-2d.component.ts`                                                                | pong, pong-network, pong-3d (servers), breakout                                                        | `@nanoforge/physics-2d` (see below)                                                     |
| `paddle/collisions.ts`, `components/{ball,paddle,wall}`, `systems/{bounce-ball,block-paddles}`                 | pong, pong-network, pong-3d (servers), breakout                                                        | new `@nanoforge/arcade-2d`                                                              |
| `paddle/components/{goal,serve}`, `systems/{score-goals,serve-ball}`                                           | pong, pong-network, pong-3d (servers)                                                                  | new `@nanoforge/arcade-2d`                                                              |
| `network/components/network-id.component.ts`                                                                   | pong-network, pong-3d (both apps), raid-survival client                                                | new `@nanoforge/network` (replication)                                                  |
| `paddle/systems/{sync-moves,apply-moves}`                                                                      | pong-network, pong-3d                                                                                  | new `@nanoforge/network` (replication)                                                  |
| `paddle/components/{seat,paddle-input}`, `systems/{seat-players,steer-paddles,send-input}`, `pong-protocol.ts` | pong-network, pong-3d                                                                                  | stays with the pong demos                                                               |
| `input/just-pressed.ts` (helper)                                                                               | pong, breakout, flappy-bird, tic-tac-toe                                                               | `@nanoforge/controls-2d`; better, an engine `input` feature: a key's just-pressed state |
| `scenes/components/scene-var-text.component.ts`, `systems/show-scene-var.system.ts`                            | scenes, breakout, tic-tac-toe                                                                          | new `@nanoforge/scenes`                                                                 |
| `3d/components/{transform-3d,drawable-box-3d,drawable-sphere-3d}`, `systems/draw-3d`                           | graphics-3d, pong-3d (client)                                                                          | new `@nanoforge/graphics-3d`                                                            |
| `paddle/systems/back-to-menu.system.ts`                                                                        | pong, breakout                                                                                         | stays with the examples (game flow)                                                     |
| `arcade/components/draw-order-2d.component.ts`, `systems/draw-order-2d.system.ts`                              | flappy-bird, tic-tac-toe; raid-survival client (the component, with its own `zOrderSystem` on sprites) | `@nanoforge/graphics-2d`: a z-order for `draw2D`                                        |
| `arcade/components/sound-effect.component.ts`, `systems/load-sounds.system.ts`                                 | flappy-bird, tic-tac-toe                                                                               | new `@nanoforge/audio`                                                                  |
| `basics/components/{play-on-key,mute-on-key}`                                                                  | sound, music                                                                                           | new `@nanoforge/audio`                                                                  |

**`HitboxRect2D`** is the library's (physics-2d) minus its `collisions` field, filled by the
library's `detectCollisions2D`, which these games don't use (their `bounceBall` and `blockPaddles`
resolve contacts themselves). Adding the field back makes the copy the library's; the games then
need no change.

**`SceneVarText`** shows a scene var through a template (`"Score {}"`), and `-` while the var
does not exist. It replaces three versions: `SceneVarText` (scenes, a label before the value),
`HudText` (breakout, a fixed label per var) and `VarText` (tic-tac-toe, a template).

**The 3D drawables** are in world units, at their entity's `Transform3D` (its center). pong-3d
plays on a 2D field: its own `placeOnField` system writes each `Transform3D` from the entity's
`Position2D` (100 field units to a world unit). graphics-3d copies `DrawableSphere3D` without
using it, because `draw3D` draws both shapes.

**A ball that left the field** (see §4): `Paddle.maxSpeed` (1600 px/s by default) caps what
`speedUp` adds, and `scoreGoals` serves again a ball whose center is out of the box around every
`Wall` and `Goal`, scoring in the goal it passed, if any. Breakout's own `loseBall` puts back on
the paddle a ball out through the top or a side.

**The pong servers** (`demos/pong-network/apps/server/src` and `demos/pong-3d/apps/server/src`) are
byte-identical, `main.ts` included. `pnpm check` can't enforce it for `main.ts` (a shared `main.ts`
would apply to every example): keep them identical by hand.

## 3. Generic items in one example: library candidates

| Item                                                                                                                                                                                                                         | Example       | Proposed package                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------- |
| `FollowMouse2D` + `followMouse2D`, `Draggable2D` + `drag2D`                                                                                                                                                                  | input-mouse   | `@nanoforge/controls-2d`                          |
| `Clickable2D` + `click2D`                                                                                                                                                                                                    | tic-tac-toe   | `@nanoforge/controls-2d`                          |
| `ControllerMove2D` + `controllerMove2D`                                                                                                                                                                                      | input-gamepad | `@nanoforge/controls-2d`                          |
| `CenterText2D` + `centerText2D`                                                                                                                                                                                              | tic-tac-toe   | `@nanoforge/graphics-2d`                          |
| `ScrollLoop` + `scrollGround`                                                                                                                                                                                                | flappy-bird   | `@nanoforge/graphics-2d`                          |
| `Spin3D` + `spin3D`                                                                                                                                                                                                          | graphics-3d   | new `@nanoforge/graphics-3d`                      |
| `ChildrenComponent` + `transformChildrenToParentSystem`, `zOrderSystem` (on `DrawOrder2D`), `FloatingText`, `SpriteComponent` + `spriteSystem` + `spriteAnimator`, `CollisionBox` + `resolveCollision`, `cameraFollowSystem` | raid-survival | `@nanoforge/graphics-2d`, `@nanoforge/physics-2d` |

**Kept apart on purpose** (raid-survival client and server):

- `TransformComponent` is not `Position2D`: it adds a rotation, and its `x`/`y` is where the
  sprite's pivot is drawn, not a top-left corner.
- `MoveController` is not `MoveController2D`: it holds the WASD bindings and only reports the held
  keys to the server, which moves the player; `MoveController2D` sets a local `Velocity2D`.
- The server's `Hitbox` is `HitboxRect2D` plus an offset from the position (16×16 by default), which
  the weapon and tower systems use to find the center.

## 4. Gaps found in the library while writing the examples

- `draw2D` has no z-order: shapes stack in entity-id order, and scenes reuse freed ids, so a shape
  of a newly loaded scene can be hidden (`DrawOrder2D` works around it).
- `move2D` and `moveControl2D` have no pause gate (breakout wraps them).
- The engine's `ctx.app.delta` is the wall-clock time since the last tick, unclamped: a hidden tab
  ticks about once a second, and `move2D` moves by the whole delta. The paddle systems test
  overlap only, so a fast ball, or any ball after a long tick, can jump over a wall or a goal.
  The examples cap the ball's speed and serve again a ball out of the field; the library needs a
  clamped delta or swept collisions (`@nanoforge/physics-2d`).
- `DrawableText2D` has no width, alignment or font style; `DrawableRect2D` has no stroke, crop,
  repeat or pivot (flappy-bird sets the Konva offset itself to rotate the bird around its center).
