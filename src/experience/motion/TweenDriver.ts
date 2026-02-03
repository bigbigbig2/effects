import gsap from "gsap";

export class TweenDriver {
  progress = 0;
  velocity = 0;

  private progressTo: (value: number) => void;
  private velocityTo: (value: number) => void;

  constructor() {
    this.progressTo = gsap.quickTo(this, "progress", {
      duration: 0.8,
      ease: "expo.out",
    });
    this.velocityTo = gsap.quickTo(this, "velocity", {
      duration: 0.4,
      ease: "power2.out",
    });
  }

  update(targetProgress: number, targetVelocity: number) {
    this.progressTo(targetProgress);
    this.velocityTo(targetVelocity);
  }

  destroy() {
    gsap.killTweensOf(this);
  }
}
