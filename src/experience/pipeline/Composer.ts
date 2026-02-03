import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader";
import type { Renderer } from "../core/Renderer";
import type { Scene } from "../core/Scene";
import type { Camera } from "../core/Camera";

export class Composer {
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private rgbShiftPass: ShaderPass;
  private filmPass: FilmPass;

  constructor(
    private renderer: Renderer,
    private scene: Scene,
    private camera: Camera
  ) {
    this.composer = new EffectComposer(this.renderer.instance);
    this.renderPass = new RenderPass(this.scene.instance, this.camera.instance);
    this.rgbShiftPass = new ShaderPass(RGBShiftShader);
    this.rgbShiftPass.uniforms.amount.value = 0.001;
    this.rgbShiftPass.uniforms.angle.value = 0.0;
    this.filmPass = new FilmPass(0.15, 0.05, 648, false);

    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.rgbShiftPass);
    this.composer.addPass(this.filmPass);

    this.resize();
  }

  render() {
    this.composer.render();
  }

  resize() {
    const { width, height, pixelRatio } = this.renderer.sizes;
    this.composer.setSize(width, height);
    this.composer.setPixelRatio(pixelRatio);
  }

  destroy() {
    if (typeof this.composer.dispose === "function") {
      this.composer.dispose();
    }
  }
}
