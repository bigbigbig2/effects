import * as THREE from "three";
import { AdvancedRenderManager } from "./AdvancedRenderManager";

// 色彩调整相关函数
const SATURATION = `
vec3 saturation(vec3 rgb, float adjustment) {
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}
`;

// 暗角效果函数
const VIGNETTE = `
float vignette(vec2 coords, float vignin, float vignout, float vignfade, float fstop) {
  float dist = distance(coords.xy, vec2(0.5, 0.5));
  dist = smoothstep(vignout + (fstop / vignfade), vignin + (fstop / vignfade), dist);
  return clamp(dist, 0.0, 1.0);
}
`;

// RGB 通道偏移函数
const RGBSHIFT = `
vec4 rgbshift(sampler2D image, vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;
    vec4 r = texture(image, uv + offset);
    vec4 g = texture(image, uv);
    vec4 b = texture(image, uv - offset);
    return vec4(r.r, g.g, b.b, g.a);
}
`;

// 多种混合模式函数
const BLEND = `
vec3 blendAdd(vec3 base, vec3 blend, float opacity) {
  vec3 mixed = min(base + blend, vec3(1.0));
  return mixed * opacity + base * (1.0 - opacity);
}

vec3 blendLighten(vec3 base, vec3 blend, float opacity) {
  vec3 mixed = max(base, blend);
  return mixed * opacity + base * (1.0 - opacity);
}

vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
  vec3 mixed = base * blend;
  return mixed * opacity + base * (1.0 - opacity);
}

vec3 blend(int mode, vec3 base, vec3 blend, float opacity) {
  if(mode == 1) {
    return blendAdd(base, blend, opacity);
  } else if(mode == 11) {
    return blendLighten(base, blend, opacity);
  } else if(mode == 15) {
    return blendMultiply(base, blend, opacity);
  }
  return base;
}
`;

/**
 * WorkScene 合成 Shader
 *
 * 当前架构：Work 直接输出为最终画面
 * - 合成主场景 (tScene)
 * - 可选叠加 Bloom
 * - 可选暗化 / 饱和度
 */
const COMPOSITE_FRAGMENT = `
precision highp float;

${RGBSHIFT}
${SATURATION}

uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform sampler2D tFluid;
uniform sampler2D tMouseSim;

uniform bool boolBloom;
uniform float uDarken;
uniform float uSaturation;

in vec2 vUv;
out vec4 FragColor;

void main() {
  vec2 uv = vUv;

  vec4 mixed = rgbshift(tScene, uv, -1., .0015);

  vec4 fluid = texture(tFluid, vUv);
  mixed.rgb += length(fluid.xy) * .015;

  if (boolBloom) {
    vec4 bloom = rgbshift(tBloom, uv, -1.5, .02);
    float angle = length(uv + 0.5);
    float amount = .001 * 2.5;
    mixed.rgb += bloom.rgb * 0.5;
    mixed.rgb += rgbshift(tBloom, uv, angle, amount / .5).rgb * 0.5;
  }

  mixed.rgb = mix(mixed.rgb, vec3(0.0), uDarken);
  mixed.rgb = saturation(mixed.rgb, uSaturation);

  FragColor = vec4(mixed.rgb, 1.);
}
`;

const COMPOSITE_VERTEX = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

class WorkCompositeMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      glslVersion: THREE.GLSL3,
      toneMapped: false,
      uniforms: {
        tScene: { value: null },
        tBloom: { value: null },
        tBlur: { value: null },
        tFluid: { value: null },
        tMouseSim: { value: null },
        boolBloom: { value: false },
        boolFluid: { value: false },
        boolLuminosity: { value: false },
        boolFxaa: { value: false },
        uDarken: { value: 0 },
        uSaturation: { value: 1 },
      },
      vertexShader: COMPOSITE_VERTEX,
      fragmentShader: COMPOSITE_FRAGMENT,
      blending: THREE.NormalBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
  }
}

/**
 * WorkRenderManager
 *
 * 继承 AdvancedRenderManager，复用其离屏管线。
 * 不同点：提供 Work 专用的合成 Shader（WorkCompositeMaterial）。
 */
export class WorkRenderManager extends AdvancedRenderManager {
  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    noiseTexture: THREE.Texture | null
  ) {
    // 传入 Work 专用合成材质
    super(renderer, scene, camera, new WorkCompositeMaterial(), noiseTexture);

    // 初始化占位纹理，避免未绑定时采样报错
    const black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    black.needsUpdate = true;
    this.compositeMaterial.uniforms.tFluid.value = black;
    this.compositeMaterial.uniforms.tMouseSim.value = black;
    this.compositeMaterial.uniforms.tBloom.value = black;
  }

  // 初始化默认后处理配置（Work 直接输出）
  override initSettings() {
    return {
      renderToScreen: true,
      fxaa: { enabled: false },
      mousesim: { enabled: true },
      luminosity: { threshold: 0.1, smoothing: 0.95, enabled: true },
      bloom: { strength: 0.15, radius: 1.5, enabled: true },
      blur: { scale: 1, strength: 8, enabled: false },
      fluid: { enabled: false },
    };
  }
}
