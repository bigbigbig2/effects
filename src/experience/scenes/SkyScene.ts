import * as THREE from "three";
import { SkyRenderManager } from "../pipeline/SkyRenderManager";

export class SkyScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly renderManager: SkyRenderManager;

  constructor(renderer: THREE.WebGLRenderer) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#666666").convertLinearToSRGB();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderManager = new SkyRenderManager(renderer, this.scene, this.camera);
  }

  resize(width: number, height: number, dpr: number) {
    const size = Math.max(1, Math.round(height * 0.75));
    this.renderManager.resize(size, size, 1);
  }

  update(time: number) {
    this.renderManager.update(time, this.camera, this.scene);
  }

  get texture() {
    return this.renderManager.renderTargetComposite.texture;
  }
}
