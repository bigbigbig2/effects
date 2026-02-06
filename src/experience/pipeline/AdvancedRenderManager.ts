import * as THREE from "three";
import { MouseSim } from "../core/MouseSim";
import { lerp } from "../utils/math";

/**
 * AdvancedRenderManager
 *
 * 作用：
 * - 统一管理 “场景 -> 离屏 -> 后处理 -> 输出” 的渲染管线
 * - 内置 Bloom / Luminosity / Blur / FXAA / MouseSim 等通用步骤
 *
 * 设计要点：
 * - 通过可配置 settings 控制每个 pass 是否启用
 * - 采用屏幕四边形（screen quad）进行后处理
 * - 使用多级 RenderTarget 管理中间结果
 */

// 抖动：用于 Bloom 合成时减少色带
const DITHER_RANDOM = `
float random(vec2 co) {
    float a = 12.9898;
    float b = 78.233;
    float c = 43758.5453;
    float dt = dot(co.xy, vec2(a, b));
    float sn = mod(dt, 3.14);
    return fract(sin(sn) * c);
}
`;

const DITHER = `
${DITHER_RANDOM}

vec3 dither(vec3 color) {
    float grid_position = random(gl_FragCoord.xy);
    vec3 dither_shift_RGB = vec3(0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0);
    dither_shift_RGB = mix(2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position);
    return color + dither_shift_RGB;
}
`;

// Bloom 合成：将多级模糊结果按权重相加
const BLOOM_FRAGMENT = `
precision mediump float;

${DITHER}

uniform sampler2D tBlur1;
uniform sampler2D tBlur2;
uniform sampler2D tBlur3;
uniform sampler2D tBlur4;
uniform sampler2D tBlur5;
uniform float uBloomFactors[NUM_MIPS];
in vec2 vUv;
out vec4 FragColor;
void main() {
  FragColor = uBloomFactors[0] * texture(tBlur1, vUv) +
    uBloomFactors[1] * texture(tBlur2, vUv) +
    uBloomFactors[2] * texture(tBlur3, vUv) +
    uBloomFactors[3] * texture(tBlur4, vUv) +
    uBloomFactors[4] * texture(tBlur5, vUv);
  #ifdef DITHERING
    FragColor.rgb = dither(FragColor.rgb);
  #endif
}
`;

const BLOOM_VERTEX = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

// FXAA：全屏抗锯齿
const FXAA_FRAGMENT = `
precision mediump float;
uniform sampler2D tMap;
uniform vec2 uResolution;
in vec2 v_rgbNW;
in vec2 v_rgbNE;
in vec2 v_rgbSW;
in vec2 v_rgbSE;
in vec2 v_rgbM;
in vec2 vUv;
out vec4 FragColor;

vec4 fxaa(sampler2D tex, vec2 fragCoord, vec2 inverseVP, vec2 v_rgbNW, vec2 v_rgbNE,
          vec2 v_rgbSW, vec2 v_rgbSE, vec2 v_rgbM) {
    vec4 color;
    vec2 luma = vec2(0.299, 0.587);
    float lumaNW = dot(texture(tex, v_rgbNW).xyz, vec3(luma, 0.114));
    float lumaNE = dot(texture(tex, v_rgbNE).xyz, vec3(luma, 0.114));
    float lumaSW = dot(texture(tex, v_rgbSW).xyz, vec3(luma, 0.114));
    float lumaSE = dot(texture(tex, v_rgbSE).xyz, vec3(luma, 0.114));
    float lumaM  = dot(texture(tex, v_rgbM ).xyz, vec3(luma, 0.114));
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
    vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));
    float FXAA_REDUCE_MIN = (1.0/128.0);
    float FXAA_REDUCE_MUL = (1.0/8.0);
    float FXAA_SPAN_MAX = 8.0;
    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
              dir * rcpDirMin)) * inverseVP;
    vec3 rgbA = 0.5 * (
        texture(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +
        texture(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);
    vec3 rgbB = rgbA * 0.5 + 0.25 * (
        texture(tex, fragCoord * inverseVP + dir * -0.5).xyz +
        texture(tex, fragCoord * inverseVP + dir * 0.5).xyz);
    float lumaB = dot(rgbB, vec3(luma, 0.114));
    if ((lumaB < lumaMin) || (lumaB > lumaMax)) {
        color = vec4(rgbA, 1.0);
    } else {
        color = vec4(rgbB, 1.0);
    }
    return color;
}

void main() {
    FragColor = fxaa(tMap, vUv * uResolution, uResolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
}
`;

