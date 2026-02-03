import type { Renderer } from "../core/Renderer";
import type { Scene } from "../core/Scene";
import type { Camera } from "../core/Camera";

export class Composer {
  constructor(
    private renderer: Renderer,
    private scene: Scene,
    private camera: Camera
  ) {}

  render() {
    this.renderer.render(this.scene.instance, this.camera.instance);
  }

  resize() {
    // TODO: connect post-processing when introduced.
  }

  destroy() {
    // TODO: dispose passes.
  }
}
