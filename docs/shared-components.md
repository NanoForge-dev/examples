# Shared components and systems

Code that several examples need, kept **identical** in each of them (`pnpm check` enforces it).
It is temporary: each entry names the package of the
[components-systems](https://github.com/NanoForge-dev/components-systems) registry that should
provide it. Once an example can install that package (`nf install`), delete its copies and import
the package instead.

The `2d` group is a copy of the library (registry 2.0.0) with its imports made relative, its
systems written as arrow functions, and each file renamed with the CLI's `.component.ts` /
`.system.ts` suffix. Replacing it changes no game logic.

## `shared/2d`: already in the library

| File                                         | Library package          | Used by               |
| -------------------------------------------- | ------------------------ | --------------------- |
| `components/position-2d.component.ts`        | `@nanoforge/basics`      | basics/input-keyboard |
| `components/velocity-2d.component.ts`        | `@nanoforge/basics`      | basics/input-keyboard |
| `components/acceleration-2d.component.ts`    | `@nanoforge/basics`      | basics/input-keyboard |
| `systems/move-2d.system.ts`                  | `@nanoforge/basics`      | basics/input-keyboard |
| `components/drawable-rect-2d.component.ts`   | `@nanoforge/graphics-2d` | basics/input-keyboard |
| `components/drawable-circle-2d.component.ts` | `@nanoforge/graphics-2d` | basics/input-keyboard |
| `components/drawable-text-2d.component.ts`   | `@nanoforge/graphics-2d` | basics/input-keyboard |
| `image-fill.ts` (helper)                     | `@nanoforge/graphics-2d` | basics/input-keyboard |
| `systems/draw-2d.system.ts`                  | `@nanoforge/graphics-2d` | basics/input-keyboard |
| `components/move-controller-2d.component.ts` | `@nanoforge/controls-2d` | basics/input-keyboard |
| `systems/move-control-2d.system.ts`          | `@nanoforge/controls-2d` | basics/input-keyboard |

## Not in the library yet: candidates

(Filled as the examples are remade.)