const FXAA_VERTEX = `
uniform vec2 uResolution;
out vec2 v_rgbNW;
out vec2 v_rgbNE;
out vec2 v_rgbSW;
out vec2 v_rgbSE;
out vec2 v_rgbM;
out vec2 vUv;
void main() {
    vUv = uv;
    vec2 fragCoord = uv * uResolution;
    vec2 inverseVP = 1.0 / uResolution.xy;
    v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;
    v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;
    v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;
    v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;
    v_rgbM = vec2(fragCoord * inverseVP);
    gl_Position = vec4(position, 1.0);
}
`;

// 亮度提取：为 Bloom 准备高亮区域
const LUMINOSITY_FRAGMENT = `
precision mediump float;
uniform sampler2D tMap;
uniform float uThreshold;
uniform float uSmoothing;
in vec2 vUv;
out vec4 FragColor;
void main() {
    vec4 texel = texture(tMap, vUv);
    vec3 luma = vec3(0.299, 0.587, 0.114);
    float v = dot(texel.xyz, luma);
    float alpha = smoothstep(uThreshold, uThreshold + uSmoothing, v);
    FragColor = mix(vec4(0), texel, alpha);
}
`;

const LUMINOSITY_VERTEX = `
out vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

// 分离高斯模糊：横/纵向两次采样
const SEPARABLE_BLUR_FRAGMENT = `
precision mediump float;
uniform sampler2D tMap;
uniform vec2 uDirection;
uniform vec2 uResolution;
in vec2 vUv;
out vec4 FragColor;
float gaussianPdf(float x, float sigma) {
    return 0.39894 * exp(-0.5 * x * x / (sigma * sigma)) / sigma;
}
vec4 blur(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
    vec2 invSize = 1.0 / resolution;
    float fSigma = float(SIGMA);
    float weightSum = gaussianPdf(0.0, fSigma);
    vec3 diffuseSum = texture(image, uv).rgb * weightSum;
    for (int i = 1; i < KERNEL_RADIUS; i++) {
        float x = float(i);
        float w = gaussianPdf(x, fSigma);
        vec2 uvOffset = direction * invSize * x;
        vec3 sample1 = texture(image, uv + uvOffset).rgb;
        vec3 sample2 = texture(image, uv - uvOffset).rgb;
        diffuseSum += (sample1 + sample2) * w;
        weightSum += 2.0 * w;
    }
    return vec4(diffuseSum / weightSum, 1.0);
}
void main() {
    FragColor = blur(tMap, vUv, uResolution, uDirection);
}
`;

const SEPARABLE_BLUR_VERTEX = `
precision mediump float;
out vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

// 简化模糊：用于轻量化 blur pass
const SIMPLE_BLUR_FRAGMENT = `
precision highp float;

vec4 blur(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 sum = vec4(0.0);
  vec2 pixel = 1.0 / resolution;
  sum += texture(image, uv - 4.0 * pixel * direction) * 0.051;
  sum += texture(image, uv - 3.0 * pixel * direction) * 0.0918;
  sum += texture(image, uv - 2.0 * pixel * direction) * 0.12245;
  sum += texture(image, uv - 1.0 * pixel * direction) * 0.1531;
  sum += texture(image, uv) * 0.1633;
  sum += texture(image, uv + 1.0 * pixel * direction) * 0.1531;
  sum += texture(image, uv + 2.0 * pixel * direction) * 0.12245;
  sum += texture(image, uv + 3.0 * pixel * direction) * 0.0918;
  sum += texture(image, uv + 4.0 * pixel * direction) * 0.051;
  return sum;
}

uniform sampler2D tMap;
uniform float uBluriness;
uniform vec2 uDirection;
uniform vec2 uResolution;
in vec2 vUv;
out vec4 FragColor;

void main() {
  FragColor = blur(tMap, vUv, uResolution, uBluriness * uDirection);
}
`;

