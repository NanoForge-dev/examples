# scenes

Two rooms, red and blue: Space switches from one to the other. The bottom lines show two scene
vars.

It shows the `scene` engine library and `EcsScene` (`@nanoforge-dev/ecs/scene`):

- each room is a scene whose `setup` spawns its entities, like `main`; they are removed when the
  scene is unloaded;
- `SceneLibrary` lists the scenes and loads `RedRoom` first; `switchSceneOnKey` calls
  `ctx.scenes.load` to move to the other one;
- `room` is a var each room makes: it belongs to that room and goes away with it.
  `switches` is `persistent`: it is kept across scenes. `src/scene-vars.ts` types them.

```sh
pnpm install
pnpm dev      # play it
pnpm editor   # open it in the editor
```

`image-fill.ts`, the `Position2D`, `DrawableRect2D`, `DrawableCircle2D` and `DrawableText2D`
components and the `draw2D` system are copies of `shared/2d`, and `SceneVarText` with its
`showSceneVar` system of `shared/scenes` (see the repository's README).
