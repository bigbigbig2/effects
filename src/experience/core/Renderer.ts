import * as THREE from "three";

type RendererOptions = {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
};

type RendererSizes = {
  width: number;
  height: number;
  pixelRatio: number;
};

export class Renderer {
  readonly instance: THREE.WebGLRenderer;
  readonly sizes: RendererSizes;
  private container: HTMLElement;

  constructor({ canvas, container }: RendererOptions) {
    this.container = container;
    this.instance = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });

    this.sizes = {
      width: 1,
      height: 1,
      pixelRatio: 1,
    };

    this.instance.setClearColor(0x0c0f12, 1);
    this.resize();
  }

  resize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.sizes.width = width;
    this.sizes.height = height;
    this.sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

    this.instance.setPixelRatio(this.sizes.pixelRatio);
    this.instance.setSize(width, height, false);
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.instance.render(scene, camera);
  }

  destroy() {
    this.instance.dispose();
  }
}
