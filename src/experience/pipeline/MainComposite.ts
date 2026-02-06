import * as THREE from "three";
import type { Renderer } from "../core/Renderer";

/**
 * ACES Filmic 色调映射
 * 
 * 用途：将 HDR (高动态范围) 映射到 LDR (低动态范围)
 * 
 * 特点：
 * - 保留暗部细节
 * - 高光柔和过渡（不会突然变白）
 * - 电影感强
 * 
 * 来源：ACES (Academy Color Encoding System)
 */
const ACES_TONEMAPPING = `
vec3 ACESFilm(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}
`;

const SATURATION = `
vec3 saturation(vec3 rgb, float adjustment) {
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}
`;

const VIGNETTE = `
float vignette(vec2 coords, float vignin, float vignout, float vignfade, float fstop) {
  float dist = distance(coords.xy, vec2(0.5, 0.5));
  dist = smoothstep(vignout + (fstop / vignfade), vignin + (fstop / vignfade), dist);
  return clamp(dist, 0.0, 1.0);
}
`;

const CONTRAST = `
vec3 contrast(vec3 color, float value) {
  return 0.5 + value * (color - 0.5);
}
`;

const RGBSHIFT = `
vec4 rgbshift(sampler2D image, vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;
    vec4 r = texture(image, uv + offset);
    vec4 g = texture(image, uv);
    vec4 b = texture(image, uv - offset);
    return vec4(r.r, g.g, b.b, g.a);
}
`;

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
 * MainComposite 片段着色器
 * 
 * 这是整个渲染管线的最后一步，负责将所有渲染层组合成最终画面。
 * 
 * 【渲染层输入】：
 * - tWork: 主 3D 场景（WorkScene 渲染的结果）
 * - tMedia: 媒体层（图片/视频）
 * - tBloom: Bloom 发光效果
 * - tMouseSim: 鼠标交互模拟纹理
 * - tFluid: 流体扭曲纹理（WavvesScene）
 * - tPerlin: Perlin 噪声纹理
 * - tNoise: 蓝噪声纹理（用于胶片颗粒感）
 * 
 * 【组合流程】（12 个步骤）：
 * 1. 准备动态 UV 坐标（Perlin 噪声动画）
 * 2. 流体扭曲（基于 WavvesScene 的波纹）
 * 3. 采样主场景 + RGB 色彩偏移（模拟色差）
 * 4. 添加鼠标交互效果（发光轨迹）
 * 5. 添加 Perlin 噪声（增加细节）
 * 6. 添加 Bloom 发光（两次采样，增强效果）
 * 7. 准备蓝噪声纹理
 * 8. 统一后处理（暗化、对比度、饱和度）
 * 9. 混合媒体层（图片/视频）
 * 10. 添加胶片噪声（复古感）
 * 11. 应用曝光度
 * 12. ACES 色调映射（HDR → LDR）
 */
