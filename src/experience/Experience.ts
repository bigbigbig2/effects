import { Renderer } from "./core/Renderer";
import { Time } from "./core/Time";
import { Input } from "./core/Input";
import { Assets } from "./core/Assets";
import { WorkScene } from "./scenes/WorkScene";
import { MediaScene } from "./scenes/MediaScene";
import { WavvesScene } from "./scenes/WavvesScene";
import { WorkThumbScene } from "./scenes/WorkThumbScene";
import { MainComposite } from "./pipeline/MainComposite";
import { ScrollDriver } from "./motion/ScrollDriver";
import { TweenDriver } from "./motion/TweenDriver";
import { Soundscape } from "./audio/Soundscape";
import { projects } from "./data/projects";
import * as THREE from "three";

export type ExperienceOptions = {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
};

type UiSelectDetail = {
  index: number;
};

type UiActiveDetail = {
  index: number;
  progress: number;
};

export class Experience {
  private renderer: Renderer;
  private time: Time;
  private input: Input;
  private assets: Assets;
  private workScene: WorkScene;
  private mediaScene: MediaScene;
  private wavvesScene: WavvesScene;
  private workThumbScene: WorkThumbScene;
  private mainComposite: MainComposite;
  private scroll: ScrollDriver;
  private tween: TweenDriver;
  private sound: Soundscape;
  private onResize = () => this.resize();
  private onSelect = (event: Event) => this.handleSelect(event as CustomEvent<UiSelectDetail>);
  private activeIndex = 0;
  private mediaEnabled = false;

  constructor({ canvas, container }: ExperienceOptions) {
    this.renderer = new Renderer({ canvas, container });
    this.input = new Input(container);
    this.assets = new Assets();
    this.scroll = new ScrollDriver();
    this.tween = new TweenDriver();
    this.sound = new Soundscape();
    this.workScene = new WorkScene(this.renderer.instance, projects, {
      perlin: null,
      noise: null,
      env: null,
    });
    this.mediaScene = new MediaScene(this.renderer.instance, this.assets, projects);
    this.wavvesScene = new WavvesScene(this.renderer.instance);
    this.workThumbScene = new WorkThumbScene(
      this.renderer.instance,
      this.assets,
      projects
    );
    this.mainComposite = new MainComposite(this.renderer.instance, {
      noise: null,
      perlin: null,
    });
    this.workScene.setActiveIndex(0);
    this.workScene.setSpotLightMap(this.workThumbScene.texture);

    this.loadCoreTextures();

    window.addEventListener("resize", this.onResize);
    window.addEventListener("ui:select", this.onSelect as EventListener);
    this.time = new Time((delta, elapsed) => this.update(delta, elapsed));

    this.resize();
  }

  private async loadCoreTextures() {
    try {
      const [noise, perlin1, perlin2] = await Promise.all([
        this.assets.loadTexture("/images/textures/blue-noise.png"),
        this.assets.loadTexture("/images/textures/perlin-1.webp"),
        this.assets.loadTexture("/images/textures/perlin-2.webp"),
      ]);

      noise.colorSpace = THREE.NoColorSpace;
      noise.wrapS = THREE.RepeatWrapping;
      noise.wrapT = THREE.RepeatWrapping;

      perlin1.colorSpace = THREE.NoColorSpace;
      perlin1.wrapS = THREE.RepeatWrapping;
      perlin1.wrapT = THREE.RepeatWrapping;

      perlin2.colorSpace = THREE.NoColorSpace;
      perlin2.wrapS = THREE.RepeatWrapping;
      perlin2.wrapT = THREE.RepeatWrapping;

      this.workScene.setNoiseTexture(noise);
      this.workScene.setPerlinTexture(perlin1);
      this.mainComposite.setNoiseTexture(noise);
      this.mainComposite.setPerlinTexture(perlin2);
    } catch (error) {
      // Ignore core texture load errors; fallback textures will be used.
    }

    const cubeLoader = new THREE.CubeTextureLoader();
    cubeLoader.setPath("/images/cubemaps/01/");
    cubeLoader.load(
      ["px.webp", "nx.webp", "ny.webp", "py.webp", "pz.webp", "nz.webp"],
      (cube) => {
        cube.colorSpace = THREE.SRGBColorSpace;
        this.workScene.setEnvironment(cube);
      }
    );
  }

  private resize() {
    this.renderer.resize();
    const { width, height, pixelRatio } = this.renderer.sizes;
    this.workScene.resize(width, height, pixelRatio);
    this.mediaScene.resize(width, height, pixelRatio);
    this.wavvesScene.resize(width, height, pixelRatio);
    this.workThumbScene.resize(width, height, 1);
    this.mainComposite.resize(width, height);
  }

  private handleSelect(event: CustomEvent<UiSelectDetail>) {
    const { index } = event.detail || { index: 0 };
    const count = projects.length;
    if (count <= 1) return;
    const clamped = Math.max(0, Math.min(count - 1, index));
    const targetProgress = clamped / (count - 1);
    this.scroll.scrollToProgress(targetProgress);
  }

  private emitActive(progress: number) {
    const count = projects.length;
    if (count === 0) return;
    const index = count === 1 ? 0 : Math.round(progress * (count - 1));

    if (index === this.activeIndex) return;
    this.activeIndex = index;

    this.workScene.setActiveIndex(index);
    if (this.mediaEnabled) {
      this.mediaScene.setActiveIndex(index);
    }

    const detail: UiActiveDetail = { index, progress };
    window.dispatchEvent(new CustomEvent<UiActiveDetail>("ui:active", { detail }));
  }

  private update(delta: number, elapsed: number) {
    this.scroll.update();
    this.tween.update(this.scroll.progress, this.scroll.velocity);

    const { width, height, pixelRatio } = this.renderer.sizes;

    this.wavvesScene.update(elapsed);
    this.workThumbScene.update(-this.tween.progress);
    this.workScene.update({
      time: elapsed,
      delta,
      dpr: pixelRatio,
      input: this.input,
      tween: this.tween,
      displacementTexture: this.wavvesScene.texture,
      size: { width, height },
    });
    this.mediaScene.update();

    this.sound.update(this.tween.velocity);

    const bloomTexture = this.workScene.renderManager.renderTargetsHorizontal?.[0]?.texture ?? null;
    const mouseTexture = this.workScene.renderManager.mouseSimulation?.bufferSim.output.texture ?? null;

    this.mainComposite.render({
      time: elapsed,
      work: this.workScene.texture,
      media: this.mediaEnabled ? this.mediaScene.texture : null,
      mouse: mouseTexture,
      bloom: bloomTexture,
      ratio: width / height,
      fluidStrength: 0,
    });

    this.emitActive(this.tween.progress);
  }

  destroy() {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("ui:select", this.onSelect as EventListener);
    this.time.stop();
    this.input.destroy();
    this.scroll.destroy();
    this.tween.destroy();
    this.sound.destroy();
    this.assets.destroy();
    this.renderer.destroy();
  }
}
