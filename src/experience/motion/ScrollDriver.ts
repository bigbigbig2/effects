import Lenis from "lenis";

type ScrollEvent = {
  velocity: number;
};

export class ScrollDriver {
  readonly lenis: Lenis;
  progress = 0;
  velocity = 0;

  private onScroll = ({ velocity }: ScrollEvent) => {
    this.velocity = velocity;
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

    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;

    if (maxScroll > 0) {
      this.progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    } else {
      this.progress = 0;
    }
  }

  destroy() {
    this.lenis.off("scroll", this.onScroll);
    this.lenis.destroy();
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    }
  }
}
