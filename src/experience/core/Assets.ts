import * as THREE from "three";

export class Assets {
  private loader = new THREE.TextureLoader();

  async loadTexture(src: string, fallback?: string): Promise<THREE.Texture> {
    try {
      const texture = await this.load(src);
      return this.configure(texture);
    } catch (error) {
      if (fallback) {
        const texture = await this.load(fallback);
        return this.configure(texture);
      }
      return this.createFallbackTexture();
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