const MAIN_FRAGMENT = `
precision highp float;

${ACES_TONEMAPPING}
${SATURATION}
${VIGNETTE}
${CONTRAST}
${RGBSHIFT}
${BLEND}

vec4 coverTexture(sampler2D tex, vec2 imgSize, vec2 ouv, vec2 containerSize) {
  vec2 s = containerSize;
  vec2 i = imgSize;
  float rs = s.x / s.y;
  float ri = i.x / i.y;
  vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
  vec2 newOffset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
  vec2 uv = ouv * s / new + newOffset;
  vec4 color = texture(tex, uv);

  return color;
}

uniform sampler2D tScene;
uniform sampler2D tWork;
uniform sampler2D tBloom;
uniform sampler2D tMouseSim;
uniform sampler2D tFluid;
uniform sampler2D tBlur;
uniform sampler2D tNoise;
uniform sampler2D tLensflare;

uniform sampler2D tMedia;
uniform sampler2D tSky;
uniform sampler2D tThumb;
uniform sampler2D tDepth;
uniform float uMediaReveal;
uniform float uFluidStrength;

uniform float uRatio;
uniform float uReveal;
uniform vec3 uBgColor;

uniform bool boolBloom;
uniform bool boolFluid;
uniform bool boolLuminosity;
uniform bool boolFxaa;

uniform vec2 uDisplacementSize;
uniform vec2 uContainerSize;
uniform float uDisplacement;
uniform float uPerlin;
uniform float uContrast;
uniform sampler2D tPerlin;
uniform float uTime;
uniform float uTransformX;

// 新增：色调映射控制
uniform bool uEnableToneMapping;
uniform float uExposure;

// 新增：从 render 设置迁移过来的控制
uniform float uDarken;
uniform float uSaturation;

// 新增：层可见性控制
uniform bool uShowWork;
uniform bool uShowMedia;
uniform bool uShowMouse;
uniform bool uShowBloom;
uniform bool uShowFluid;
uniform int uDebugView;

uniform bool uFogEnabled;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uFogColor;
uniform float uCameraNear;
uniform float uCameraFar;

in vec2 vUv;
out vec4 FragColor;

float random(vec2 st)
{
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float linearizeDepth(float depth, float near, float far) {
  float z = depth * 2.0 - 1.0;
  return (2.0 * near * far) / (far + near - z * (far - near));
}

void main() {
  // 背景基底：天空纹理 + 微弱雾感 + 轻微光斑（更克制）
  // 背景使用标准 0~1 UV，避免因宽高比缩放导致的重复平铺
  vec2 bgUv = vUv;

  vec2 skyUv = clamp(bgUv, 0.001, 0.999);
  vec3 skyColor = texture(tSky, skyUv).rgb;

  vec2 fogUv = clamp(bgUv * 0.6, 0.001, 0.999);
  float fogNoise = texture(tPerlin, fogUv).r;
  fogNoise = (fogNoise - 0.5) * 0.12;

  float horizon = smoothstep(0.0, 0.75, 1.0 - bgUv.y);
  float haze = clamp(horizon * 0.35 + fogNoise, 0.0, 1.0);
  float glow = smoothstep(0.7, 0.15, distance(bgUv, vec2(0.8, 0.52)));

  vec3 fogTint = mix(uBgColor, vec3(0.82, 0.9, 1.0), 0.35);
  vec3 bgColor = mix(uBgColor, skyColor, 0.55);
  bgColor = mix(bgColor, fogTint, haze);
  bgColor += glow * 0.08;

  // Debug View: 直接输出指定层，绕过所有合成逻辑
  if (uDebugView != 0) {
    vec2 duv = vUv;
    if (uDebugView == 1) { FragColor = vec4(texture(tWork, duv).rgb, 1.); return; }
    if (uDebugView == 2) { FragColor = vec4(texture(tMedia, duv).rgb, 1.); return; }
    if (uDebugView == 3) { FragColor = vec4(texture(tBloom, duv).rgb, 1.); return; }
    if (uDebugView == 4) { FragColor = vec4(texture(tMouseSim, duv).rgb, 1.); return; }
    if (uDebugView == 5) { FragColor = vec4(texture(tFluid, duv).rgb, 1.); return; }
    if (uDebugView == 6) { FragColor = vec4(texture(tNoise, duv).rgb, 1.); return; }
    if (uDebugView == 7) { FragColor = vec4(texture(tPerlin, duv).rgb, 1.); return; }
    if (uDebugView == 8) { FragColor = vec4(bgColor, 1.); return; }
    if (uDebugView == 9) { FragColor = vec4(texture(tSky, duv).rgb, 1.); return; }
    if (uDebugView == 10) { FragColor = vec4(texture(tThumb, duv).rgb, 1.); return; }
  }

  // ========================================
  // 步骤 1: 准备 UV 和 Perlin 噪声纹理
  // ========================================
  // 目的：创建动态的、随时间变化的噪声效果
  
  // 1.1 计算 Perlin 噪声的 UV（缩小 4 倍，慢速滚动）
  vec2 perlinUv = vUv * .25;
  perlinUv.xy -= 0.5;
  perlinUv.x *= uRatio;  // 保持宽高比
  perlinUv.xy += 0.5;
  perlinUv.x -= uTime * .01;   // 水平滚动（慢）
  perlinUv.y -= uTime * .005;  // 垂直滚动（更慢）
  perlinUv.x += uTransformX;   // 额外的水平偏移

  // 1.2 采样 Perlin 噪声并增强对比度
  vec4 perlin = texture(tPerlin, perlinUv);
  perlin.rgb = contrast(perlin.rgb, 5.);  // 对比度 x5，让噪声更明显

  // ========================================
  // 步骤 2: 流体扭曲（Fluid Distortion）
  // ========================================
  // 目的：基于 WavvesScene 的波纹，扭曲整个画面
  
  // 2.1 采样流体纹理（来自 WavvesScene）
  vec4 fluid = texture(tFluid, vUv);
  if (!uShowFluid) {
    fluid = vec4(0.0);
  }
  
  // 2.2 根据流体的 RG 通道（表示 2D 向量场）扭曲 UV
  // 如果 uShowFluid 为 false，则不应用扭曲
  vec2 fluidUv = uShowFluid ? vUv + fluid.rg * -.2 * uFluidStrength : vUv;
  vec2 uv = uShowFluid ? vUv + fluid.rg * -.2 * uFluidStrength : vUv;
  vec2 perlinCoords = vUv;

  // 2.3 计算晕影遮罩（边缘变暗）
  float vignetteF = vignette(uv.xy, 0.1, .55, 2.0, .25);

  // 2.4 如果启用了 Perlin 扰动，进一步扭曲坐标
  if(uPerlin > 0.0) {
    perlinCoords += perlin.b * uPerlin;
    perlinCoords -= uPerlin * .065;
  }

  // ========================================
  // 步骤 3: 采样主场景 + RGB 色彩偏移
  // ========================================
  // 目的：获取主 3D 场景，并添加色差效果（模拟镜头色散）
  
  // 3.1 采样鼠标交互纹理（用于后续步骤）
  vec4 mouseSim = texture(tMouseSim, mix(perlinCoords, uv, 2.5));
  mouseSim.rgb = contrast(mouseSim.rgb, 1.);
  if (!uShowMouse) {
    mouseSim = vec4(0.0);
  }
  
  // 3.2 计算两个不同的晕影遮罩
  float perlinVignette = vignette(perlinCoords.xy, 0.1, .35, 2.0, .5);
  float displacementVignette = vignette(uv.xy, 0.1, .5, 2.0, .5);
  
  // 3.3 采样主场景，应用两种不同强度的 RGB 偏移
  // rgbshift: 将 R、G、B 三个通道分别偏移，模拟色差
  vec4 sceneDisplaced = rgbshift(tWork, uv, -1., .005);  // 强偏移
  vec4 scene = rgbshift(tWork, uv, -1., .0005 + .1 * length(fluid.xy) * uFluidStrength);  // 弱偏移 + 流体影响
  
  // 3.4 混合两种偏移效果（边缘使用强偏移，中心使用弱偏移）
  vec3 sceneMixed = mix(scene.rgb, sceneDisplaced.rgb, (1. - displacementVignette) * 1.);
  
  // 3.5 将场景与背景混合（如果 uShowWork 为 false，只显示背景）
  vec3 mixed = uShowWork ? mix(bgColor, sceneMixed.rgb, 1.) : bgColor;

  // ========================================
  // 步骤 4: 添加鼠标交互效果
  // ========================================
  // 目的：在鼠标移动轨迹上添加发光效果
  
  if(uShowMouse) {
    // 4.1 直接叠加鼠标模拟纹理（加法混合）
    mixed.rgb += mouseSim.rgb * .065;
    
    // 4.2 在边缘区域增强亮度（基于 perlinVignette）
    mixed.rgb = mix(mixed.rgb, mixed.rgb * 5., (1. - perlinVignette) * .075);
  }

  // ========================================
  // 步骤 5: 添加 Perlin 噪声细节
  // ========================================
  // 目的：增加画面的细节和质感
  
  vec3 displacedPerlin = perlin.rgb;
  // blend(1, ...) 使用加法混合模式
  // 强度受 displacementVignette 和 mouseSim 影响（边缘和鼠标区域更明显）
  mixed.rgb = blend(1, mixed.rgb, displacedPerlin, (1. - displacementVignette +  mouseSim.r * .5) * .05);

  // ========================================
  // 步骤 6: 添加 Bloom 发光效果
  // ========================================
  // 目的：让亮部产生柔和的发光扩散
  
  if(boolBloom && uShowBloom) {
    // 6.1 第一次采样：基础 Bloom（带轻微 RGB 偏移）
    vec4 bloom = rgbshift(tBloom, uv, -1.5, .02);
    
    // 6.2 第二次采样：径向 Bloom（从中心向外扩散）
    float angle = length(uv + 0.5);  // 计算径向角度
    float uBloomDistortion = 2.5;
    float amount = .001 * uBloomDistortion;

    // 6.3 叠加两次 Bloom（强度降低到 50%，避免过曝）
    mixed.rgb += bloom.rgb * 0.5;
    mixed.rgb += rgbshift(tBloom, uv, angle, amount / .5).rgb * 0.5;
  }

  // ========================================
  // 步骤 7: 准备蓝噪声纹理
  // ========================================
  // 目的：为后续的胶片颗粒感做准备
  
  vec2 noiseUv = vUv;
  noiseUv.xy -= 0.5;
  noiseUv.x *= uRatio;  // 保持宽高比
  noiseUv.xy += 0.5;
  noiseUv.xy *= 15.;    // 放大 15 倍（小颗粒）
  vec4 noise = texture(tNoise, noiseUv);

  // ========================================
  // 步骤 8: 统一后处理（色彩校正）
  // ========================================
  // 目的：调整整体的明暗、对比度、饱和度
  
  // 8.1 暗化（向黑色混合）
  mixed.rgb = mix(mixed.rgb, vec3(0.0), uDarken);
  
  // 8.2 对比度增强（两次应用）
  mixed.rgb = contrast(mixed.rgb, uContrast);
  mixed.rgb *= uContrast;
  
  // 8.3 饱和度调整（两次应用）
  mixed.rgb = saturation(mixed.rgb, uSaturation);  // 用户控制的饱和度
  mixed.rgb = saturation(mixed.rgb, 1.15);         // 额外增强 15%
  
  // 8.4 与背景色混合（使用 Lighten 混合模式）
  // blend(11, ...) 是 blendLighten，取两者中较亮的值
  mixed.rgb = blend(11, mixed.rgb, bgColor, .2);
  
  // ========================================
  // 步骤 9: 混合媒体层（图片/视频）
  // ========================================
  // 目的：在 3D 场景上叠加媒体内容
  
  if(uShowMedia) {
    // 9.1 采样媒体纹理（使用流体扭曲后的 UV）
    // RGB 偏移量受流体强度影响
    vec4 media = rgbshift(tMedia, fluidUv, length(fluidUv + 2.5), .15 * length(fluid.xy) * uFluidStrength);
    
    // 9.2 基于 alpha 通道和 uMediaReveal 参数混合
    mixed.rgb = mix(mixed.rgb, media.rgb, media.a * uMediaReveal);
  }
  
  // ========================================
  // 步骤 10: 距离雾（基于深度纹理）
  // ========================================
  if (uFogEnabled) {
    float depth = texture(tDepth, vUv).r;
    float viewDepth = linearizeDepth(depth, uCameraNear, uCameraFar);
    float fogFactor = smoothstep(uFogNear, uFogFar, viewDepth);
    vec3 fogTarget = mix(uFogColor, bgColor, 0.6);
    mixed.rgb = mix(mixed.rgb, fogTarget, clamp(fogFactor, 0.0, 1.0));
  }

  // ========================================
  // 步骤 11: 添加胶片噪声（Film Grain）
  // ========================================
  // 目的：模拟胶片的颗粒感，增加复古质感
  
  // 11.1 第一次混合：75% 保留原色，25% 应用噪声
  mixed.rgb = mix(mixed.rgb * noise.rgb, mixed.rgb, .75);
  
  // 11.2 第二次混合：进一步减弱噪声效果
  // 注意：这里 1.5 > 1.0，所以实际上是完全保留原色（可能是为了微调）
  mixed.rgb = mix(mixed.rgb * noise.rgb, mixed.rgb, 1.5);
 
  // ========================================
  // 步骤 12: 应用曝光度
  // ========================================
  // 目的：整体调亮或调暗画面
  
  mixed.rgb *= uExposure;
 
  // ========================================
  // 步骤 13: ACES 色调映射（HDR → LDR）
  // ========================================
  // 目的：将高动态范围映射到显示器可显示的范围
  // 特点：保留暗部细节，高光柔和过渡，电影感强
  
  if(uEnableToneMapping) {
    mixed.rgb = ACESFilm(mixed.rgb);
  }
 
  // ========================================
  // 最终输出
  // ========================================
  FragColor = vec4(mixed.rgb, 1.);
}
`;

