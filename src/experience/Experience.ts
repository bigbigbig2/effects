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
import { getSettings } from "./settings";
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
  private stepIndex = 0;
  private stepCooldown = 0;
  private stepLocked = false;
  private lastBloomStrength = 0;
  private lastBloomRadius = 0;
  private lastBloomEnabled = true;
  private lastLuminosityEnabled = true;
  private lastLuminosityThreshold = 0;
  private lastLuminositySmoothing = 0;

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
      const [noise, perlin1, perlin2, floorNormal] = await Promise.all([
        this.assets.loadTexture("/images/textures/blue-noise.png"),
        this.assets.loadTexture("/images/textures/perlin-1.webp"),
        this.assets.loadTexture("/images/textures/perlin-2.webp"),
        this.assets.loadTexture("/images/textures/floor-normal.webp"),
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

      floorNormal.colorSpace = THREE.NoColorSpace;
      floorNormal.wrapS = THREE.RepeatWrapping;
      floorNormal.wrapT = THREE.RepeatWrapping;
      floorNormal.repeat.set(3, 3);
      this.workScene.setGroundNormal(floorNormal);
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
    if (count <= 0) return;
    const clamped = Math.max(0, Math.min(count - 1, index));
    this.stepIndex = clamped;
    this.stepLocked = true;
    const targetProgress = clamped / count;
    const settings = getSettings();
    this.stepCooldown = settings.controls.stepCooldown;
    this.scroll.scrollToProgress(targetProgress, {
      duration: settings.controls.stepDuration,
      lock: settings.controls.lockScroll,
    });
  }

  private emitActive(progress: number) {
    const count = projects.length;
    if (count === 0) return;
    const index = count === 1 ? 0 : Math.round(progress * count) % count;

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
    const settings = getSettings();
    const controls = settings.controls;
    this.scroll.update();

    const count = projects.length;
    const absVelocity = Math.abs(this.scroll.velocity);

    if (count > 1) {
      const targetProgress = this.stepIndex / count;
      const distanceToTarget = this.scroll.progress - targetProgress;
      const absDistance = Math.abs(distanceToTarget);
      const wheelDirection = this.scroll.consumeWheelDirection(controls.wheelThreshold);

      this.stepCooldown = Math.max(0, this.stepCooldown - delta);

      if (this.stepLocked) {
        if (absDistance < controls.settleThreshold && absVelocity < controls.unlockVelocity) {
          this.stepLocked = false;
          this.stepCooldown = Math.max(this.stepCooldown, 0.18);
        }
      } else if (this.stepCooldown === 0 && (wheelDirection || absVelocity > controls.stepVelocity || absDistance > controls.stepDistance)) {
        const direction =
          wheelDirection || this.scroll.direction || (distanceToTarget === 0 ? 1 : Math.sign(distanceToTarget));
        let nextIndex = this.stepIndex + direction;
        nextIndex = (nextIndex + count) % count;
        this.stepIndex = nextIndex;
        this.stepLocked = true;
        this.stepCooldown = controls.stepCooldown;
        this.scroll.scrollToProgress(nextIndex / count, {
          duration: controls.stepDuration,
          lock: controls.lockScroll,
        });
      } else if (absVelocity < 0.005 && absDistance > controls.settleThreshold) {
        let index = Math.round(this.scroll.progress * count) % count;
        if (index < 0) index += count;
        if (index !== this.stepIndex) {
          this.stepIndex = index;
          this.stepLocked = true;
          this.scroll.scrollToProgress(index / count, {
            duration: controls.stepDuration,
            lock: controls.lockScroll,
          });
        }
      }
    }

    const { width, height, pixelRatio } = this.renderer.sizes;
    const driveProgress = count > 0 ? this.stepIndex / count : 0;
    this.tween.update(driveProgress, this.scroll.velocity);

    this.applySettings(settings, width, height, pixelRatio);

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
      fluidStrength: settings.composite.fluidStrength,
    });

    this.emitActive(this.tween.progress);
  }

  private applySettings(
    settings: ReturnType<typeof getSettings>,
    width: number,
    height: number,
    pixelRatio: number
  ) {
    const render = settings.render;
    const compositeUniforms = this.workScene.renderManager.compositeMaterial.uniforms;
    compositeUniforms.uDarken.value = render.darken;
    compositeUniforms.uSaturation.value = render.saturation;

    const rmSettings = this.workScene.renderManager.settings;
    const bloomChanged =
      render.bloomEnabled !== this.lastBloomEnabled ||
      render.bloomStrength !== this.lastBloomStrength ||
      render.bloomRadius !== this.lastBloomRadius;
    const luminosityChanged =
      render.luminosityEnabled !== this.lastLuminosityEnabled ||
      render.luminosityThreshold !== this.lastLuminosityThreshold ||
      render.luminositySmoothing !== this.lastLuminositySmoothing;

    rmSettings.bloom.enabled = render.bloomEnabled;
    rmSettings.bloom.strength = render.bloomStrength;
    rmSettings.bloom.radius = render.bloomRadius;
    rmSettings.luminosity.enabled = render.luminosityEnabled;
    rmSettings.luminosity.threshold = render.luminosityThreshold;
    rmSettings.luminosity.smoothing = render.luminositySmoothing;
    this.workScene.renderManager.luminosityMaterial.uniforms.uThreshold.value =
      render.luminosityThreshold;
    this.workScene.renderManager.luminosityMaterial.uniforms.uSmoothing.value =
      render.luminositySmoothing;

    if (bloomChanged) {
      this.workScene.renderManager.updateBloom();
    }
    if (bloomChanged || luminosityChanged) {
      this.workScene.resize(width, height, pixelRatio);
    }

    this.lastBloomEnabled = render.bloomEnabled;
    this.lastBloomStrength = render.bloomStrength;
    this.lastBloomRadius = render.bloomRadius;
    this.lastLuminosityEnabled = render.luminosityEnabled;
    this.lastLuminosityThreshold = render.luminosityThreshold;
    this.lastLuminositySmoothing = render.luminositySmoothing;

    this.workScene.setVisibilityMode(settings.work.onlyActiveVisible);
    this.workScene.setLightIntensity(settings.work.ambientIntensity, settings.work.spotIntensity);
    this.workScene.setFog(
      settings.work.fogEnabled,
      settings.work.fogColor,
      settings.work.fogDensity
    );
    this.workScene.setGroundSettings({
      enabled: settings.work.groundEnabled,
      color: settings.work.groundColor,
      roughness: settings.work.groundRoughness,
      metalness: settings.work.groundMetalness,
      opacity: settings.work.groundOpacity,
      envIntensity: settings.work.groundEnvIntensity,
      y: settings.work.groundY,
      scale: settings.work.groundScale,
    });
    this.workScene.setMouseSettings({
      factor: settings.work.mouseFactor,
      lightness: settings.work.mouseLightness,
      thickness: settings.work.mouseThickness,
      persistance: settings.work.mousePersistance,
      pressure: settings.work.mousePressure,
    });

    const mainUniforms = this.mainComposite.material.uniforms;
    mainUniforms.uContrast.value = settings.composite.contrast;
    mainUniforms.uPerlin.value = settings.composite.perlin;
    mainUniforms.uFluidStrength.value = settings.composite.fluidStrength;
    mainUniforms.uMediaReveal.value = settings.composite.mediaReveal;
    mainUniforms.uBgColor.value.set(settings.composite.bgColor).convertLinearToSRGB();
    mainUniforms.uMistStrength.value = settings.composite.mistStrength;
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
