import Lenis from "lenis";

type ScrollToOptions = {
  immediate?: boolean;
  duration?: number;
  easing?: (t: number) => number;
  lock?: boolean;
};

/**
 * 滚动驱动器 (ScrollDriver)
 *
 * 负责管理页面的平滑滚动逻辑，基于 Lenis 库实现。
 * 它不仅处理浏览器的原生滚动，还处理虚拟滚动事件，并将滚动状态（进度、速度、方向）
 * 提供给 3D 场景使用。
 */
export class ScrollDriver {
  readonly lenis: Lenis;
  progress = 0; // 当前滚动进度 (0-1)
  velocity = 0; // 当前滚动速度
  direction: 1 | -1 | 0 = 0; // 滚动方向
  private wheelDelta = 0; // 累积的滚轮增量
  private lastWheelTime = 0; // 上次滚轮事件的时间戳
  
  // 虚拟滚动事件处理
  private onVirtualScroll = ({ deltaY }: { deltaY: number }) => {
    this.wheelDelta += deltaY;
    this.lastWheelTime = performance.now();
  };

  // Lenis 滚动事件处理
  private onScroll = (lenis: Lenis) => {
    this.velocity = lenis.velocity;
    this.direction = lenis.direction;
    this.progress = lenis.progress;
  };

  constructor() {
    // 初始化 Lenis 平滑滚动实例
    this.lenis = new Lenis({
      smoothWheel: true,
    });

    // 添加 CSS 类以便样式控制
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("lenis", "lenis-smooth");
    }

    // 绑定事件监听
    this.lenis.on("scroll", this.onScroll);
    this.lenis.on("virtual-scroll", this.onVirtualScroll);
  }

  update() {
    // 更新 Lenis 状态
    this.lenis.raf(performance.now());

    this.progress = this.lenis.progress;
    this.velocity = this.lenis.velocity;
    this.direction = this.lenis.direction;

    // 重置滚轮增量（如果超过一定时间没有新的输入）
    if (this.lastWheelTime && performance.now() - this.lastWheelTime > 300) {
      this.wheelDelta = 0;
      this.lastWheelTime = 0;
    }
  }

  /**
   * 消费累积的滚轮方向
   * 用于检测明显的滚轮手势（例如切换项目）
   */
  consumeWheelDirection(threshold: number) {
    const absDelta = Math.abs(this.wheelDelta);
    if (absDelta < threshold) return 0;
    const dir = Math.sign(this.wheelDelta) as 1 | -1;
    this.wheelDelta = 0;
    return dir;
  }

  /**
   * 滚动到指定的进度 (0-1)
   */
  scrollToProgress(progress: number, options: ScrollToOptions = {}) {
    const fallback =
      document.documentElement.scrollHeight - window.innerHeight;
    const maxScroll = this.lenis.limit || fallback;
    const target = Math.min(1, Math.max(0, progress)) * maxScroll;

    this.lenis.scrollTo(target, {
      immediate: options.immediate ?? false,
      duration: options.duration ?? 1.2,
      easing: options.easing ?? ((t: number) => 1 - Math.pow(1 - t, 3)),
      lock: options.lock ?? false,
    });
  }

  destroy() {
    this.lenis.off("scroll", this.onScroll);
    this.lenis.off("virtual-scroll", this.onVirtualScroll);
    this.lenis.destroy();
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    }
  }
}
