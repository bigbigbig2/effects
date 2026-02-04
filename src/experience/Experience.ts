import { Renderer } from "./core/Renderer";
import { Time } from "./core/Time";
import { Input } from "./core/Input";
import { Assets } from "./core/Assets";
import { WorkScene } from "./scenes/WorkScene";
import { MediaScene } from "./scenes/MediaScene";
import { WavvesScene } from "./scenes/WavvesScene";
import { SkyScene } from "./scenes/SkyScene";
import { WorkThumbScene } from "./scenes/WorkThumbScene";
import { MainComposite } from "./pipeline/MainComposite";
import { ScrollDriver } from "./motion/ScrollDriver";
import { TweenDriver } from "./motion/TweenDriver";
import { Soundscape } from "./audio/Soundscape";
import { projects } from "./data/projects";
import { getSettings, setSettings } from "./settings";
import * as THREE from "three";

// 体验初始化的配置选项
export type ExperienceOptions = {
  canvas: HTMLCanvasElement; // 渲染的目标 Canvas
  container: HTMLElement;    // Canvas 的父容器，用于监听尺寸变化
};

// UI 选择事件的详情
type UiSelectDetail = {
  index: number;
};

// UI 活动事件的详情
type UiActiveDetail = {
  index: number;
  progress: number;
};

