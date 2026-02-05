import * as THREE from "three";
import type { Renderer } from "../core/Renderer";
import type { Assets } from "../core/Assets";
import type { Input } from "../core/Input";
import type { TweenDriver } from "../motion/TweenDriver";
import type { ExperienceSettings } from "../settings";
import type { ProjectItem } from "../data/projects";
import { WorkScene } from "../scenes/WorkScene";
import { MediaScene } from "../scenes/MediaScene";
import { WavvesScene } from "../scenes/WavvesScene";
import { SkyScene } from "../scenes/SkyScene";
import { WorkThumbScene } from "../scenes/WorkThumbScene";
import { MainComposite } from "./MainComposite";
import { PostProcessor } from "./PostProcessor";

type PipelineUpdate = {
  time: number;
  delta: number;
  dpr: number;
  input: Input;
  tween: TweenDriver;
  size: { width: number; height: number };
  settings: ExperienceSettings;
  mediaEnabled: boolean;
};

type ThemePayload = {
  blocksColor: string;
  ambientColor: string;
  ambientIntensity: number;
  mediaBackground: string;
  thumb: {
    darkness: number;
    darknessColor: string;
    saturation: number;
  };
  compositeBg: string;
};

export class RenderPipeline {
  readonly renderer: Renderer;
  readonly workScene: WorkScene;
  readonly mediaScene: MediaScene;
  readonly wavvesScene: WavvesScene;
  readonly workThumbScene: WorkThumbScene;
  readonly mainComposite: MainComposite;
  readonly post: PostProcessor;
  readonly skyScene: SkyScene;

  private assets: Assets;
  private projects: ProjectItem[];
  private activeIndex = 0;

  constructor(renderer: Renderer, assets: Assets, projects: ProjectItem[]) {
    this.renderer = renderer;
    this.assets = assets;
    this.projects = projects;

    this.post = new PostProcessor(this.renderer.instance);
    this.skyScene = new SkyScene(this.renderer.instance);

    this.workScene = new WorkScene(this.renderer.instance, projects, {
      perlin: null,
      noise: null,
      env: null,
    });
    this.mediaScene = new MediaScene(this.renderer.instance, this.assets, projects);
    this.wavvesScene = new WavvesScene(this.renderer.instance);
    this.workThumbScene = new WorkThumbScene(this.renderer.instance, this.assets, projects);

    this.mainComposite = new MainComposite(this.renderer, {
      noise: null,
      perlin: null,
    });

    this.workScene.setSpotLightMap(this.workThumbScene.texture);

    const skyTexture = this.skyScene.texture;
    skyTexture.wrapS = THREE.RepeatWrapping;
    skyTexture.wrapT = THREE.RepeatWrapping;
    this.workScene.setSkyTexture(skyTexture);

    this.loadCoreTextures();
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
      floorNormal.repeat.set(45, 45);
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

  resize(width: number, height: number, pixelRatio: number) {
    this.skyScene.resize(width, height, pixelRatio);
    this.workScene.resize(width, height, pixelRatio);
    this.mediaScene.resize(width, height, pixelRatio);
    this.wavvesScene.resize(width, height, pixelRatio);
    this.workThumbScene.resize(width, height, 1);
    this.mainComposite.resize(width, height, pixelRatio);
    this.post.resize(width, height);
  }

  setActiveIndex(index: number, mediaEnabled: boolean) {
    this.activeIndex = index;
    this.workScene.setActiveIndex(index);
    if (mediaEnabled) {
      this.mediaScene.setActiveIndex(index);
    }
  }

  applyTheme(payload: ThemePayload) {
    this.workScene.setBlocksColor(payload.blocksColor);
    this.workScene.setAmbientLight(payload.ambientColor, payload.ambientIntensity);
    this.mediaScene.setBackgroundColor(payload.mediaBackground);
    this.workThumbScene.setThumbSettings(payload.thumb);
    this.mainComposite.material.uniforms.uBgColor.value
      .set(payload.compositeBg)
      .convertSRGBToLinear();
  }

  update({ time, delta, dpr, input, tween, size, settings, mediaEnabled }: PipelineUpdate) {
    this.applySettings(settings);

    this.skyScene.update(time);
    this.wavvesScene.update(time);
    this.workThumbScene.update(-tween.progress);
    this.workScene.update({
      time,
      delta,
      dpr,
      input,
      tween,
      displacementTexture: this.wavvesScene.texture,
      size,
    });
    this.mediaScene.update();

    const mouseTexture =
      this.workScene.renderManager.mouseSimulation?.bufferSim.output.texture ?? null;

    this.mainComposite.render({
      time,
      work: this.workScene.texture,
      media: mediaEnabled ? this.mediaScene.texture : null,
      mouse: mouseTexture,
      bloom: null,
      fluid: this.wavvesScene.texture,
      ratio: size.width / size.height,
      fluidStrength: settings.composite.fluidStrength,
    });

    this.post.render(this.mainComposite.texture);
  }

  private applySettings(settings: ExperienceSettings) {
    const render = settings.render;
    this.post.setToneMapping(render.toneMapping, render.toneMappingExposure);
    this.post.setOutputColorSpace(render.outputColorSpace);
    this.post.setBloom({
      enabled: render.bloomEnabled,
      strength: render.bloomStrength,
      radius: render.bloomRadius,
      threshold: render.luminosityThreshold,
      smoothing: render.luminositySmoothing,
      luminanceEnabled: render.luminosityEnabled,
      debug: render.debugBloom,
    });

    const compositeUniforms = this.workScene.renderManager.compositeMaterial.uniforms;
    compositeUniforms.uDarken.value = render.darken;
    compositeUniforms.uSaturation.value = render.saturation;

    const rmSettings = this.workScene.renderManager.settings;
    rmSettings.bloom.enabled = false;
    rmSettings.luminosity.enabled = false;

    this.workScene.setVisibilityMode(settings.work.onlyActiveVisible);
    this.workScene.setLightIntensity(settings.work.ambientIntensity, settings.work.spotIntensity);
    this.workScene.setFog(
      settings.work.fogEnabled,
      settings.work.fogColor,
      settings.work.fogNear,
      settings.work.fogFar
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
    this.workScene.setEnvironmentTint(settings.work.envTint);
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
    mainUniforms.uBgColor.value.set(settings.composite.bgColor).convertSRGBToLinear();
  }

  destroy() {
    this.post.destroy();
  }
}