const MAIN_VERTEX = `
out vec2 vUv;
void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * mvPosition;
}
`;

class MainCompositeMaterial extends THREE.ShaderMaterial {
  constructor({
    noiseTexture,
    perlinTexture,
  }: {
    noiseTexture: THREE.Texture | null;
    perlinTexture: THREE.Texture | null;
  }) {
    const dummyTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    dummyTexture.needsUpdate = true;
    super({
      glslVersion: THREE.GLSL3,
      toneMapped: false,
      uniforms: {
        tScene: { value: null },
        tWork: { value: null },
        tMedia: { value: null },
        tSky: { value: null },
        tThumb: { value: null },
        tDepth: { value: null },
        tBloom: { value: null },
        tBlur: { value: null },
        tFluid: { value: null },
        tPortal: { value: null },
        tMouseSim: { value: null },
        boolBloom: { value: false },
        boolFluid: { value: false },
        boolLuminosity: { value: false },
        boolFxaa: { value: false },
        uTime: { value: 0 },
        tNoise: { value: noiseTexture ?? dummyTexture },
        tLensflare: { value: null },
        uRatio: { value: 1 },
        tPerlin: { value: perlinTexture ?? dummyTexture },
        uDisplacementSize: { value: new THREE.Vector2() },
        uContainerSize: { value: new THREE.Vector2() },
        uDisplacement: { value: 0.1 },
        uPerlin: { value: 0.1 },
        uBgColor: { value: new THREE.Color("#1F1F1F").convertLinearToSRGB() },
        uReveal: { value: 0 },
        uMediaReveal: { value: 0 },
        uContrast: { value: 1.1 },
        uTransformX: { value: 0 },
        uFluidStrength: { value: 0.5 },
        // 新增：色调映射控制
        uEnableToneMapping: { value: true },
        uExposure: { value: 1.0 },
        // 新增：从 render 设置迁移过来的控制
        uDarken: { value: 0.2 },
        uSaturation: { value: 0.35 },
        // 新增：层可见性控制
        uShowWork: { value: true },
        uShowMedia: { value: true },
        uShowMouse: { value: true },
        uShowBloom: { value: true },
        uShowFluid: { value: true },
        uDebugView: { value: 0 },
        uFogEnabled: { value: false },
        uFogNear: { value: 1 },
        uFogFar: { value: 50 },
        uFogColor: { value: new THREE.Color("#1f1f1f").convertLinearToSRGB() },
        uCameraNear: { value: 1 },
        uCameraFar: { value: 2000 },
      },
      vertexShader: MAIN_VERTEX,
      fragmentShader: MAIN_FRAGMENT,
      blending: THREE.NormalBlending,
      transparent: false,
      depthWrite: false,
      depthTest: false,
    });
  }
}

