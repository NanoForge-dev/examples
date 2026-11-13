import {
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  type Scene,
  SphereGeometry,
} from "@nanoforge-dev/graphics-3d/three";

import type { Transform3D } from "./transform-3d.component";

/**
 * Draws a ball at the entity's `Transform3D` (its center). Needs the `draw3D` system.
 *
 * @remarks
 * `mesh` is the Three.js `Mesh` in the scene: change it from code for anything the parameters
 * don't offer. It casts shadows when the renderer's shadow map is on.
 *
 * @component
 * @side client
 * @group Shape color=#e86fb0 - Size of the ball, in world units.
 * @group Look color=#b18cff - What the ball looks like.
 */
export class DrawableSphere3D {
  name = "DrawableSphere3D";

  /** The ball in the scene, made by `draw3D` the first time it draws it. */
  mesh?: Mesh<SphereGeometry, MeshStandardMaterial>;

  constructor(
    /** @group Shape */
    public radius = 0.5,
    /** A CSS color: `red`, `#ff0000`... @group Look @preset color */
    public color = "#ff4d3d",
    /** From 0 (a mirror) to 1 (matte). @group Look */
    public roughness = 1,
    /** Whether it is drawn. @group Look */
    public visible = true,
  ) {}

  /** Puts the ball in `scene` at `transform`, up to date with the parameters. */
  draw(scene: Scene, transform: Transform3D): void {
    if (!this.mesh) {
      this.mesh = new Mesh(new SphereGeometry(1, 32, 16), new MeshStandardMaterial());
      this.mesh.castShadow = true;
    }
    if (this.mesh.parent !== scene) scene.add(this.mesh);
    this.mesh.scale.setScalar(this.radius);
    this.mesh.material.color.set(this.color);
    this.mesh.material.roughness = this.roughness;
    this.mesh.visible = this.visible;
    this.mesh.position.set(transform.x, transform.y, transform.z);
    this.mesh.rotation.set(
      MathUtils.degToRad(transform.rotationX),
      MathUtils.degToRad(transform.rotationY),
      MathUtils.degToRad(transform.rotationZ),
    );
  }

  /** Removes the ball from the scene and frees its GPU memory. */
  destroy(): void {
    this.mesh?.removeFromParent();
    this.mesh?.geometry.dispose();
    this.mesh?.material.dispose();
    this.mesh = undefined;
  }
}
