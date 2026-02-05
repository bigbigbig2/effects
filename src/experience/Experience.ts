import { Renderer } from "./core/Renderer";
import { Time } from "./core/Time";
import { Input } from "./core/Input";
import { Assets } from "./core/Assets";
import { RenderPipeline } from "./pipeline/RenderPipeline";
import { ScrollDriver } from "./motion/ScrollDriver";
import { TweenDriver } from "./motion/TweenDriver";
import { Soundscape } from "./audio/Soundscape";
import { projects } from "./data/projects";
import { getSettings, setSettings } from "./settings";

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
  private pipeline: RenderPipeline;
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


  private lastThemeIndex = -1;

  constructor({ canvas, container }: ExperienceOptions) {
    this.renderer = new Renderer({ canvas, container });
    this.input = new Input(container);
    this.assets = new Assets();
    this.scroll = new ScrollDriver();
    this.tween = new TweenDriver();
    this.sound = new Soundscape();
    this.pipeline = new RenderPipeline(this.renderer, this.assets, projects);

    this.pipeline.setActiveIndex(0, this.mediaEnabled);
    this.applyProjectTheme(0);

    // 6. 绑定全局事件监听
    window.addEventListener("resize", this.onResize);
    window.addEventListener("ui:select", this.onSelect as EventListener);

    // 7. 启动时间循环（每一帧调用 update）
    this.time = new Time((delta, elapsed) => this.update(delta, elapsed));

    // 8. 初始调整尺寸
    this.resize();
  }

  private resize() {
    this.renderer.resize();
    const { width, height, pixelRatio } = this.renderer.sizes;
    this.pipeline.resize(width, height, pixelRatio);
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

    this.pipeline.setActiveIndex(index, this.mediaEnabled);
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

    this.sound.update(this.tween.velocity);
    this.pipeline.update({
      time: elapsed,
      delta,
      dpr: pixelRatio,
      input: this.input,
      tween: this.tween,
      size: { width, height },
      settings,
      mediaEnabled: this.mediaEnabled,
    });

    this.emitActive(this.tween.progress);
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
    this.pipeline.applyTheme({
      blocksColor: primary,
      ambientColor,
      ambientIntensity,
      mediaBackground,
      thumb: {
        darkness: thumb.darkness ?? 0,
        darknessColor: thumb.darknessColor ?? "#000000",
        saturation: thumb.saturation ?? 1,
      },
      compositeBg: mediaBackground,
    });

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
    this.pipeline.destroy();
    this.renderer.destroy();
  }
}
