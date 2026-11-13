import {
  BoxGeometry,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  type Scene,
} from "@nanoforge-dev/graphics-3d/three";
import type { Transform3D } from "./transform-3d.component";

/**
 * Draws a box at the entity's `Transform3D` (its center). Needs the `draw3D` system.
 *
 * @remarks
 * `mesh` is the Three.js `Mesh` in the scene: change it from code for anything the parameters
 * don't offer.
 *
 * @component
 * @side client
 * @group Shape color=#e86fb0 - Size of the box, in world units.
 * @group Look color=#b18cff - What the box looks like.
 */
export class Box3D {
  name = "Box3D";

  /** The box in the scene, made by `draw3D` the first time it draws it. */
  mesh?: Mesh<BoxGeometry, MeshStandardMaterial>;

  constructor(
    /** @group Shape */
    public width = 1,
    /** @group Shape */
    public height = 1,
    /** @group Shape */
    public depth = 1,
    /** A CSS color: `red`, `#ff0000`... @group Look @preset color */
    public color = "#44aa88",
  ) {}

  /** Puts the box in `scene` at `transform`, up to date with the parameters. */
  draw(scene: Scene, transform: Transform3D): void {
    this.mesh ??= new Mesh(new BoxGeometry(), new MeshStandardMaterial());
    if (this.mesh.parent !== scene) scene.add(this.mesh);
    this.mesh.scale.set(this.width, this.height, this.depth);
    this.mesh.material.color.set(this.color);
    this.mesh.position.set(transform.x, transform.y, transform.z);
    this.mesh.rotation.set(
      MathUtils.degToRad(transform.rotationX),
      MathUtils.degToRad(transform.rotationY),
      MathUtils.degToRad(transform.rotationZ),
    );
  }

  /** Removes the box from the scene and frees its GPU memory. */
  destroy(): void {
    this.mesh?.removeFromParent();
    this.mesh?.geometry.dispose();
    this.mesh?.material.dispose();
    this.mesh = undefined;
  }
}
