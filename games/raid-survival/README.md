# raid-survival

A co-op survival game for one to four players: defend the lobby against waves of zombies. Kill
zombies for coins, then spend them on weapons, ammo, walls and towers. Revive a teammate who goes
down before the whole team falls. The game is won when the last wave is cleared.

It is a client and a server (`apps/client`, `apps/server`), which share the catalogs, the map and
the messages in `libs/shared`.

```sh
pnpm install
cp .env.example .env
pnpm dev      # play it: the server, and the client at the loader's address
pnpm editor   # open it in the editor
```

## Environment

`nf` gives the `NANOFORGE_CLIENT_*` variables to the client and the `NANOFORGE_SERVER_*` ones to
the server, without the prefix. Everything the client gets reaches the browser.

| Variable                              | Side   | What                                           |
| ------------------------------------- | ------ | ---------------------------------------------- |
| `NANOFORGE_CLIENT_SERVER_ADDRESS`     | client | Address of the game server                     |
| `NANOFORGE_CLIENT_SERVER_TCP_PORT`    | client | Its TCP (WebSocket) port                       |
| `NANOFORGE_SERVER_LISTENING_TCP_PORT` | server | The TCP (WebSocket) port the server listens on |

## Controls

| Key or button | Action                                                       |
| ------------- | ------------------------------------------------------------ |
| W A S D       | Move                                                         |
| Mouse         | Aim                                                          |
| Left click    | Shoot; in build mode, place a building or use a button       |
| R             | Reload                                                       |
| E             | Next to the lobby or a building, heal it, or upgrade a tower |
| E (hold)      | Next to a downed teammate, revive them                       |
| B             | Build mode: walls and towers on the grid, zoom buttons       |

The weapon shop on the right of the screen buys weapons and ammo, and picks the weapon in hand.

## Assets

The images of `apps/client/assets` came with the original game, without a license or credits:
their source and their terms are not recorded.

## Layout

- `apps/client/src`: three scenes (`Menu`, `Game`, `GameOver`). The menu and the game over screen
  are built by hand in `views/`; `build-world.ts` builds a game from its `startGame` message.
  `handlers/` holds what the client does with each message, called by `packetDispatch`.
- `apps/server/src`: the lobby, the waves, the zombies' AI, the weapons, the buildings and the
  revives. `handlers/` holds what the server does with each message of a client.
- `libs/shared/src`: the protocol (one packet each way, `ClientPacket` and `ServerPacket`), the
  weapon, building and player class catalogs, the map and the tower numbers.

`Position2D`, `Velocity2D`, `Acceleration2D` and `move2D` of the server are copies of `shared/2d`
(see the repository's README).
