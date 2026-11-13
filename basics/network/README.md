# network

Every player is a square on a game server: the arrows move yours (green), and the others' squares
(red) move as their players move them. Open the game in two tabs to see it.

It shows the `network` engine library, with a server that owns the game:

- the client only sends where its player wants to go (`Move`, a direction per axis), when its
  keys change (`sendMoves`);
- the server spawns a player for each client that sends `Join` and removes it when the client
  leaves (`joinPlayers`), turns the directions into speeds (`steerPlayers`), moves the players
  (`move2D`), keeps them in the arena (`keepInArena`) and sends every position to every client,
  each tick (`sendPlayers`);
- the client draws the players the server sent (`showPlayers`).

The packets are declared once with `definePacket`, in the shared library `libs/protocol`, which
both apps import as `@network/protocol/messages` (the root `tsconfig.json` maps it). `Move`'s
`validate` drops anything but two directions: the server never trusts a client.

```sh
pnpm install
cp .env.example .env   # the server's address and ports
pnpm dev               # play it: open the client's url in two tabs
pnpm editor            # open it in the editor
```

`apps/client` and `apps/server` each hold copies of the `shared/2d` files they use (see the
repository's README): `Position2D` in both; `Velocity2D`, `Acceleration2D` and `move2D` on the
server; `image-fill.ts`, `DrawableRect2D`, `DrawableCircle2D`, `DrawableText2D` and `draw2D` on
the client.
