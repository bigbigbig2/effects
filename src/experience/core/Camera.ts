import * as THREE from "three";
import type { Renderer } from "./Renderer";

export class Camera {
  readonly instance: THREE.PerspectiveCamera;

  constructor(renderer: Renderer) {
    this.instance = new THREE.PerspectiveCamera(
      50,
      renderer.sizes.width / renderer.sizes.height,
      0.1,
      100
    );

    this.instance.position.set(0, 0, 3);
    this.instance.lookAt(0, 0, 0);
  }

  resize(sizes: { width: number; height: number }) {
    this.instance.aspect = sizes.width / sizes.height;
    this.instance.updateProjectionMatrix();
  }
}
