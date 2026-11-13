# sound

Press Space or Enter to play a sound effect; M turns the sound on and off.

It shows the `sound` engine library: `playSoundOnKey` loads the sound of each `PlayOnKey`
(`ctx.sound.load`, with the URL `ctx.assets.getAsset` gives for the asset) and plays it when its
key is pressed (`ctx.sound.play`). Sounds may overlap: press both keys quickly.

The sound library **starts muted**, and `ctx.sound.mute()` toggles it: press M once to hear
anything. `MuteOnKey` keeps track of the state, which the library does not expose.

```sh
pnpm install
pnpm dev      # play it
pnpm editor   # open it in the editor
```

`assets/wing.wav` and `assets/hit.wav` come from the flappy-bird example, under the MIT license in
`assets/LICENSE`. `image-fill.ts`, the `Position2D`, `DrawableRect2D`, `DrawableCircle2D` and
`DrawableText2D` components and the `draw2D` system are copies of `shared/2d`, and the `PlayOnKey`
and `MuteOnKey` components copies of `shared/basics` (see the repository's README).
