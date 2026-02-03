import * as THREE from "three";

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

const MAIN_FRAGMENT = `
precision highp float;

${SATURATION}
${VIGNETTE}
${CONTRAST}
${RGBSHIFT}
${BLEND}

#include <tonemapping_pars_fragment>

uniform sampler2D tScene;
uniform sampler2D tWork;
uniform sampler2D tBloom;
uniform sampler2D tMouseSim;
uniform sampler2D tFluid;
uniform sampler2D tBlur;
uniform sampler2D tNoise;
uniform sampler2D tLensflare;

uniform sampler2D tMedia;
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
uniform float uMistStrength;

in vec2 vUv;
out vec4 FragColor;

float random(vec2 st)
{
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

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

void main() {
  vec2 perlinUv = vUv * .25;

  perlinUv.xy -= 0.5;
  perlinUv.x *= uRatio;
  perlinUv.xy += 0.5;

  perlinUv.x -= uTime * .01;
  perlinUv.y -= uTime * .005;

  perlinUv.x += uTransformX;

  vec4 perlin = texture(tPerlin, perlinUv);
  perlin.rgb = contrast(perlin.rgb, 5.);

  vec2 displacementUv = vUv * 2.;
  displacementUv.xy -= 0.5;
  displacementUv.x *= uRatio;
  displacementUv.xy += 0.5;

  vec4 fluid = texture(tFluid, vUv);
  vec2 fluidUv = vUv + fluid.rg * -.2 * uFluidStrength;
  vec2 uv = vUv + fluid.rg * -.2 * uFluidStrength;

  vec2 perlinCoords = vUv;

  float vignetteF = vignette(uv.xy, 0.1, .55, 2.0, .25);

  if(uPerlin > 0.0) {
    perlinCoords += perlin.b * uPerlin;
    perlinCoords -= uPerlin * .065;
  }

  vec4 mouseSim = texture(tMouseSim, mix(perlinCoords, uv, 2.5));
  mouseSim.rgb = contrast(mouseSim.rgb, 1.);

  float perlinVignette = vignette(perlinCoords.xy, 0.1, .35, 2.0, .5);
  float displacementVignette = vignette(uv.xy, 0.1, .5, 2.0, .5);

  vec4 sceneDisplaced = rgbshift(tWork, uv, -1., .005);
  vec4 scene = rgbshift(tWork, uv, -1., .0005 + .1 * length(fluid.xy) * uFluidStrength);

  vec3 sceneMixed = mix(scene.rgb, sceneDisplaced.rgb, (1. - displacementVignette) * 1.);
  vec3 mixed = mix(uBgColor, sceneMixed.rgb, 1.);

  mixed.rgb += mouseSim.rgb * .065;
  mixed.rgb = mix(mixed.rgb, mixed.rgb * 5., (1. - perlinVignette) * .075);

  vec3 displacedPerlin = perlin.rgb;
  mixed.rgb = blend(1, mixed.rgb, displacedPerlin, (1. - displacementVignette +  mouseSim.r * .5) * .05);

  if(boolBloom) {
    vec4 bloom = rgbshift(tBloom, uv, -1.5, .02);
    float angle = length(uv + 0.5);
    float uBloomDistortion = 2.5;
    float amount = .001 * uBloomDistortion;

    mixed.rgb += bloom.rgb;
    mixed.rgb += rgbshift(tBloom, uv, angle, amount / .5).rgb;
  }

  vec2 noiseUv = vUv;
  noiseUv.xy -= 0.5;
  noiseUv.x *= uRatio;
  noiseUv.xy += 0.5;
  noiseUv.xy *= 15.;

  vec4 noise = texture(tNoise, noiseUv);

  mixed.rgb = contrast(mixed.rgb, uContrast);
  mixed.rgb *= uContrast;

  mixed.rgb = saturation(mixed.rgb, 1.15);
  mixed.rgb = blend(11, mixed.rgb, uBgColor.rgb, .85);

  vec4 media = rgbshift(tMedia, fluidUv, length(fluidUv + 2.5), .15 * length(fluid.xy) * uFluidStrength);

  if (uMistStrength > 0.0) {
    vec2 mistUv = vUv * 1.5;
    mistUv.xy -= 0.5;
    mistUv.x *= uRatio;
    mistUv.xy += 0.5;
    vec4 mistNoise = texture(tPerlin, mistUv + vec2(uTime * 0.02, -uTime * 0.01));
    float mistMask = smoothstep(0.2, 0.8, mistNoise.r);
    mistMask *= smoothstep(0.0, 0.8, 1.0 - vUv.y);
    mixed.rgb = mix(mixed.rgb, uBgColor.rgb, mistMask * uMistStrength);
  }

  mixed.rgb = mix(mixed.rgb, media.rgb, media.a * uMediaReveal);
  mixed.rgb = mix(mixed.rgb * noise.rgb, mixed.rgb, .75);
  mixed.rgb = mix(mixed.rgb * noise.rgb, mixed.rgb, 1.5);

  FragColor = vec4(mixed.rgb, 1.);
  #include <tonemapping_fragment>
}
`;

const MAIN_VERTEX = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
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
        uReveal: { value: 1 },
        uMediaReveal: { value: 0 },
        uContrast: { value: 1.1 },
        uTransformX: { value: 0 },
        uFluidStrength: { value: 0.5 },
        uMistStrength: { value: 0.35 },
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
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly mesh: THREE.Mesh;
  readonly material: MainCompositeMaterial;
  private dummyTexture: THREE.Texture;

  constructor(
    renderer: THREE.WebGLRenderer,
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
  }

  setNoiseTexture(texture: THREE.Texture) {
    this.material.uniforms.tNoise.value = texture;
  }

  setPerlinTexture(texture: THREE.Texture) {
    this.material.uniforms.tPerlin.value = texture;
  }

  resize(width: number, height: number) {
    this.material.uniforms.uRatio.value = width / height;
    this.material.uniforms.uContainerSize.value.set(width, height);
  }

  render(options: {
    time: number;
    work: THREE.Texture | null;
    media: THREE.Texture | null;
    mouse?: THREE.Texture | null;
    bloom?: THREE.Texture | null;
    ratio: number;
    fluidStrength?: number;
  }) {
    const { time, work, media, mouse, bloom, ratio, fluidStrength = 0 } = options;
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uRatio.value = ratio;
    this.material.uniforms.tWork.value = work ?? this.dummyTexture;
    this.material.uniforms.tMedia.value = media ?? this.dummyTexture;
    this.material.uniforms.tMouseSim.value = mouse ?? this.dummyTexture;
    this.material.uniforms.tBloom.value = bloom ?? this.dummyTexture;
    this.material.uniforms.boolBloom.value = !!bloom;
    this.material.uniforms.uFluidStrength.value = fluidStrength;

    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }
}
