export class Time {
  private rafId = 0;
  private lastTime = 0;
  private elapsed = 0;

  constructor(private onTick: (delta: number, elapsed: number) => void) {
    this.tick = this.tick.bind(this);
    this.rafId = window.requestAnimationFrame(this.tick);
  }

  private tick(time: number) {
    if (!this.lastTime) {
      this.lastTime = time;
    }

    const delta = (time - this.lastTime) / 1000;
    this.elapsed += delta;
    this.lastTime = time;

    this.onTick(delta, this.elapsed);
    this.rafId = window.requestAnimationFrame(this.tick);
  }

  stop() {
    window.cancelAnimationFrame(this.rafId);
  }
}
