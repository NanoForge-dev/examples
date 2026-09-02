// Display-only mirror of server/weapon-catalog.ts - gameplay numbers (ammo, fire rate, reload
// timing, damage) live server-side and arrive via packets; this only carries what's needed to
// render and to build the shop panel: a label, which image + crop-sheet to hold this weapon with
// (each weapon can live on its own source image now, not just a shared weapons.png - see
// spriteKey/animationsKey below), that crop's native pixel size (guns aren't all cropped to the
// same box - so the ammo HUD icon can fit-scale each one into its fixed-size slot instead of
// assuming every icon is the same size), a world-space scale (native art isn't drawn at the same
// physical size across source images - Shotgun-Shot.png's 52x32 frame is much bigger, pixel for
// pixel, than weapons.png's tiny 16x16 pistol crop, so without this the held/reload shotgun
// renders comically oversized next to a 24x24 player), an optional pivot (where in that frame the
// hand actually grips the gun - see SpriteComponent's `pivot` option - only needed when that point
// isn't the frame's own geometric center, which sprite.system.ts assumes by default) plus, when a
// pivot is set, a matching optional handOffsetDelta (a pivot alone only fixes rotation, not
// position - see the shotgun entry's own comment for the full derivation), the sprite's own
// rest-angle rotation offset (measured per-sprite, since each gun's art faces a different default
// direction), and the two costs the shop needs to show.
export const WEAPON_CATALOG = {
  smallGun: {
    label: "Small Gun",
    spriteKey: "weapons.png",
    animationsKey: "weapons-animations.txt",
    iconAnimation: "idle",
    iconSize: { width: 16, height: 16 },
    scale: 1,
    // Re-measured from scratch (the -8 guess wasn't enough) via alpha-weighted centroid-per-column
    // of the barrel band in the actual 16x16 crop (weapons.png, 0,16,16,16), least-squares fit
    // across x=4..12 (excluding the foresight/muzzle-brake flare at x=13-14, which pulls the fit
    // toward "pointing up" but isn't the bore's true line): the barrel sits at a near-constant
    // y (~7.0px) across its whole body - i.e. drawn essentially perfectly horizontal, local angle
    // ~0deg, not the 26deg the original PCA-on-the-whole-silhouette measurement gave (PCA over the
    // full gun shape, including the grip's mass hanging below the barrel, biases the principal
    // axis away from the true bore line). offset = -localBarrelAngle, so ~0.
    rotationOffset: 0,
    alwaysOwned: true,
    cost: 0,
    ammoRefillCost: 0,
  },
  shotgun: {
    label: "Shotgun",
    // No longer weapons.png's tiny 27x8 crop - that whole entry was removed from
    // weapons-animations.txt. The held/aiming pose now comes from Shotgun-Shot.png's own frame 0
    // (same "idle" name, its own animations file), the same asset pack as the reload overlay
    // below, so the gun doesn't visibly change art between "just equipped" and "mid-reload".
    spriteKey: "Shotgun-Shot.png",
    animationsKey: "shotgun-shot-animations.txt",
    iconAnimation: "idle",
    // Native frame size of Shotgun-Shot.png/Shotgun-Reload.png (both 1924x32 = 37 frames of
    // 52x32) - used for the ammo HUD icon's fit-scale into its fixed slot, independent of `scale`
    // below (which is for the world-space held/reload sprite instead).
    iconSize: { width: 52, height: 32 },
    // 52px-wide native art next to weapons.png's old 27px-wide crop would render roughly 2x too
    // big at scale 1 (see header comment) - 0.5 lands it back at ~26px wide, matching the
    // known-good on-screen size the old crop had. Retune this single knob if it still reads big.
    scale: 0.5,
    // Where the hand actually grips the gun within the 52x32 frame (native, unscaled pixels - see
    // SpriteComponent's `pivot` option) - measured off the frame's pixel art: the stock/pistol-grip
    // hook sits at roughly x=4-10, y=17-25, well off the frame's geometric center (26,16), since
    // half the frame is empty space reserved for the muzzle-flash/recoil frames later in the
    // filmstrip. This is what the gun actually rotates and flips around (rotate-to-direction.
    // system.ts / mirrorWhenFacingLeft) - without it the gun swings around its empty-space center
    // instead of around the grip a hand would actually be holding it by. A rough estimate off the
    // pixel grid, not a precise measurement - retune alongside `scale` and `handOffsetDelta` below
    // if it's still off.
    pivot: { x: 7, y: 21 },
    // A pivot alone only fixes ROTATION, not POSITION: sprite.system.ts places a sprite's pivot at
    // exactly TransformComponent + pivot (see its own comment for the derivation), and the weapon
    // entity shares the exact same TransformComponent (HAND_LOCAL_OFFSETS[hand], via ChildrenComponent)
    // as the hand.png entity it's meant to sit on top of. So unless this weapon's pivot happens to
    // numerically equal hand.png's own default pivot - its frame center (8,8), since hand.png is an
    // uncropped 16x16 image - the two entities' pivots (and everything drawn around them) land at
    // different world points even sharing the same base offset. smallGun's 16x16 crop needs no
    // correction (its default center pivot already IS (8,8) - the two coincide by construction);
    // this weapon's pivot above (7,21) very much isn't, so start-game-packet.handler.ts's
    // weaponLocalOffset() adds this on top of HAND_LOCAL_OFFSETS[hand] for the weapon entity (and
    // its reload overlay, same asset) specifically - never for the hand entity itself - to land
    // back on (8,8): (8,8) - (7,21) = (1,-13). Retune alongside `pivot` if the gun still isn't
    // sitting on the hand - the two values only need to keep satisfying that equation together.
    handOffsetDelta: { x: 1, y: -13 },
    // Re-measured the same way as smallGun above, cross-checked on two independent assets: the
    // old 27x8 weapons.png icon gave ~3.6deg once the muzzle flare is excluded, and the much
    // higher-resolution 52x32 Shotgun-Reload.png frame 0 (same art, more pixels to fit a line
    // through) gives ~0.45deg over the barrel's full length - both close to flat. Using 0.
    rotationOffset: 0,
    alwaysOwned: false,
    cost: 150,
    ammoRefillCost: 15,
    // A real frame-by-frame reload animation (pump-action cycling) - a separate, always-built
    // overlay sprite (buildHandAndWeapon) shown in place of the held weapon icon while reloading,
    // replacing the procedural tilt every other weapon still uses (weapons without these fields
    // keep that fallback). Built once and just toggled visible/hidden (weapon-reload-animation.
    // system.ts), never swapped at runtime - swapping the MAIN sprite's image on every reload
    // start/end (the first version of this) destroys and recreates its Konva node each time,
    // which is asynchronous (spriteSystem re-loads the image before it exists again) and was
    // visibly glitchy - the weapon would flicker out for a frame or more, every single reload.
    // Same source art/rest angle/scale as the held sprite above - same asset pack, frame 0 is the
    // same resting pose - so rotationOffset/scale above are reused, not re-measured.
    reloadSpriteKey: "Shotgun-Reload.png",
    reloadAnimationsKey: "shotgun-reload-animations.txt",
    reloadFrameCount: 37,
    // Matches server/weapon-catalog.ts's shotgun.reloadSeconds - duplicated here (unlike every
    // other gameplay number, kept server-only per this file's own header comment) specifically so
    // the overlay's frameRate can be computed once at construction time, without waiting on the
    // dynamically-broadcast weaponState packet's reloadSeconds field. Never actually varies in
    // practice (it's a static catalog constant, not something that changes per-instance), so
    // there's nothing lost by not waiting for it.
    reloadSeconds: 2,
    // A real recoil/muzzle-flash animation on the MAIN held sprite (not a separate overlay, unlike
    // reload above - "shoot" is just another named animation inside the same spriteKey/
    // animationsKey as the resting "idle" pose, so there's nothing to swap between). Triggered by a
    // one-shot `weaponFired` broadcast (server/systems/weapon.system.ts, exactly where a shot
    // actually fires - not client input state, so every player's shot animates, not just the local
    // one) and self-expires after shootSeconds, back to `iconAnimation` -
    // weapon-reload-animation.system.ts owns the whole thing.
    //
    // shootSeconds is a purely client-side visual duration, NOT the server's fire-rate interval
    // (1/fireRatePerSecond, server/weapon-catalog.ts - 0.667s for the shotgun) - it only needs to
    // stay comfortably under that interval so a second shot's animation always gets a clean restart
    // (Konva.Sprite resets its frame index whenever the animation NAME actually changes, i.e. only
    // on an idle<->shoot transition - see weapon-reload-animation.system.ts) rather than
    // continuing mid-loop. 0.5s -> ~74fps (37/0.5), comfortably under the 0.667s fire interval with
    // some room to spare, while staying closer to the display's own refresh rate than a much
    // shorter duration would (frameRate this high already outpaces the screen's actual repaint
    // rate, so some of these 37 frames never get painted regardless - a much shorter duration would
    // only skip more of them, not make the recoil read any snappier).
    shootFrameCount: 37,
    shootSeconds: 0.5,
  },
} as const;

export type WeaponType = keyof typeof WEAPON_CATALOG;

export function isWeaponType(value: unknown): value is WeaponType {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(WEAPON_CATALOG, value);
}
