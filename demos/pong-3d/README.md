# pong-3d

Pong in 3D for two players, without a game server: the first player hosts the game in their
browser tab, the second joins it (`network: "p2p"` in `nanoforge.config.ts`).

| Key   | Does                                      |
| ----- | ----------------------------------------- |
| ← / → | Moves your paddle, as seen from behind it |

The camera stands behind your paddle and follows it; a third player watches from above the
table.

## Run it

```sh
pnpm install
cp .env.example .env
pnpm build && pnpm start   # or pnpm dev
pnpm editor                # open it in the editor
```

Open the client's address: that tab hosts a game and logs its invite link (`?room=CODE`). Open
the link in another tab, or send it to the other player.

The Bun server only pairs the players (WebRTC signaling). `.env` sets where it listens and where
the clients find it (the shell's variables win over it):

| Variable                              | Default     | What                                     |
| ------------------------------------- | ----------- | ---------------------------------------- |
| `NANOFORGE_CLIENT_SERVER_ADDRESS`     | `127.0.0.1` | The signaling server's address           |
| `NANOFORGE_CLIENT_SERVER_TCP_PORT`    | `4444`      | The signaling server's port              |
| `NANOFORGE_SERVER_LISTENING_TCP_PORT` | `4444`      | The port the signaling server listens on |

## How it works

`apps/server` is the same as `pong-network`'s, file for file: the game runs on a 1920 × 1080
field in 2D, in the host's tab. `apps/client` draws that field in 3D: `DrawableBox3D` and
`DrawableSphere3D` place a box or a ball on the field (in field units), `draw3D` keeps them
where their `Position2D` says, and `followCamera` moves the camera. `PaddleInput` is `mirrored`:
for the right paddle, whose camera faces the other way, the keys swap.

The files of `src/` that are also in `shared/2d` or `shared/paddle` are copies (see the
repository's README).
