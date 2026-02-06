import * as THREE from "three";
import type { Renderer } from "../core/Renderer";
import type { Assets } from "../core/Assets";
import type { Input } from "../core/Input";
import type { TweenDriver } from "../motion/TweenDriver";
import type { ExperienceSettings, DebugView } from "../settings";
import type { ProjectItem } from "../data/projects";
import { WorkScene } from "../scenes/WorkScene";
import { MediaScene } from "../scenes/MediaScene";
import { WavvesScene } from "../scenes/WavvesScene";
import { SkyScene } from "../scenes/SkyScene";
import { WorkThumbScene } from "../scenes/WorkThumbScene";
import { MainComposite } from "./MainComposite";

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

const DEBUG_VIEW_INDEX: Record<DebugView, number> = {
  final: 0,
  work: 1,
  media: 2,
  bloom: 3,
  mouse: 4,
  fluid: 5,
  noise: 6,
  perlin: 7,
  bg: 8,
  sky: 9,
  thumb: 10,
};

export class RenderPipeline {
  readonly renderer: Renderer;
  readonly workScene: WorkScene;
  readonly mediaScene: MediaScene;
  readonly wavvesScene: WavvesScene;
  readonly workThumbScene: WorkThumbScene;
  readonly mainComposite: MainComposite;
  readonly skyScene: SkyScene;

  private assets: Assets;
  private projects: ProjectItem[];
  private activeIndex = 0;

  constructor(renderer: Renderer, assets: Assets, projects: ProjectItem[]) {
    this.renderer = renderer;
    this.assets = assets;
    this.projects = projects;

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
      .convertLinearToSRGB();
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
    const bloomTexture = this.workScene.renderManager.settings.bloom.enabled
      ? this.workScene.renderManager.renderTargetsHorizontal[0].texture
      : null;

    this.mainComposite.render({
      time,
      work: this.workScene.texture,
      media: mediaEnabled ? this.mediaScene.texture : null,
      mouse: mouseTexture,
      bloom: bloomTexture,
      fluid: this.wavvesScene.texture,
      sky: this.skyScene.texture,
      thumb: this.workThumbScene.texture,
      ratio: size.width / size.height,
      fluidStrength: settings.composite.fluidStrength,
    });
    this.renderer.render(this.mainComposite.scene, this.mainComposite.camera);
  }

  private applySettings(settings: ExperienceSettings) {
    const render = settings.render;

    // 注意：虽然 WorkScene 的 shader 不再使用 darken 和 saturation
    // 但我们仍然需要设置这些 uniforms，以保持 GUI 控制的响应性
    const compositeUniforms = this.workScene.renderManager.compositeMaterial.uniforms;
    compositeUniforms.uDarken.value = render.darken;
    compositeUniforms.uSaturation.value = render.saturation;

    const rmSettings = this.workScene.renderManager.settings;
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
    this.workScene.renderManager.updateBloom();

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
    this.workScene.setEnvironmentShaderSettings({
      darken: settings.work.envDarken,
      shader1Alpha: settings.work.envShader1Alpha,
      shader1Speed: settings.work.envShader1Speed,
      shader1Scale: settings.work.envShader1Scale,
      shader2Alpha: settings.work.envShader2Alpha,
      shader2Scale: settings.work.envShader2Scale,
      shader3Alpha: settings.work.envShader3Alpha,
      shader3Speed: settings.work.envShader3Speed,
      shader3Scale: settings.work.envShader3Scale,
      shader1Mix3: settings.work.envShader1Mix3,
    });
    this.workScene.setMouseSettings({
      factor: settings.work.mouseFactor,
      lightness: settings.work.mouseLightness,
      thickness: settings.work.mouseThickness,
      persistance: settings.work.mousePersistance,
      pressure: settings.work.mousePressure,
    });

    // MainComposite 统一处理所有后处理效果
    const mainUniforms = this.mainComposite.material.uniforms;
    mainUniforms.uContrast.value = settings.composite.contrast;
    mainUniforms.uPerlin.value = settings.composite.perlin;
    mainUniforms.uFluidStrength.value = settings.composite.fluidStrength;
    mainUniforms.uMediaReveal.value = settings.composite.mediaReveal;
    mainUniforms.uBgColor.value.set(settings.composite.bgColor).convertLinearToSRGB();
    
    // 新增：色调映射和曝光度控制
    mainUniforms.uEnableToneMapping.value = settings.composite.enableToneMapping;
    mainUniforms.uExposure.value = settings.composite.exposure;
    
    // 新增：从 render 设置迁移到 MainComposite
    mainUniforms.uDarken.value = render.darken;
    mainUniforms.uSaturation.value = render.saturation;
    
    // 新增：层可见性控制
    mainUniforms.uShowWork.value = settings.layers.showWork;
    mainUniforms.uShowMedia.value = settings.layers.showMedia;
    mainUniforms.uShowMouse.value = settings.layers.showMouse;
    mainUniforms.uShowBloom.value = settings.layers.showBloom;
    mainUniforms.uShowFluid.value = settings.layers.showFluid;
    mainUniforms.uDebugView.value = DEBUG_VIEW_INDEX[settings.layers.debugView] ?? 0;

    const skyUniforms = this.skyScene.renderManager.compositeMaterial.uniforms;
    skyUniforms.uShader1Alpha.value = settings.sky.shader1Alpha;
    skyUniforms.uShader1Speed.value = settings.sky.shader1Speed;
    skyUniforms.uShader1Scale.value = settings.sky.shader1Scale;
    skyUniforms.uShader2Speed.value = settings.sky.shader2Speed;
    skyUniforms.uShader2Scale.value = settings.sky.shader2Scale;
    skyUniforms.uShaderMix.value = settings.sky.shaderMix;
  }

  destroy() {
  }
}
