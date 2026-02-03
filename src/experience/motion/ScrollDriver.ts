import Lenis from "lenis";

type ScrollToOptions = {
  immediate?: boolean;
  duration?: number;
  easing?: (t: number) => number;
  lock?: boolean;
};

export class ScrollDriver {
  readonly lenis: Lenis;
  progress = 0;
  velocity = 0;
  direction: 1 | -1 | 0 = 0;

  private onScroll = (lenis: Lenis) => {
    this.velocity = lenis.velocity;
    this.direction = lenis.direction;
    this.progress = lenis.progress;
  };

  constructor() {
    this.lenis = new Lenis({
      smoothWheel: true,
    });

    if (typeof document !== "undefined") {
      document.documentElement.classList.add("lenis", "lenis-smooth");
    }

    this.lenis.on("scroll", this.onScroll);
  }

  update() {
    this.lenis.raf(performance.now());

    this.progress = this.lenis.progress;
    this.velocity = this.lenis.velocity;
    this.direction = this.lenis.direction;
  }

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
    this.lenis.destroy();
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    }
  }
}