const SIMPLE_BLUR_VERTEX = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

// FXAA 材质
class FxaaMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      glslVersion: THREE.GLSL3,
      uniforms: {
        tMap: { value: null },
        uResolution: { value: new THREE.Vector2() },
      },
      vertexShader: FXAA_VERTEX,
      fragmentShader: FXAA_FRAGMENT,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    });
  }
}

// Luminosity 材质
class LuminosityMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      glslVersion: THREE.GLSL3,
      uniforms: {
        tMap: { value: null },
        uThreshold: { value: 1 },
        uSmoothing: { value: 1 },
      },
      vertexShader: LUMINOSITY_VERTEX,
      fragmentShader: LUMINOSITY_FRAGMENT,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    });
  }
}

// 分离模糊材质（多级 Bloom）
class SeparableBlurMaterial extends THREE.ShaderMaterial {
  constructor(kernelRadius: number) {
    super({
      glslVersion: THREE.GLSL3,
      defines: {
        KERNEL_RADIUS: kernelRadius,
        SIGMA: kernelRadius,
      },
      uniforms: {
        tMap: { value: null },
        tDetail: { value: null },
        tOverview: { value: null },
        tOverviewMask: { value: null },
        uDirection: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector2() },
      },
      vertexShader: SEPARABLE_BLUR_VERTEX,
      fragmentShader: SEPARABLE_BLUR_FRAGMENT,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    });
  }
}

// 简易模糊材质（可选 blur）
class SimpleBlurMaterial extends THREE.ShaderMaterial {
  constructor(direction = new THREE.Vector2(0.5, 0.5)) {
    super({
      glslVersion: THREE.GLSL3,
      uniforms: {
        tMap: { value: null },
        uBluriness: { value: 0 },
        uDirection: { value: direction },
        uResolution: { value: new THREE.Vector2() },
      },
      vertexShader: SIMPLE_BLUR_VERTEX,
      fragmentShader: SIMPLE_BLUR_FRAGMENT,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    });
  }
}

// Bloom 合成材质
class BloomMaterial extends THREE.ShaderMaterial {
  constructor({ dithering = false } = {}) {
    super({
      glslVersion: THREE.GLSL3,
      defines: {
        NUM_MIPS: 5,
        DITHERING: dithering,
      },
      uniforms: {
        tBlur1: { value: null },
        tBlur2: { value: null },
        tBlur3: { value: null },
        tBlur4: { value: null },
        tBlur5: { value: null },
        uBloomFactors: { value: null },
      },
      vertexShader: BLOOM_VERTEX,
      fragmentShader: BLOOM_FRAGMENT,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    });
  }
}

// 渲染设置：控制各个 pass 是否启用及其参数
type RenderSettings = {
  renderToScreen: boolean;
  fxaa: { enabled: boolean };
  mousesim: { enabled: boolean };
  luminosity: { threshold: number; smoothing: number; enabled: boolean };
  bloom: { strength: number; radius: number; enabled: boolean };
  blur: { scale: number; strength: number; enabled: boolean };
  fluid: { enabled: boolean };
};

// 每帧更新所需的参数
type UpdateOptions = {
  time: number;
  delta: number;
  pointer?: { x: number; y: number };
  camera?: THREE.Camera;
  scene?: THREE.Scene;
};

