import {
  Mesh,
  MeshStandardMaterial,
  type Scene,
  SphereGeometry,
} from "@nanoforge-dev/graphics-3d/three";

import { SCALE, fieldToWorld } from "../field";
import type { Position2D } from "./position-2d.component";

/**
 * Draws a ball resting on the field, the top-left corner of its square at the entity's
 * `Position2D` (in field units). Needs the `draw3D` system.
 *
 * @remarks
 * `mesh` is the three.js `Mesh` in the scene: change it from code for anything the parameters
 * don't offer.
 *
 * @component
 * @side client
 * @group Shape color=#e86fb0 - Size of the ball, in field units.
 * @group Look color=#b18cff - What the ball looks like.
 */
export class DrawableSphere3D {
  name = "DrawableSphere3D";

  /** The ball in the scene, made by `draw3D` the first time it draws it. */
  mesh?: Mesh<SphereGeometry, MeshStandardMaterial>;

  constructor(
    /** @group Shape */
    public radius = 25,
    /** A CSS color: `red`, `#ff0000`... @group Look @preset color */
    public color = "#ff4d3d",
    /** Whether it is drawn. @group Look */
    public visible = true,
  ) {}

  /** Puts the ball in `scene` at `position`, up to date with the parameters. */
  draw(scene: Scene, position: Position2D): void {
    if (!this.mesh) {
      this.mesh = new Mesh(
        new SphereGeometry(1, 32, 16),
        new MeshStandardMaterial({ roughness: 0.3 }),
      );
      this.mesh.castShadow = true;
    }
    if (this.mesh.parent !== scene) scene.add(this.mesh);
    this.mesh.scale.setScalar(this.radius * SCALE);
    this.mesh.material.color.set(this.color);
    this.mesh.visible = this.visible;
    fieldToWorld(
      position.x + this.radius,
      position.y + this.radius,
      this.radius,
      this.mesh.position,
    );
  }

  /** Removes the ball from the scene. */
  destroy(): void {
    this.mesh?.removeFromParent();
    this.mesh?.geometry.dispose();
    this.mesh?.material.dispose();
    this.mesh = undefined;
  }
}
