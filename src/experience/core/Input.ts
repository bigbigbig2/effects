export type PointerState = {
  x: number;
  y: number;
  normX: number;
  normY: number;
};

export class Input {
  pointer: PointerState = { x: 0, y: 0, normX: 0, normY: 0 };
  private onMove = (event: PointerEvent) => this.handleMove(event);

  constructor(private element: HTMLElement) {
    this.element.addEventListener("pointermove", this.onMove);
  }

  private handleMove(event: PointerEvent) {
    const rect = this.element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.pointer = {
      x,
      y,
      normX: (x / rect.width) * 2 - 1,
      normY: (y / rect.height) * 2 - 1,
    };
  }

  destroy() {
    this.element.removeEventListener("pointermove", this.onMove);
  }
}