export class MainComposite {
  readonly renderer: Renderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly mesh: THREE.Mesh;
  readonly material: MainCompositeMaterial;
  readonly renderTarget: THREE.WebGLRenderTarget;
  private dummyTexture: THREE.Texture;

  constructor(
    renderer: Renderer,
    textures: { noise: THREE.Texture | null; perlin: THREE.Texture | null }
  ) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([-1, 3, 0, -1, -1, 0, 3, -1, 0]), 3)
    );
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array([0, 2, 0, 0, 2, 0]), 2)
    );

    this.material = new MainCompositeMaterial({
      noiseTexture: textures.noise,
      perlinTexture: textures.perlin,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);

    this.dummyTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    this.dummyTexture.needsUpdate = true;
    this.material.uniforms.tFluid.value = this.dummyTexture;
    this.material.uniforms.tMouseSim.value = this.dummyTexture;
    this.material.uniforms.tBloom.value = this.dummyTexture;
    this.material.uniforms.tSky.value = this.dummyTexture;
    this.material.uniforms.tThumb.value = this.dummyTexture;
    this.material.uniforms.tDepth.value = this.dummyTexture;
    this.renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      stencilBuffer: false,
      type: THREE.HalfFloatType,
    });
    this.renderTarget.texture.colorSpace = THREE.LinearSRGBColorSpace;
  }

  setNoiseTexture(texture: THREE.Texture) {
    this.material.uniforms.tNoise.value = texture;
  }

  setPerlinTexture(texture: THREE.Texture) {
    this.material.uniforms.tPerlin.value = texture;
  }

  resize(width: number, height: number, dpr = 1) {
    this.material.uniforms.uRatio.value = width / height;
    this.material.uniforms.uContainerSize.value.set(width, height);
    this.renderTarget.setSize(Math.round(width * dpr), Math.round(height * dpr));
  }

  render(options: {
    time: number;
    work: THREE.Texture | null;
    media: THREE.Texture | null;
    mouse?: THREE.Texture | null;
    bloom?: THREE.Texture | null;
    fluid?: THREE.Texture | null;
    sky?: THREE.Texture | null;
    thumb?: THREE.Texture | null;
    depth?: THREE.Texture | null;
    cameraNear?: number;
    cameraFar?: number;
    ratio: number;
    fluidStrength?: number;
  }) {
    const { time, work, media, mouse, bloom, fluid, sky, thumb, ratio, fluidStrength = 0 } =
      options;
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uRatio.value = ratio;
    this.material.uniforms.tWork.value = work ?? this.dummyTexture;
    this.material.uniforms.tMedia.value = media ?? this.dummyTexture;
    this.material.uniforms.tMouseSim.value = mouse ?? this.dummyTexture;
    this.material.uniforms.tBloom.value = bloom ?? this.dummyTexture;
    this.material.uniforms.tFluid.value = fluid ?? this.dummyTexture;
    this.material.uniforms.tSky.value = sky ?? this.dummyTexture;
    this.material.uniforms.tThumb.value = thumb ?? this.dummyTexture;
    this.material.uniforms.tDepth.value = options.depth ?? this.dummyTexture;
    if (options.cameraNear !== undefined) {
      this.material.uniforms.uCameraNear.value = options.cameraNear;
    }
    if (options.cameraFar !== undefined) {
      this.material.uniforms.uCameraFar.value = options.cameraFar;
    }
    this.material.uniforms.boolBloom.value = !!bloom;
    this.material.uniforms.boolFluid.value = !!fluid;
    this.material.uniforms.uFluidStrength.value = fluidStrength;

    this.renderer.render(this.scene, this.camera, this.renderTarget);
  }

  get texture() {
    return this.renderTarget.texture;
  }
}
