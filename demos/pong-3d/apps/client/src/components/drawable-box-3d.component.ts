import {
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  type Scene,
} from "@nanoforge-dev/graphics-3d/three";

import { SCALE, fieldToWorld } from "../field";
import type { Position2D } from "./position-2d.component";

/**
 * Draws a box standing on the field, its top-left corner at the entity's `Position2D` (in field
 * units). Needs the `draw3D` system.
 *
 * @remarks
 * `mesh` is the three.js `Mesh` in the scene: change it from code for anything the parameters
 * don't offer.
 *
 * @component
 * @side client
 * @group Shape color=#e86fb0 - Size of the box, in field units.
 * @group Look color=#b18cff - What the box looks like.
 */
export class DrawableBox3D {
  name = "DrawableBox3D";

  /** The box in the scene, made by `draw3D` the first time it draws it. */
  mesh?: Mesh<BoxGeometry, MeshStandardMaterial>;

  constructor(
    /** Along the field's x. @group Shape @preset size.width */
    public width = 50,
    /** Along the field's y. @group Shape @preset size.height */
    public depth = 50,
    /** Up from the ground. @group Shape */
    public height = 50,
    /** A CSS color: `red`, `#ff0000`... @group Look @preset color */
    public color = "#4aa3ff",
    /** Whether it is drawn. @group Look */
    public visible = true,
  ) {}

  /** Puts the box in `scene` at `position`, up to date with the parameters. */
  draw(scene: Scene, position: Position2D): void {
    if (!this.mesh) {
      this.mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ roughness: 0.6 }));
      this.mesh.castShadow = this.mesh.receiveShadow = true;
    }
    if (this.mesh.parent !== scene) scene.add(this.mesh);
    this.mesh.scale.set(this.width * SCALE, this.height * SCALE, this.depth * SCALE);
    this.mesh.material.color.set(this.color);
    this.mesh.visible = this.visible;
    fieldToWorld(
      position.x + this.width / 2,
      position.y + this.depth / 2,
      this.height / 2,
      this.mesh.position,
    );
  }

  /** Removes the box from the scene. */
  destroy(): void {
    this.mesh?.removeFromParent();
    this.mesh?.geometry.dispose();
    this.mesh?.material.dispose();
    this.mesh = undefined;
  }
}
