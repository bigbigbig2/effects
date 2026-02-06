import * as THREE from "three";
import type { Renderer } from "../core/Renderer";
import type { Assets } from "../core/Assets";
import type { Input } from "../core/Input";
import type { TweenDriver } from "../motion/TweenDriver";
import type { ExperienceSettings } from "../settings";
import type { ProjectItem } from "../data/projects";
import { WorkScene } from "../scenes/WorkScene";
import { WorkThumbScene } from "../scenes/WorkThumbScene";

// 每帧渲染调度所需的输入
type PipelineUpdate = {
  time: number;
  delta: number;
  dpr: number;
  input: Input;
  tween: TweenDriver;
  size: { width: number; height: number };
  settings: ExperienceSettings;
};

// 主题色与投影缩略图参数
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

/**
 * RenderPipeline
 *
 * 作用：
 * - 统一调度 WorkScene 与 WorkThumbScene
 * - 负责纹理加载、参数下发、每帧更新流程
 *
 * 当前架构下：Work 为最终输出
 */
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

    // 主场景（Work）
    this.workScene = new WorkScene(this.renderer.instance, projects, {
      perlin: null,
      noise: null,
      env: null,
    });

    // 缩略图离屏场景（用于 SpotLight 投影）
    this.workThumbScene = new WorkThumbScene(this.renderer.instance, this.assets, projects);

    // 将缩略图纹理作为 SpotLight 的 gobo 投影
    this.workScene.setSpotLightMap(this.workThumbScene.texture);

    this.loadCoreTextures();

    // 位移纹理占位（当前 WorkScreen 依赖该输入）
    this.displacementTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    this.displacementTexture.needsUpdate = true;
  }

  private async loadCoreTextures() {
    try {
      // 噪声 / Perlin / 地面法线
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

    // 环境贴图（立方体贴图）
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

  // Resize：同步场景、渲染器、离屏纹理尺寸
  resize(width: number, height: number, pixelRatio: number) {
    this.workScene.resize(width, height, pixelRatio);
    this.workThumbScene.resize(width, height, 1);
  }

  // 切换当前激活项目
  setActiveIndex(index: number) {
    this.activeIndex = index;
    this.workScene.setActiveIndex(index);
  }

  // 主题色 + 缩略图投影参数
  applyTheme(payload: ThemePayload) {
    this.workScene.setBlocksColor(payload.blocksColor);
    this.workScene.setAmbientLight(payload.ambientColor, payload.ambientIntensity);
    this.workThumbScene.setThumbSettings(payload.thumb);
  }

  // 每帧更新
  update({ time, delta, dpr, input, tween, size, settings }: PipelineUpdate) {
    this.applySettings(settings);

    // 更新主场景
    this.workScene.update({
      time,
      delta,
      dpr,
      input,
      tween,
      displacementTexture: this.displacementTexture,
      size,
    });
    // 更新缩略图投影
    this.workThumbScene.update(-tween.progress);

  }

  // 把 settings 写入各子系统
  private applySettings(settings: ExperienceSettings) {
    const render = settings.render;

    // Work 合成色彩控制（暗化/饱和度）
    const compositeUniforms = this.workScene.renderManager.compositeMaterial.uniforms;
    compositeUniforms.uDarken.value = render.darken;
    compositeUniforms.uSaturation.value = render.saturation;

    // 后处理：Bloom / Luminosity
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

    // 场景层：可见性 / 灯光
    this.workScene.setVisibilityMode(settings.work.onlyActiveVisible);
    this.workScene.setLightIntensity(settings.work.ambientIntensity, settings.work.spotIntensity);
    this.workScene.setFog(
      settings.work.fogEnabled,
      settings.work.fogColor,
      settings.work.fogNear,
      settings.work.fogFar
    );
    // 地面材质与反射参数
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
    // 环境背景 Shader 参数
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
    // 鼠标模拟参数（每个 WorkScreen）
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
