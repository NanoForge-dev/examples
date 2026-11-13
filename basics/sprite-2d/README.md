# sprite-2d

A flappy-bird scene: the background, a pipe and the bird are images.

It shows images in 2D: the `image` parameter of `DrawableRect2D` and `DrawableCircle2D` is an
asset path (`/pipe-green.png` is `assets/pipe-green.png`), and the image is stretched over the
shape. Until the image is loaded, or when there is no asset at that path, the shape shows its
color. The round bird is the same image in a `DrawableCircle2D`.

```sh
pnpm install
pnpm dev      # play it
pnpm editor   # open it in the editor
```

The images of `assets/` come from the flappy-bird example, under the MIT license in
`assets/LICENSE`. Every file of `src/` but `main.ts` is a copy of `shared/2d` (see the
repository's README).
