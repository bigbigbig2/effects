import * as THREE from "three";
import {
  BlendFunction,
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";

type ToneMappingType = "ACES" | "Filmic" | "Reinhard" | "None";

export class PostProcessor {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private bloomPass: EffectPass;
  private tonePass: EffectPass;
  private toneMappingEffect: ToneMappingEffect;
  private bloomEffect: BloomEffect;
  private screenScene: THREE.Scene;
  private screenCamera: THREE.OrthographicCamera;
  private screenQuad: THREE.Mesh;
  private screenMaterial: THREE.MeshBasicMaterial;
  private outputColorSpace: THREE.ColorSpace = THREE.SRGBColorSpace;
  private debugBloom = false;
  private frameBufferType: THREE.TextureDataType;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.frameBufferType = this.resolveFrameBufferType(renderer);

    this.screenScene = new THREE.Scene();
    this.screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.screenMaterial = new THREE.MeshBasicMaterial({
      map: null,
      toneMapped: false,
    });
    this.screenQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.screenMaterial);
    this.screenQuad.frustumCulled = false;
    this.screenScene.add(this.screenQuad);

    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: this.frameBufferType,
    });
    this.renderPass = new RenderPass(this.screenScene, this.screenCamera);
    this.composer.addPass(this.renderPass);

    this.toneMappingEffect = new ToneMappingEffect({
      mode: ToneMappingMode.ACES_FILMIC,
    });
    this.toneMappingEffect.uniforms.set(
      "toneMappingExposure",
      new THREE.Uniform(1)
    );
    this.toneMappingEffect.setChanged();

    this.bloomEffect = new BloomEffect({
      blendFunction: BlendFunction.SCREEN,
      intensity: 0.15,
      radius: 0.5,
      luminanceThreshold: 0.1,
      luminanceSmoothing: 0.95,
      mipmapBlur: true,
    });

    this.bloomPass = new EffectPass(this.screenCamera, this.bloomEffect);
    this.tonePass = new EffectPass(this.screenCamera, this.toneMappingEffect);
    this.tonePass.renderToScreen = true;
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.tonePass);
  }

  resize(width: number, height: number) {
    this.composer.setSize(width, height);
  }

  render(texture: THREE.Texture | null) {
    if (!texture) return;
    const targetTexture = this.debugBloom ? this.bloomEffect.texture : texture;
    if (this.screenMaterial.map !== targetTexture) {
      this.screenMaterial.map = targetTexture;
      this.screenMaterial.needsUpdate = true;
    }
    this.renderer.outputColorSpace = this.outputColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.composer.render();
  }

  setOutputColorSpace(mode: "SRGB" | "Linear") {
    this.outputColorSpace =
      mode === "Linear" ? THREE.LinearSRGBColorSpace : THREE.SRGBColorSpace;
    this.tonePass.encodeOutput = mode === "SRGB";
  }

  setToneMapping(mode: ToneMappingType, exposure: number) {
    const mapping: Record<ToneMappingType, ToneMappingMode> = {
      ACES: ToneMappingMode.ACES_FILMIC,
      Filmic: ToneMappingMode.CINEON,
      Reinhard: ToneMappingMode.REINHARD,
      None: ToneMappingMode.LINEAR,
    };
    this.toneMappingEffect.mode = mapping[mode];
    const exposureUniform = this.toneMappingEffect.uniforms.get("toneMappingExposure");
    if (exposureUniform) {
      exposureUniform.value = exposure;
    }
    this.toneMappingEffect.blendMode.opacity.value = mode === "None" ? 0 : 1;
  }

  setBloom(options: {
    enabled: boolean;
    strength: number;
    radius: number;
    threshold: number;
    smoothing: number;
    luminanceEnabled?: boolean;
    debug?: boolean;
  }) {
    this.bloomPass.enabled = options.enabled;
    this.bloomEffect.blendMode.opacity.value = options.enabled ? 1 : 0;
    this.bloomEffect.intensity = options.enabled ? options.strength : 0;
    this.bloomEffect.radius = Math.min(1, Math.max(0, options.radius));
    this.bloomEffect.mipmapBlurPass.enabled = true;
    this.bloomEffect.luminanceMaterial.threshold = options.threshold;
    this.bloomEffect.luminanceMaterial.smoothing = options.smoothing;
    this.bloomEffect.luminancePass.enabled = true;
    this.debugBloom = options.debug ?? false;
  }

  destroy() {
    this.composer.dispose();
  }

  private resolveFrameBufferType(renderer: THREE.WebGLRenderer) {
    const caps = renderer.capabilities;
    const exts = renderer.extensions;
    const hasFloatBuffer =
      caps.isWebGL2 ||
      exts.has("EXT_color_buffer_float") ||
      exts.has("EXT_color_buffer_half_float");
    return hasFloatBuffer ? THREE.HalfFloatType : THREE.UnsignedByteType;
  }
}
