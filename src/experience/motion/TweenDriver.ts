import gsap from "gsap";

/**
 * 补间动画驱动器 (TweenDriver)
 *
 * 使用 GSAP 的 quickTo 功能来平滑数值的变化。
 * 主要用于将输入的滚动进度和速度进行平滑插值，避免 3D 渲染中的抖动，
 * 提供更流畅的视觉体验。
 */
export class TweenDriver {
  progress = 0; // 平滑后的进度值
  velocity = 0; // 平滑后的速度值

  // GSAP quickTo 实例，用于高性能的数值追踪
  private progressTo: (value: number) => void;
  private velocityTo: (value: number) => void;

  constructor() {
    // 设置 progress 的平滑参数
    this.progressTo = gsap.quickTo(this, "progress", {
      duration: 0.8,
      ease: "expo.out",
    });
    // 设置 velocity 的平滑参数
    this.velocityTo = gsap.quickTo(this, "velocity", {
      duration: 0.4,
      ease: "power2.out",
    });
  }

  /**
   * 更新目标值
   * @param targetProgress 目标进度
   * @param targetVelocity 目标速度
   */
  update(targetProgress: number, targetVelocity: number) {
    this.progressTo(targetProgress);
    this.velocityTo(targetVelocity);
  }

  destroy() {
    gsap.killTweensOf(this);
  }
}
