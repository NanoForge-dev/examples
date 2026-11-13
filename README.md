<div align="center">
  <img src=".github/logo.png" alt="NanoForge" width="120" />
  <h1>NanoForge examples</h1>
</div>

Games made with [NanoForge](https://nanoforge.eu). Each one is a project of its own, laid out as
`nf new` writes it, and opens in the editor (`nf editor <folder>`).

| Folder    | What                                                                   |
| --------- | ---------------------------------------------------------------------- |
| `basics/` | One engine feature each: the smallest game that shows it.              |
| `demos/`  | Small games around one idea (the pong family): local, networked, 3D.   |
| `games/`  | Complete games.                                                        |
| `shared/` | Components and systems several examples use, copied into each of them. |

## Run an example

```sh
cd basics/input-keyboard
pnpm install
pnpm dev        # or pnpm build && pnpm start
pnpm editor     # open it in the NanoForge editor
```

Node 26 and pnpm 12. The examples depend on the latest NanoForge packages.

## Rules

- **One item per file**: each file of `components/` holds one component, each file of `systems/`
  one system, each file of `scenes/` one scene. Items carry the editor's TSDoc tags
  (`@component`, `@system`, `@scene`, `@side`).
- **Shared code is copied, never imported**: an example must work on its own once copied out of
  this repository. A file at `src/<path>` whose `<path>` exists in `shared/<group>/` must be an
  exact copy of it. `pnpm check` fails on a copy that drifted; `pnpm fix` copies the shared version
  over it. Change the file in `shared/`, then run `pnpm fix`.
- The shared files are temporary: [`docs/shared-components.md`](docs/shared-components.md) lists
  them and the library package that should replace each one.

## Checks

```sh
pnpm install
pnpm lint       # prettier + one item per file + shared copies
```

CI also type-checks and builds every example (`.github/workflows/tests.yml`).