// Experience 类：
// 整个 3D 体验的核心控制器（God Class）。
// 负责初始化各个子系统（渲染器、场景、资源、输入等），并管理主循环。
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
  private skyScene: SkyScene;
  private scroll: ScrollDriver;
  private tween: TweenDriver;
  private sound: Soundscape;
  
  // 事件处理函数绑定
  private onResize = () => this.resize();
  private onSelect = (event: Event) => this.handleSelect(event as CustomEvent<UiSelectDetail>);
  
  // 状态变量
  private activeIndex = 0;
  private mediaEnabled = false;
  private stepIndex = 0;
  private stepCooldown = 0;
  private stepLocked = false;
  
  // 后处理效果的缓存值（用于平滑过渡）
  private lastBloomStrength = 0;
  private lastBloomRadius = 0;
  private lastBloomEnabled = true;
  private lastLuminosityEnabled = true;
  private lastLuminosityThreshold = 0;
  private lastLuminositySmoothing = 0;

  private lastThemeIndex = -1;

  constructor({ canvas, container }: ExperienceOptions) {
    // 1. 初始化核心系统
    this.renderer = new Renderer({ canvas, container });
    this.input = new Input(container);
    this.assets = new Assets();
    this.scroll = new ScrollDriver();
    this.tween = new TweenDriver();
    this.sound = new Soundscape();
    this.skyScene = new SkyScene(this.renderer.instance);

    // 2. 初始化各个场景
    // WorkScene: 主作品展示场景
    this.workScene = new WorkScene(this.renderer.instance, projects, {
      perlin: null,
      noise: null,
      env: null,
    });
    // MediaScene: 媒体详情展示场景
    this.mediaScene = new MediaScene(this.renderer.instance, this.assets, projects);
    // WavvesScene: 背景波浪/流体效果
    this.wavvesScene = new WavvesScene(this.renderer.instance);
    // WorkThumbScene: 作品缩略图渲染（可能用于生成光照贴图或预览）
    this.workThumbScene = new WorkThumbScene(
      this.renderer.instance,
      this.assets,
      projects
    );

    // 3. 初始化合成器（后处理管线）
    this.mainComposite = new MainComposite(this.renderer.instance, {
      noise: null,
      perlin: null,
    });

    // 4. 场景关联与设置
    this.workScene.setActiveIndex(0);
    this.workScene.setSpotLightMap(this.workThumbScene.texture);
    this.applyProjectTheme(0);
    const skyTexture = this.skyScene.texture;
    skyTexture.wrapS = THREE.RepeatWrapping;
    skyTexture.wrapT = THREE.RepeatWrapping;
    this.workScene.setSkyTexture(skyTexture);

    // 5. 加载核心纹理资源
    this.loadCoreTextures();

    // 6. 绑定全局事件监听
    window.addEventListener("resize", this.onResize);
    window.addEventListener("ui:select", this.onSelect as EventListener);

    // 7. 启动时间循环（每一帧调用 update）
    this.time = new Time((delta, elapsed) => this.update(delta, elapsed));

    // 8. 初始调整尺寸
    this.resize();
  }

  // 加载核心纹理（噪声、Perlin、法线贴图等）
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

  private resize() {
    this.renderer.resize();
    const { width, height, pixelRatio } = this.renderer.sizes;
    this.skyScene.resize(width, height, pixelRatio);
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
    this.applyProjectTheme(index);

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

    this.skyScene.update(elapsed);
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

    const bloomTexture = null;
    const mouseTexture = this.workScene.renderManager.mouseSimulation?.bufferSim.output.texture ?? null;

    this.mainComposite.render({
      time: elapsed,
      work: this.workScene.texture,
      media: this.mediaEnabled ? this.mediaScene.texture : null,
      mouse: mouseTexture,
      bloom: bloomTexture,
      fluid: this.wavvesScene.texture,
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
    this.mainComposite.setToneMapping(render.toneMapping, render.toneMappingExposure);
    this.mainComposite.setBloom({
      enabled: render.bloomEnabled,
      strength: render.bloomStrength,
      radius: render.bloomRadius,
      threshold: render.luminosityThreshold,
      smoothing: render.luminositySmoothing,
      luminanceEnabled: render.luminosityEnabled,
    });
    const compositeUniforms = this.workScene.renderManager.compositeMaterial.uniforms;
    compositeUniforms.uDarken.value = render.darken;
    compositeUniforms.uSaturation.value = render.saturation;

    const rmSettings = this.workScene.renderManager.settings;
    rmSettings.bloom.enabled = false;
    rmSettings.luminosity.enabled = false;

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
    mainUniforms.uBgColor.value.set(settings.composite.bgColor).convertLinearToSRGB();
  }


  private applyProjectTheme(index: number) {
    if (index === this.lastThemeIndex) return;
    const project = projects[index];
    if (!project) return;
    this.lastThemeIndex = index;

    const settings = getSettings();
    const primary = project.colors?.primary ?? "#bcbcbc";
    const secondary = project.colors?.secondary ?? "#464646";
    const ambientIntensity = settings.work.ambientIntensity ?? project.ambient;
    const ambientColor =
      ambientIntensity < 0 && project.colors?.invert ? project.colors.invert : secondary;
    const darken = project.darkenOverview ?? settings.render.darken;
    const saturation = project.saturation ?? settings.render.saturation;
    const contrast = project.contrast ?? settings.composite.contrast;
    const mediaBackground = project.colors?.media ?? primary;
    const thumb = project.thumbnail ?? {};

    this.setMainColor(primary);
    this.workScene.setBlocksColor(primary);
    this.workScene.setAmbientLight(ambientColor, ambientIntensity);
    this.mediaScene.setBackgroundColor(mediaBackground);
    this.workThumbScene.setThumbSettings({
      darkness: thumb.darkness ?? 0,
      darknessColor: thumb.darknessColor ?? "#000000",
      saturation: thumb.saturation ?? 1,
    });
    this.mainComposite.material.uniforms.uBgColor.value
      .set(mediaBackground)
      .convertLinearToSRGB();

    setSettings({
      render: { darken, saturation },
      composite: { contrast, bgColor: mediaBackground },
      work: {
        ambientIntensity,
        mouseLightness: thumb.mouseLightness ?? settings.work.mouseLightness,
      },
    });
  }

  private setMainColor(color: string) {
    if (typeof document === "undefined") return;
    const elements = document.querySelectorAll<HTMLElement>(".c-color");
    elements.forEach((el) => {
      el.style.color = color;
    });
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
