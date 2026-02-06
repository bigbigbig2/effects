import * as THREE from "three";
import type { Renderer } from "../core/Renderer";
import type { Assets } from "../core/Assets";
import type { Input } from "../core/Input";
import type { TweenDriver } from "../motion/TweenDriver";
import type { ExperienceSettings } from "../settings";
import type { ProjectItem } from "../data/projects";
import { WorkScene } from "../scenes/WorkScene";
import { WorkThumbScene } from "../scenes/WorkThumbScene";

type PipelineUpdate = {
  time: number;
  delta: number;
  dpr: number;
  input: Input;
  tween: TweenDriver;
  size: { width: number; height: number };
  settings: ExperienceSettings;
};

type ThemePayload = {
  blocksColor: string;
  ambientColor: string;
  ambientIntensity: number;
  thumb: {
    darkness: number;
    darknessColor: string;
    saturation: number;
  };
};

export class RenderPipeline {
  readonly renderer: Renderer;
  readonly workScene: WorkScene;
  readonly workThumbScene: WorkThumbScene;

  private assets: Assets;
  private projects: ProjectItem[];
  private activeIndex = 0;
  private displacementTexture: THREE.Texture;

  constructor(renderer: Renderer, assets: Assets, projects: ProjectItem[]) {
    this.renderer = renderer;
    this.assets = assets;
    this.projects = projects;

    this.workScene = new WorkScene(this.renderer.instance, projects, {
      perlin: null,
      noise: null,
      env: null,
    });

    this.workThumbScene = new WorkThumbScene(this.renderer.instance, this.assets, projects);

    this.workScene.setSpotLightMap(this.workThumbScene.texture);

    this.loadCoreTextures();

    this.displacementTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    this.displacementTexture.needsUpdate = true;
  }

  private async loadCoreTextures() {
    try {
      const [noise, perlin1, floorNormal] = await Promise.all([
        this.assets.loadTexture("/images/textures/blue-noise.png"),
        this.assets.loadTexture("/images/textures/perlin-1.webp"),
        this.assets.loadTexture("/images/textures/floor-normal.webp"),
      ]);

      noise.colorSpace = THREE.NoColorSpace;
      noise.wrapS = THREE.RepeatWrapping;
      noise.wrapT = THREE.RepeatWrapping;

      perlin1.colorSpace = THREE.NoColorSpace;
      perlin1.wrapS = THREE.RepeatWrapping;
      perlin1.wrapT = THREE.RepeatWrapping;

      this.workScene.setNoiseTexture(noise);
      this.workScene.setPerlinTexture(perlin1);
      this.workScene.setSkyTexture(perlin1);

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
    this.workScene.resize(width, height, pixelRatio);
    this.workThumbScene.resize(width, height, 1);
  }

  setActiveIndex(index: number) {
    this.activeIndex = index;
    this.workScene.setActiveIndex(index);
  }

  applyTheme(payload: ThemePayload) {
    this.workScene.setBlocksColor(payload.blocksColor);
    this.workScene.setAmbientLight(payload.ambientColor, payload.ambientIntensity);
    this.workThumbScene.setThumbSettings(payload.thumb);
  }

  update({ time, delta, dpr, input, tween, size, settings }: PipelineUpdate) {
    this.applySettings(settings);

    this.workScene.update({
      time,
      delta,
      dpr,
      input,
      tween,
      displacementTexture: this.displacementTexture,
      size,
    });
    this.workThumbScene.update(-tween.progress);

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

  }

  destroy() {
  }
}
