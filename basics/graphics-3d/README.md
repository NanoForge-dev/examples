# graphics-3d

A cube spinning in 3D, lit by a sun and the sky.

It shows the `graphics-3d` engine library (Three.js): `main` sets up the scene's background,
camera and lights through `Graphics3DLibrary`, and the cube is an entity: `Transform3D` places it,
`Box3D` draws it (the `draw3D` system adds its mesh to `ctx.graphics.scene`) and `Spin3D` turns
it (the `spin3D` system). graphics-3d renders the scene after the systems, every tick.

Three.js is a peer dependency of graphics-3d: import its classes from
`@nanoforge-dev/graphics-3d/three`.

```sh
pnpm install
pnpm dev      # play it
pnpm editor   # open it in the editor
```
