import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { Vector3 } from "@nanoforge-dev/graphics-3d/three";

import { CameraRig } from "../components/camera-rig.component";
import { NetworkId } from "../components/network-id.component";
import { PaddleInput } from "../components/paddle-input.component";
import { Transform3D } from "../components/transform-3d.component";
import { FIELD, SCALE, fieldToWorld } from "../field";

// Above and behind the right end of the table, framing both paddles.
const SPECTATOR_EYE = fieldToWorld(FIELD.width + 900, FIELD.height / 2, 1200);
const SPECTATOR_LOOK = fieldToWorld(FIELD.width / 2 + 270, FIELD.height / 2);
const eye = new Vector3();
const look = new Vector3();

/**
 * Players see the table from just above and behind their own paddle (the one whose `NetworkId`
 * is their seat), following it. Watchers see it from above its right end.
 *
 * @system
 * @side client
 */
export const followCamera = (registry: Registry, ctx: Context) => {
  const paddles = registry.getZipper([NetworkId, Transform3D]);

  registry
    .getZipper([PaddleInput, CameraRig])
    .forEach(({ PaddleInput: player, CameraRig: rig }) => {
      const paddle =
        player.seat === 0
          ? undefined
          : paddles.find(({ NetworkId }) => NetworkId.id === player.seat);
      if (paddle) {
        const side = player.seat === 1 ? 1 : -1;
        // The paddle's center, in world units (`placeOnField` keeps it up to date).
        const { x, z } = paddle.Transform3D;
        // Behind and above the paddle, looking short of the center line: the paddle stays in view.
        eye.set(x - side * 400 * SCALE, 300 * SCALE, z);
        look.set(-side * 200 * SCALE, 0, z / 2);
      } else {
        eye.copy(SPECTATOR_EYE);
        look.copy(SPECTATOR_LOOK);
      }

      const camera = ctx.graphics.camera;
      if (!rig.look) {
        rig.look = look.clone();
        camera.position.copy(eye);
      }
      // Eases toward the goal in about a fifth of a second, whatever the frame rate.
      const t = 1 - Math.exp(-ctx.app.delta / 120);
      camera.position.lerp(eye, t);
      rig.look.lerp(look, t);
      camera.lookAt(rig.look);
    });
};
