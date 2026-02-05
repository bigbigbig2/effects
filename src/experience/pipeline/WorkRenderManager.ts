import * as THREE from "three";
import { AdvancedRenderManager } from "./AdvancedRenderManager";

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

const COMPOSITE_FRAGMENT = `
precision highp float;

${SATURATION}
${VIGNETTE}
${RGBSHIFT}
${BLEND}

uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform sampler2D tFluid;
uniform sampler2D tBlur;
uniform sampler2D tMouseSim;

uniform bool boolBloom;
uniform bool boolFluid;
uniform bool boolLuminosity;
uniform bool boolFxaa;

uniform float uDarken;
uniform float uSaturation;

float vignout = .55;
float vignin = 0.1;
float vignfade = 2.0;

in vec2 vUv;
out vec4 FragColor;

void main() {
  vec4 fluid = texture(tFluid, vUv);
  vec4 mouseSim = texture(tMouseSim, vUv);
  vec2 uv = vUv;
  vec4 mixed = rgbshift(tScene, uv, -1., .0015);

  if(boolBloom) {
    vec4 bloom = rgbshift(tBloom, uv, -1.5, .02);
    float angle = length(uv + 0.5);
    float uBloomDistortion = 2.5;
    float amount = .001 * uBloomDistortion;

    mixed.rgb += bloom.rgb;
    mixed.rgb += rgbshift(tBloom, uv, angle, amount / .5).rgb;
  }

  mixed.rgb += length(fluid.xy) * .015;

  vec3 black = vec3(0.095,0.095,0.095);

  mixed.rgb = blend(15, mixed.rgb, black, uDarken * 2. + mouseSim.r * .25 * uDarken);
  mixed.rgb = blend(11, mixed.rgb, black, 1.);
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

export class WorkRenderManager extends AdvancedRenderManager {
  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    noiseTexture: THREE.Texture | null
  ) {
    super(renderer, scene, camera, new WorkCompositeMaterial(), noiseTexture);
    const black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    black.needsUpdate = true;
    this.compositeMaterial.uniforms.tFluid.value = black;
    this.compositeMaterial.uniforms.tMouseSim.value = black;
    this.compositeMaterial.uniforms.tBloom.value = black;
  }

  override initSettings() {
    return {
      renderToScreen: false,
      fxaa: { enabled: false },
      mousesim: { enabled: true },
      luminosity: { threshold: 0.1, smoothing: 0.95, enabled: true },
      bloom: { strength: 0.15, radius: 1.5, enabled: true },
      blur: { scale: 1, strength: 8, enabled: false },
      fluid: { enabled: false },
    };
  }
}
