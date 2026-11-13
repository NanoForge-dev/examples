import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { Vector3 } from "@nanoforge-dev/graphics-3d/three";

import { CameraRig } from "../components/camera-rig.component";
import { DrawableBox3D } from "../components/drawable-box-3d.component";
import { NetworkId } from "../components/network-id.component";
import { PaddleInput } from "../components/paddle-input.component";
import { Position2D } from "../components/position-2d.component";
import { FIELD, fieldToWorld } from "../field";

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
  const paddles = registry.getZipper([NetworkId, Position2D, DrawableBox3D]);

  registry
    .getZipper([PaddleInput, CameraRig])
    .forEach(({ PaddleInput: player, CameraRig: rig }) => {
      const paddle =
        player.seat === 0
          ? undefined
          : paddles.find(({ NetworkId }) => NetworkId.id === player.seat);
      if (paddle) {
        const side = player.seat === 1 ? 1 : -1;
        const centerX = paddle.Position2D.x + paddle.DrawableBox3D.width / 2;
        const centerY = paddle.Position2D.y + paddle.DrawableBox3D.depth / 2;
        // Behind and above the paddle, looking short of the center line: the paddle stays in view.
        fieldToWorld(centerX - side * 400, centerY, 300, eye);
        fieldToWorld(FIELD.width / 2 - side * 200, (centerY + FIELD.height / 2) / 2, 0, look);
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
