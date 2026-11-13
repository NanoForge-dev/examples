# Shared components and systems

Code that several examples need, kept **identical** in each of them (`pnpm check` enforces it:
a file at `src/<path>` whose `<path>` is in `shared/<group>/` must be an exact copy). It is
temporary: each entry names the package of the
[components-systems](https://github.com/NanoForge-dev/components-systems) registry that has it, or
should get it. Once an example can install that package (`nf install`), delete its copies and import
the package instead.

A shared path must be unique across all groups: `pnpm check` fails when two groups hold the same
`<path>`, and when a game has a file at a shared path that is not a copy. Give a shared file a
specific name (`pong-protocol.ts`, not `protocol.ts`).

## 1. Already in the library: `shared/2d`

A copy of the library (registry 2.0.0) with its imports made relative, its systems written as arrow
functions, and each file renamed with the CLI's `.component.ts` / `.system.ts` suffix. Replacing a
copy with the package changes no game logic.

| File                                         | Package                  | Used by                                                                                                                 |
| -------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `components/position-2d.component.ts`        | `@nanoforge/basics`      | every 2D example, both apps of the network games, raid-survival server                                                  |
| `components/velocity-2d.component.ts`        | `@nanoforge/basics`      | input-gamepad, input-keyboard, network server, pong, pong-network, pong-3d, breakout, flappy-bird, raid-survival server |
| `components/acceleration-2d.component.ts`    | `@nanoforge/basics`      | same as `move2D`                                                                                                        |
| `systems/move-2d.system.ts`                  | `@nanoforge/basics`      | input-gamepad, input-keyboard, network server, pong, pong-network, pong-3d, breakout, raid-survival server              |
| `components/drawable-rect-2d.component.ts`   | `@nanoforge/graphics-2d` | every 2D client                                                                                                         |
| `components/drawable-circle-2d.component.ts` | `@nanoforge/graphics-2d` | every 2D client                                                                                                         |
| `components/drawable-text-2d.component.ts`   | `@nanoforge/graphics-2d` | every 2D client                                                                                                         |
| `image-fill.ts` (helper)                     | `@nanoforge/graphics-2d` | every 2D client                                                                                                         |
| `systems/draw-2d.system.ts`                  | `@nanoforge/graphics-2d` | every 2D client                                                                                                         |
| `components/move-controller-2d.component.ts` | `@nanoforge/controls-2d` | input-keyboard, pong, breakout                                                                                          |
| `systems/move-control-2d.system.ts`          | `@nanoforge/controls-2d` | input-keyboard, pong, breakout                                                                                          |

"Every 2D client": input-gamepad, input-keyboard, input-mouse, music, network, scenes, sound,
sprite-2d, pong, pong-network, breakout, flappy-bird, tic-tac-toe.

## 2. Not in the library yet: shared by several examples

| File                                                                                                           | Used by                                                 | Proposed package                                                                        |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `paddle/components/hitbox-rect-2d.component.ts`                                                                | pong, pong-network, pong-3d (servers), breakout         | `@nanoforge/physics-2d` (see below)                                                     |
| `paddle/collisions.ts`, `components/{ball,paddle,wall}`, `systems/{bounce-ball,block-paddles}`                 | pong, pong-network, pong-3d (servers), breakout         | new `@nanoforge/arcade-2d`                                                              |
| `paddle/components/{goal,serve}`, `systems/{score-goals,serve-ball}`                                           | pong, pong-network, pong-3d (servers)                   | new `@nanoforge/arcade-2d`                                                              |
| `network/components/network-id.component.ts`                                                                   | pong-network, pong-3d (both apps), raid-survival client | new `@nanoforge/network` (replication)                                                  |
| `paddle/systems/{sync-moves,apply-moves}`                                                                      | pong-network, pong-3d                                   | new `@nanoforge/network` (replication)                                                  |
| `paddle/components/{seat,paddle-input}`, `systems/{seat-players,steer-paddles,send-input}`, `pong-protocol.ts` | pong-network, pong-3d                                   | stays with the pong demos                                                               |
| `input/just-pressed.ts` (helper)                                                                               | pong, breakout, flappy-bird, tic-tac-toe                | `@nanoforge/controls-2d`; better, an engine `input` feature: a key's just-pressed state |
| `paddle/systems/back-to-menu.system.ts`                                                                        | pong, breakout                                          | stays with the examples (game flow)                                                     |
| `arcade/components/draw-order-2d.component.ts`, `systems/draw-order-2d.system.ts`                              | flappy-bird, tic-tac-toe                                | `@nanoforge/graphics-2d`: a z-order for `draw2D`                                        |
| `arcade/components/sound-effect.component.ts`, `systems/load-sounds.system.ts`                                 | flappy-bird, tic-tac-toe                                | new `@nanoforge/audio`                                                                  |
| `basics/components/{play-on-key,mute-on-key}`                                                                  | sound, music                                            | new `@nanoforge/audio`                                                                  |

**`HitboxRect2D`** is the library's (physics-2d) minus its `collisions` field, filled by the
library's `detectCollisions2D`, which these games don't use (their `bounceBall` and `blockPaddles`
resolve contacts themselves). Adding the field back makes the copy the library's; the games then
need no change.

**The pong servers** (`demos/pong-network/apps/server/src` and `demos/pong-3d/apps/server/src`) are
byte-identical, `main.ts` included. `pnpm check` can't enforce it for `main.ts` (a shared `main.ts`
would apply to every example): keep them identical by hand.