export class AdvancedRenderManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.Camera;

  // 全屏四边形：用于后处理渲染
  readonly screenCamera: THREE.OrthographicCamera;
  readonly screenGeometry: THREE.BufferGeometry;
  readonly screen: THREE.Mesh;

  // 主要离屏缓冲与中间结果
  readonly renderTargetA: THREE.WebGLRenderTarget; // 主场景渲染输出
  readonly renderTargetComposite: THREE.WebGLRenderTarget; // 合成结果
  readonly renderTargetBright: THREE.WebGLRenderTarget; // 亮部提取
  readonly renderTargetBlurA: THREE.WebGLRenderTarget; // Blur 横向
  readonly renderTargetBlurB: THREE.WebGLRenderTarget; // Blur 纵向
  readonly renderTargetsHorizontal: THREE.WebGLRenderTarget[]; // Bloom 横向 mips
  readonly renderTargetsVertical: THREE.WebGLRenderTarget[]; // Bloom 纵向 mips
  readonly renderTargetFXAA: THREE.WebGLRenderTarget; // FXAA 输出

  // 各类后处理材质
  readonly hBlurMaterial: SimpleBlurMaterial;
  readonly vBlurMaterial: SimpleBlurMaterial;
  readonly fxaaMaterial: FxaaMaterial;
  readonly luminosityMaterial: LuminosityMaterial;
  readonly blurMaterials: SeparableBlurMaterial[];
  readonly bloomMaterial: BloomMaterial;

  readonly compositeMaterial: THREE.ShaderMaterial;
  readonly settings: RenderSettings;
  readonly nMips = 5;
  mouseSimulation: MouseSim | null = null;
  noiseTexture: THREE.Texture | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    compositeMaterial: THREE.ShaderMaterial,
    noiseTexture: THREE.Texture | null = null
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.compositeMaterial = compositeMaterial;
    this.noiseTexture = noiseTexture;

    this.settings = this.initSettings();

    // 全屏四边形相机与几何体
    this.screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.screenGeometry = new THREE.BufferGeometry();
    this.screenGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([-1, 3, 0, -1, -1, 0, 3, -1, 0]), 3)
    );
    this.screenGeometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array([0, 2, 0, 0, 2, 0]), 2)
    );
    this.screen = new THREE.Mesh(this.screenGeometry, this.compositeMaterial);
    this.screen.frustumCulled = false;

    // 主渲染目标：作为所有后处理的输入
    this.renderTargetA = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      stencilBuffer: false,
    });
    // 深度纹理：可用于基于深度的效果
    this.renderTargetA.depthTexture = new THREE.DepthTexture(1, 1);
    this.renderTargetA.depthTexture.type = THREE.UnsignedShortType;
    // 复用配置并复制出各类中间 RT
    this.renderTargetComposite = this.renderTargetA.clone();
    this.renderTargetBright = this.renderTargetA.clone();
    this.renderTargetBlurA = this.renderTargetA.clone();
    this.renderTargetBlurB = this.renderTargetA.clone();
    this.renderTargetsHorizontal = [];
    this.renderTargetsVertical = [];
    for (let i = 0; i < this.nMips; i += 1) {
      this.renderTargetsHorizontal.push(this.renderTargetA.clone());
      this.renderTargetsVertical.push(this.renderTargetA.clone());
    }
    this.renderTargetFXAA = this.renderTargetA.clone();

    // Blur / FXAA / Luminosity
    this.hBlurMaterial = new SimpleBlurMaterial(new THREE.Vector2(1, 0));
    this.vBlurMaterial = new SimpleBlurMaterial(new THREE.Vector2(0, 1));
    this.fxaaMaterial = new FxaaMaterial();
    this.luminosityMaterial = new LuminosityMaterial();
    this.luminosityMaterial.uniforms.uThreshold.value = this.settings.luminosity.threshold;
    this.luminosityMaterial.uniforms.uSmoothing.value = this.settings.luminosity.smoothing;

    // Bloom 多级模糊材质
    this.blurMaterials = [];
    const kernels = [3, 5, 7, 9, 11];
    for (let i = 0; i < this.nMips; i += 1) {
      this.blurMaterials.push(new SeparableBlurMaterial(kernels[i]));
    }

    this.bloomMaterial = new BloomMaterial();
    this.bloomMaterial.uniforms.tBlur1.value = this.renderTargetsVertical[0].texture;
    this.bloomMaterial.uniforms.tBlur2.value = this.renderTargetsVertical[1].texture;
    this.bloomMaterial.uniforms.tBlur3.value = this.renderTargetsVertical[2].texture;
    this.bloomMaterial.uniforms.tBlur4.value = this.renderTargetsVertical[3].texture;
    this.bloomMaterial.uniforms.tBlur5.value = this.renderTargetsVertical[4].texture;
    this.bloomMaterial.uniforms.uBloomFactors.value = this.bloomFactors();

    // 可选启用全局 MouseSim
    if (this.settings.mousesim.enabled) {
      this.initMouseSim();
    }

    this.renderTargetA.depthBuffer = true;
  }

  // 子类可覆写：设置初始渲染参数
  initSettings(): RenderSettings {
    return {
      renderToScreen: false,
      fxaa: { enabled: false },
      mousesim: { enabled: false },
      luminosity: { threshold: 0.1, smoothing: 1, enabled: false },
      bloom: { strength: 0.05, radius: 0.01, enabled: false },
      blur: { scale: 1, strength: 8, enabled: false },
      fluid: { enabled: false },
    };
  }

  // 初始化全局 MouseSim（非 WorkScreen 内部的局部 MouseSim）
  private initMouseSim() {
    this.mouseSimulation = new MouseSim({
      renderer: this.renderer,
      noiseTexture: this.noiseTexture ?? null,
    });
  }

  // 计算 Bloom 权重（受 strength 与 radius 影响）
  protected bloomFactors() {
    const factors = [1, 0.8, 0.6, 0.4, 0.2];
    for (let i = 0; i < this.nMips; i += 1) {
      const v = factors[i];
      factors[i] = this.settings.bloom.strength * lerp(v, 1.2 - v, this.settings.bloom.radius);
    }
    return factors;
  }

  // 重新计算 Bloom 权重并写入材质
  updateBloom() {
    this.bloomMaterial.uniforms.uBloomFactors.value = this.bloomFactors();
  }

  // 调整所有 RT 尺寸
  resize(width: number, height: number, dpr: number) {
    if (this.settings.renderToScreen) {
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(width, height);
    }

    if (this.settings.fxaa.enabled) {
      this.renderTargetFXAA.setSize(width * dpr, height * dpr);
      this.fxaaMaterial.uniforms.uResolution.value.set(width * dpr, height * dpr);
    }

    if (this.settings.blur.enabled) {
      const bw = Math.round(width * this.settings.blur.scale);
      const bh = Math.round(height * this.settings.blur.scale);
      this.renderTargetBlurA.setSize(bw, bh);
      this.renderTargetBlurB.setSize(bw, bh);
      this.hBlurMaterial.uniforms.uResolution.value.set(width, height);
      this.vBlurMaterial.uniforms.uResolution.value.set(width, height);
    }

    let w = Math.round(width * dpr);
    let h = Math.round(height * dpr);
    this.renderTargetA.setSize(w, h);
    if (this.renderTargetA.depthTexture) {
      this.renderTargetA.depthTexture.image.width = w;
      this.renderTargetA.depthTexture.image.height = h;
      this.renderTargetA.depthTexture.needsUpdate = true;
    }
    this.renderTargetComposite.setSize(w, h);

    if (this.settings.mousesim.enabled && this.mouseSimulation) {
      this.mouseSimulation.onResize(w, h, w / 10, h / 10);
    }

    w = this.floorPowerOfTwo(w) / 4;
    h = this.floorPowerOfTwo(h) / 4;
    if (this.settings.luminosity.enabled) {
      this.renderTargetBright.setSize(w, h);
    }
    if (this.settings.bloom.enabled) {
      for (let i = 0; i < this.nMips; i += 1) {
        this.renderTargetsHorizontal[i].setSize(w, h);
        this.renderTargetsVertical[i].setSize(w, h);
        this.blurMaterials[i].uniforms.uResolution.value.set(w, h);
        w /= 2;
        h /= 2;
      }
    }
  }

  // Bloom 使用的尺寸取整
  private floorPowerOfTwo(value: number) {
    return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
  }

  // 每帧更新：按配置执行各个 pass，并最终输出
  update({ time, delta, pointer, camera, scene }: UpdateOptions) {
    const renderer = this.renderer;
    const activeCamera = camera ?? this.camera;
    const activeScene = scene ?? this.scene;
    const targetA = this.renderTargetA;
    const targetBright = this.renderTargetBright;
    const targetComposite = this.renderTargetComposite;

    // 1. 渲染主场景到 targetA
    renderer.setRenderTarget(targetA);
    renderer.render(activeScene, activeCamera);

    let blurOutput: THREE.Texture | null = null;
    // 2. 可选 Blur
    if (this.settings.blur.enabled) {
      this.hBlurMaterial.uniforms.tMap.value = targetA.texture;
      this.screen.material = this.hBlurMaterial;
      renderer.setRenderTarget(this.renderTargetBlurA);
      renderer.render(this.screen, this.screenCamera);

      this.vBlurMaterial.uniforms.tMap.value = this.renderTargetBlurA.texture;
      this.screen.material = this.vBlurMaterial;
      renderer.setRenderTarget(this.renderTargetBlurB);
      renderer.render(this.screen, this.screenCamera);
      blurOutput = this.renderTargetBlurB.texture;
    }

    // 3. 可选亮度提取
    if (this.settings.luminosity.enabled) {
      this.luminosityMaterial.uniforms.tMap.value = blurOutput ?? targetA.texture;
      this.screen.material = this.luminosityMaterial;
      renderer.setRenderTarget(targetBright);
      renderer.render(this.screen, this.screenCamera);
    }

    // 4. Bloom mip chain
    if (this.settings.bloom.enabled) {
      let input = this.settings.luminosity.enabled ? targetBright : targetA;
      for (let i = 0; i < this.nMips; i += 1) {
        this.screen.material = this.blurMaterials[i];
        this.blurMaterials[i].uniforms.tMap.value = input.texture;
        this.blurMaterials[i].uniforms.uDirection.value.set(1, 0);
        renderer.setRenderTarget(this.renderTargetsHorizontal[i]);
        renderer.render(this.screen, this.screenCamera);

        this.blurMaterials[i].uniforms.tMap.value = this.renderTargetsHorizontal[i].texture;
        this.blurMaterials[i].uniforms.uDirection.value.set(0, 1);
        renderer.setRenderTarget(this.renderTargetsVertical[i]);
        renderer.render(this.screen, this.screenCamera);
        input = this.renderTargetsVertical[i];
      }
      this.screen.material = this.bloomMaterial;
      renderer.setRenderTarget(this.renderTargetsHorizontal[0]);
      renderer.render(this.screen, this.screenCamera);
      this.compositeMaterial.uniforms.tBloom.value =
        this.renderTargetsHorizontal[0].texture;
    }

    // 5. 全局 MouseSim
    if (this.settings.mousesim.enabled && this.mouseSimulation && pointer) {
      this.mouseSimulation.update(time, delta, pointer);
      this.compositeMaterial.uniforms.tMouseSim.value =
        this.mouseSimulation.bufferSim.output.texture;
    }

    // 6. 合成 Pass：将主场景与 Bloom / MouseSim 等输入合并
    this.compositeMaterial.uniforms.tScene.value = blurOutput ?? targetA.texture;
    this.compositeMaterial.uniforms.boolBloom.value = this.settings.bloom.enabled;
    this.compositeMaterial.uniforms.boolFluid.value = this.settings.fluid.enabled;
    this.compositeMaterial.uniforms.boolLuminosity.value = this.settings.luminosity.enabled;
    this.compositeMaterial.uniforms.boolFxaa.value = this.settings.fxaa.enabled;

    this.screen.material = this.compositeMaterial;
    // 7. 可选 FXAA
    if (this.settings.fxaa.enabled) {
      renderer.setRenderTarget(this.renderTargetFXAA);
      renderer.render(this.screen, this.screenCamera);
      this.fxaaMaterial.uniforms.tMap.value = this.renderTargetFXAA.texture;
      this.screen.material = this.fxaaMaterial;
    }

    // 8. 输出到屏幕或写入 renderTargetComposite
    if (this.settings.renderToScreen) {
      renderer.setRenderTarget(null);
      renderer.render(this.screen, this.screenCamera);
    } else {
      renderer.setRenderTarget(targetComposite);
      renderer.render(this.screen, this.screenCamera);
      renderer.setRenderTarget(null);
    }
  }
}
