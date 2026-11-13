# pong-network

Pong for two players over the network. The server runs the game; each client draws it and sends
its player's keys.

| Key   | Does              |
| ----- | ----------------- |
| ↑ / ↓ | Moves your paddle |

The first client to join plays the left paddle, the second the right one, and the next ones
watch. A paddle is free again when its player leaves.

## Run it

```sh
pnpm install
cp .env.example .env
pnpm build && pnpm start   # or pnpm dev
pnpm editor                # open it in the editor
```

Open the client's address in two tabs (or on two computers). The ball is served three seconds
after the server starts, and after each goal.

`.env` sets where the server listens and where the client finds it (`nf start` and `nf dev`
read it, and the shell's variables win over it):

| Variable                              | Default     | What                                 |
| ------------------------------------- | ----------- | ------------------------------------ |
| `NANOFORGE_CLIENT_SERVER_ADDRESS`     | `127.0.0.1` | The server's address, for the client |
| `NANOFORGE_CLIENT_SERVER_TCP_PORT`    | `4444`      | The server's port, for the client    |
| `NANOFORGE_SERVER_LISTENING_TCP_PORT` | `4444`      | The port the server listens on       |

To play on a network, set `NANOFORGE_CLIENT_SERVER_ADDRESS` to the server's address.

## How it works

- `apps/server` is authoritative: it spawns the walls, the goals, the ball and the paddles, and
  runs the same physics as the local `pong` (`bounceBall`, `blockPaddles`, `scoreGoals`,
  `serveBall`, `move2D`). `seatPlayers` seats the clients that send `Play`, `steerPaddles` moves
  a paddle from its client's `Input`, and `syncMoves` sends a `Move` when an entity's velocity
  changes.
- `apps/client` spawns the same entities with the same `NetworkId`, `applyMoves` applies the
  `Move` packets and `move2D` moves the entities between two of them. `sendInput` sends the keys
  when they change.
- `src/protocol.ts` (the packets) is the same file in both apps. The server drops an `Input` with
  another key than `up`, `down` or `stop`.

`apps/server/src` is the same as `pong-3d`'s, file for file. The files of `src/` that are also in
`shared/2d` or `shared/paddle` are copies (see the repository's README).
