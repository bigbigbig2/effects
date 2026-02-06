﻿import * as THREE from "three";

type ProgressDetail = {
  loaded: number;   // 已加载数量
  total: number;    // 总数量
  progress: number; // 进度 (0-1)
};

// Assets 类：
// 资源管理器，负责加载纹理等资源。
// 提供了进度追踪功能，并分发 "assets:progress" 和 "assets:complete" 事件。
export class Assets {
  private loader = new THREE.TextureLoader();
  private total = 0;  // 需要加载的总资源数
  private loaded = 0; // 已加载完成的资源数

  // 加载单个纹理，支持失败重试（回退）
  async loadTexture(src: string, fallback?: string): Promise<THREE.Texture> {
    try {
      const texture = await this.loadWithProgress(src);
      return this.configure(texture);
    } catch (error) {
      if (fallback) {
        try {
          const texture = await this.loadWithProgress(fallback);
          return this.configure(texture);
        } catch (fallbackError) {
          return this.createFallbackTexture();
        }
      }
      return this.createFallbackTexture();
    }
  }

  // 包装加载过程，增加进度计数
  private async loadWithProgress(src: string) {
    this.beginLoad();
    try {
      return await this.load(src);
    } finally {
      this.endLoad();
    }
  }

  private beginLoad() {
    this.total += 1;
    this.emitProgress();
  }

  private endLoad() {
    this.loaded += 1;
    this.emitProgress();
  }

  // 分发进度事件
  private emitProgress() {
    if (typeof window === "undefined") return;
    const progress = this.total > 0 ? this.loaded / this.total : 0;
    const detail: ProgressDetail = {
      loaded: this.loaded,
      total: this.total,
      progress,
    };

    window.dispatchEvent(new CustomEvent<ProgressDetail>("assets:progress", { detail }));

    if (this.total > 0 && this.loaded >= this.total) {
      window.dispatchEvent(new Event("assets:complete"));
    }
  }

  // 底层加载逻辑 (Promise 封装)
  private load(src: string) {
    return new Promise<THREE.Texture>((resolve, reject) => {
      this.loader.load(
        src,
        (texture) => resolve(texture),
        undefined,
        () => reject(new Error(`Failed to load texture: ${src}`))
      );
    });
  }

  // 配置纹理参数 (sRGB, 过滤模式等)
  private configure(texture: THREE.Texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  // 创建一个 1x1 的白色纹理作为回退，防止渲染崩溃
  private createFallbackTexture() {
    const data = new Uint8Array([255, 255, 255, 255]);
    const texture = new THREE.DataTexture(data, 1, 1);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    console.warn("Using fallback white texture.");
    return texture;
  }

  destroy() {
    // 占位符：用于资源清理（如 dispose 纹理）
  }
}
