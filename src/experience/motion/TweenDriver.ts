export class TweenDriver {
  value = 0;

  update(delta: number) {
    this.value += delta;
  }
}
