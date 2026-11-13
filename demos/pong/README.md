# pong

Pong for two players on one keyboard: the first to five points wins.

| Key   | Does                               |
| ----- | ---------------------------------- |
| Enter | Starts a match, leaves the end one |
| W / S | Moves the left paddle              |
| ↑ / ↓ | Moves the right paddle             |

It shows **scenes** (`@nanoforge-dev/scene`): `Menu`, `Match` and `Win`, each in
`src/scenes/`, listed in `SceneLibrary` in `src/main.ts`. A scene spawns its entities and adds its
systems in `setup`, and they go away when the next scene is loaded. The match length is the
`pointsToWin` scene var, the winner comes to `Win` as a param.

The ball, the paddles, the walls and the goals are plain entities: `bounceBall` sends the ball
back from a `Paddle` or a `Wall`, `blockPaddles` stops the paddles at the walls, `scoreGoals`
counts a point when the ball enters a `Goal` and `serveBall` serves it again. The servers of
`pong-network` and `pong-3d` run the same systems.

```sh
pnpm install
pnpm dev      # play it
pnpm editor   # open it in the editor
```

The files of `src/` that are also in `shared/2d` or `shared/paddle` are copies (see the
repository's README).
