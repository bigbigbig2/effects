import * as THREE from "three";

type RendererOptions = {
  canvas: HTMLCanvasElement; // 渲染目标 canvas
  container: HTMLElement;    // canvas 的父容器，用于确定渲染尺寸
};

type RendererSizes = {
  width: number;
  height: number;
  pixelRatio: number;
};

// Renderer 类：
// 封装 Three.js 的 WebGLRenderer。
// 负责初始化渲染器、管理渲染尺寸 (resize) 和执行渲染 (render)。
export class Renderer {
  readonly instance: THREE.WebGLRenderer; // Three.js 渲染器实例
  readonly sizes: RendererSizes; // 当前渲染尺寸信息
  private container: HTMLElement;

  constructor({ canvas, container }: RendererOptions) {
    this.container = container;
    // 初始化 WebGLRenderer
    this.instance = new THREE.WebGLRenderer({
      canvas,
      antialias: true, // 开启抗锯齿
      alpha: true,     // 开启透明背景（允许 CSS 背景透出）
    });

    this.sizes = {
      width: 1,
      height: 1,
      pixelRatio: 1,
    };

    // 配置颜色空间为 sRGB，确保颜色显示正确
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
    // 设置清除颜色（背景色），这里使用了深色
    this.instance.setClearColor(0x0c0f12, 1);
    
    // 初始化尺寸
    this.resize();
  }

  // 调整渲染器尺寸以适应容器
  resize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.sizes.width = width;
    this.sizes.height = height;
    // 限制像素比最大为 2，平衡性能和清晰度
    this.sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

    this.instance.setPixelRatio(this.sizes.pixelRatio);
    this.instance.setSize(width, height, false); // false: 不设置 canvas 的 style 宽高，由 CSS 控制
  }

  // 执行渲染
  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.instance.render(scene, camera);
  }

  // 销毁渲染器，释放资源
  destroy() {
    this.instance.dispose();
  }
}
