export type PointerState = {
  x: number;      // 鼠标在元素内的像素 X 坐标
  y: number;      // 鼠标在元素内的像素 Y 坐标
  normX: number;  // 归一化 X 坐标 [-1, 1]
  normY: number;  // 归一化 Y 坐标 [-1, 1]
};

// Input 类：
// 负责监听鼠标/指针移动事件，并计算归一化坐标。
// 这些坐标通常用于 Raycaster (射线检测) 或 Shader 中的鼠标交互效果。
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
      // 将像素坐标转换为 [-1, 1] 的归一化设备坐标 (NDC)
      normX: (x / rect.width) * 2 - 1,
      normY: (y / rect.height) * 2 - 1, // 注意：这里通常 Y 轴是反转的 (Three.js 中上方为正)，取决于具体使用场景
    };
  }

  destroy() {
    this.element.removeEventListener("pointermove", this.onMove);
  }
}
