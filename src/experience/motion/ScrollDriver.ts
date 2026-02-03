import Lenis from "lenis";

export class ScrollDriver {
  readonly lenis: Lenis;
  progress = 0;
  velocity = 0;

  constructor() {
    this.lenis = new Lenis({
      smoothWheel: true,
    });

    this.lenis.on("scroll", ({ velocity }) => {
      this.velocity = velocity;
    });
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
    this.lenis.destroy();
  }
}
