import type { Vector3 } from "@nanoforge-dev/graphics-3d/three";

/**
 * Moves the camera: behind the local player's paddle, or above the table while watching. Needs a
 * `PaddleInput` on the same entity and the `followCamera` system.
 *
 * @component
 * @side client
 */
export class CameraRig {
  name = "CameraRig";

  /** Where the camera looks, eased toward its goal every tick. */
  look: Vector3 | undefined = undefined;
}
