import * as THREE from "three";
import { MouseSim } from "../core/MouseSim";
import { lerp } from "../utils/math";

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

type RenderSettings = {
  renderToScreen: boolean;
  fxaa: { enabled: boolean };
  mousesim: { enabled: boolean };
  luminosity: { threshold: number; smoothing: number; enabled: boolean };
  bloom: { strength: number; radius: number; enabled: boolean };
  blur: { scale: number; strength: number; enabled: boolean };
  fluid: { enabled: boolean };
};

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

  readonly screenCamera: THREE.OrthographicCamera;
  readonly screenGeometry: THREE.BufferGeometry;
  readonly screen: THREE.Mesh;

  readonly renderTargetA: THREE.WebGLRenderTarget;
  readonly renderTargetComposite: THREE.WebGLRenderTarget;
  readonly renderTargetBright: THREE.WebGLRenderTarget;
  readonly renderTargetBlurA: THREE.WebGLRenderTarget;
  readonly renderTargetBlurB: THREE.WebGLRenderTarget;
  readonly renderTargetsHorizontal: THREE.WebGLRenderTarget[];
  readonly renderTargetsVertical: THREE.WebGLRenderTarget[];
  readonly renderTargetFXAA: THREE.WebGLRenderTarget;

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

    this.renderTargetA = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.renderTargetA.depthTexture = new THREE.DepthTexture(1, 1);
    this.renderTargetA.depthTexture.type = THREE.UnsignedShortType;
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

    this.hBlurMaterial = new SimpleBlurMaterial(new THREE.Vector2(1, 0));
    this.vBlurMaterial = new SimpleBlurMaterial(new THREE.Vector2(0, 1));
    this.fxaaMaterial = new FxaaMaterial();
    this.luminosityMaterial = new LuminosityMaterial();
    this.luminosityMaterial.uniforms.uThreshold.value = this.settings.luminosity.threshold;
    this.luminosityMaterial.uniforms.uSmoothing.value = this.settings.luminosity.smoothing;

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

    if (this.settings.mousesim.enabled) {
      this.initMouseSim();
    }

    this.renderTargetA.depthBuffer = true;
  }

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

  private initMouseSim() {
    this.mouseSimulation = new MouseSim({
      renderer: this.renderer,
      noiseTexture: this.noiseTexture ?? null,
    });
  }

  protected bloomFactors() {
    const factors = [1, 0.8, 0.6, 0.4, 0.2];
    for (let i = 0; i < this.nMips; i += 1) {
      const v = factors[i];
      factors[i] = this.settings.bloom.strength * lerp(v, 1.2 - v, this.settings.bloom.radius);
    }
    return factors;
  }

  updateBloom() {
    this.bloomMaterial.uniforms.uBloomFactors.value = this.bloomFactors();
  }

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

  private floorPowerOfTwo(value: number) {
    return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
  }

  update({ time, delta, pointer, camera, scene }: UpdateOptions) {
    const renderer = this.renderer;
    const activeCamera = camera ?? this.camera;
    const activeScene = scene ?? this.scene;
    const targetA = this.renderTargetA;
    const targetBright = this.renderTargetBright;
    const targetComposite = this.renderTargetComposite;

    renderer.setRenderTarget(targetA);
    renderer.render(activeScene, activeCamera);

    let blurOutput: THREE.Texture | null = null;
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

    if (this.settings.luminosity.enabled) {
      this.luminosityMaterial.uniforms.tMap.value = blurOutput ?? targetA.texture;
      this.screen.material = this.luminosityMaterial;
      renderer.setRenderTarget(targetBright);
      renderer.render(this.screen, this.screenCamera);
    }

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

    if (this.settings.mousesim.enabled && this.mouseSimulation && pointer) {
      this.mouseSimulation.update(time, delta, pointer);
      this.compositeMaterial.uniforms.tMouseSim.value =
        this.mouseSimulation.bufferSim.output.texture;
    }

    this.compositeMaterial.uniforms.tScene.value = blurOutput ?? targetA.texture;
    this.compositeMaterial.uniforms.boolBloom.value = this.settings.bloom.enabled;
    this.compositeMaterial.uniforms.boolFluid.value = this.settings.fluid.enabled;
    this.compositeMaterial.uniforms.boolLuminosity.value = this.settings.luminosity.enabled;
    this.compositeMaterial.uniforms.boolFxaa.value = this.settings.fxaa.enabled;

    this.screen.material = this.compositeMaterial;
    if (this.settings.fxaa.enabled) {
      renderer.setRenderTarget(this.renderTargetFXAA);
      renderer.render(this.screen, this.screenCamera);
      this.fxaaMaterial.uniforms.tMap.value = this.renderTargetFXAA.texture;
      this.screen.material = this.fxaaMaterial;
    }

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
