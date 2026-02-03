import { Renderer } from "./core/Renderer";
import { Scene } from "./core/Scene";
import { Camera } from "./core/Camera";
import { Time } from "./core/Time";
import { Input } from "./core/Input";
import { Assets } from "./core/Assets";
import { ScreenRing } from "./world/ScreenRing";
import { Composer } from "./pipeline/Composer";
import { ScrollDriver } from "./motion/ScrollDriver";
import { TweenDriver } from "./motion/TweenDriver";
import { Soundscape } from "./audio/Soundscape";

export type ExperienceOptions = {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
};

export class Experience {
  private renderer: Renderer;
  private scene: Scene;
  private camera: Camera;
  private time: Time;
  private input: Input;
  private assets: Assets;
  private world: ScreenRing;
  private composer: Composer;
  private scroll: ScrollDriver;
  private tween: TweenDriver;
  private sound: Soundscape;
  private onResize = () => this.resize();

  constructor({ canvas, container }: ExperienceOptions) {
    this.renderer = new Renderer({ canvas, container });
    this.scene = new Scene();
    this.camera = new Camera(this.renderer);
    this.input = new Input(container);
    this.assets = new Assets();
    this.scroll = new ScrollDriver();
    this.tween = new TweenDriver();
    this.sound = new Soundscape();
    this.world = new ScreenRing(this.scene.instance, this.assets);
    this.composer = new Composer(this.renderer, this.scene, this.camera);

    window.addEventListener("resize", this.onResize);
    this.time = new Time((delta, elapsed) => this.update(delta, elapsed));
  }

  private resize() {
    this.renderer.resize();
    this.camera.resize(this.renderer.sizes);
    this.composer.resize();
  }

  private update(delta: number, elapsed: number) {
    this.scroll.update();
    this.tween.update(this.scroll.progress, this.scroll.velocity);
    this.world.update({
      delta,
      elapsed,
      scroll: this.scroll,
      tween: this.tween,
      input: this.input,
      camera: this.camera,
    });
    this.sound.update(this.tween.velocity);
    this.composer.render();
  }

  destroy() {
    window.removeEventListener("resize", this.onResize);
    this.time.stop();
    this.input.destroy();
    this.scroll.destroy();
    this.tween.destroy();
    this.sound.destroy();
    this.world.destroy();
    this.assets.destroy();
    this.composer.destroy();
    this.renderer.destroy();
  }
}