## 3. Generic items in one example: library candidates

| Item                                                                                                                                                                                                                          | Example                       | Proposed package                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------- |
| `FollowMouse2D` + `followMouse2D`, `Draggable2D` + `drag2D`                                                                                                                                                                   | input-mouse                   | `@nanoforge/controls-2d`                          |
| `Clickable2D` + `click2D`                                                                                                                                                                                                     | tic-tac-toe                   | `@nanoforge/controls-2d`                          |
| `ControllerMove2D` + `controllerMove2D`                                                                                                                                                                                       | input-gamepad                 | `@nanoforge/controls-2d`                          |
| `CenterText2D` + `centerText2D`                                                                                                                                                                                               | tic-tac-toe                   | `@nanoforge/graphics-2d`                          |
| `ScrollLoop` + `scrollGround`                                                                                                                                                                                                 | flappy-bird                   | `@nanoforge/graphics-2d`                          |
| `SceneVarText` + `showSceneVar` (scenes), `VarText` + `varText` (tic-tac-toe), `HudText` + `updateHud` (breakout): one component                                                                                              | scenes, tic-tac-toe, breakout | new `@nanoforge/scenes`                           |
| `Transform3D`, `Box3D`, `Spin3D` + `draw3D`, `spin3D` (graphics-3d); `DrawableBox3D`, `DrawableSphere3D` + `draw3D` (pong-3d): one set                                                                                        | graphics-3d, pong-3d          | new `@nanoforge/graphics-3d`                      |
| `ChildrenComponent` + `transformChildrenToParentSystem`, `ZIndexComponent` + `zOrderSystem`, `FloatingText`, `SpriteComponent` + `spriteSystem` + `spriteAnimator`, `CollisionBox` + `resolveCollision`, `cameraFollowSystem` | raid-survival                 | `@nanoforge/graphics-2d`, `@nanoforge/physics-2d` |

Two rows above are the same idea written twice: a text that shows a scene var, and 3D drawables.
They should become one component each when they move to the library; they were not merged in the
examples because each is used by examples of different groups that were written in parallel.

## 4. Gaps found in the library while writing the examples

- `draw2D` has no z-order: shapes stack in entity-id order, and scenes reuse freed ids, so a shape
  of a newly loaded scene can be hidden (`DrawOrder2D` works around it).
- `move2D` and `moveControl2D` have no pause gate (breakout wraps them).
- `DrawableText2D` has no width, alignment or font style; `DrawableRect2D` has no stroke, crop,
  repeat or pivot (flappy-bird sets the Konva offset itself to rotate the bird around its center).
