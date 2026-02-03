import * as THREE from "three";

type ProgressDetail = {
  loaded: number;
  total: number;
  progress: number;
};

export class Assets {
  private loader = new THREE.TextureLoader();
  private total = 0;
  private loaded = 0;

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

  private configure(texture: THREE.Texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  private createFallbackTexture() {
    const data = new Uint8Array([255, 255, 255, 255]);
    const texture = new THREE.DataTexture(data, 1, 1);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  destroy() {
    // Placeholder for texture/video cleanup.
  }
}
