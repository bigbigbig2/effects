import * as THREE from "three";

const CONTRAST = `
vec3 contrast(vec3 color, float value) {
  return 0.5 + value * (color - 0.5);
}
`;

const SNOISE = `
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+10.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,
                      0.366025403784439,
                     -0.577350269189626,
                      0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

const CUSTOM_ROUGHNESS = `
float randomF(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float customRoughness(float roughness, vec2 vUv, float size, float time) {
  float roughnessFactor = roughness;
  vec2 triangle = vec2(mod(vUv.x * size, 1.0), mod(vUv.y * size, 1.0));
  vec2 cell = floor(vUv * size);
  float shade = randomF(cell) * 0.8 + 0.1;
  vec4 roughnessColor = vec4(1.);

  if(triangle.y > triangle.x) {
    roughnessColor = vec4(vec3(shade), 1.0);
  } else {
    roughnessColor = vec4(vec3(1.0 - shade), 1.0);
  }

   roughnessFactor *= roughnessColor.g;

  return roughnessFactor;
}
`;

const NOISE_SHADER = `
float noiseShaderRandom(vec2 n) {
  return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 ip = floor(p);
  vec2 u = fract(p);
  u = u * u * (3.0 - 2.0 * u);

  float res = mix(mix(noiseShaderRandom(ip), noiseShaderRandom(ip + vec2(1.0, 0.0)), u.x), mix(noiseShaderRandom(ip + vec2(0.0, 1.0)), noiseShaderRandom(ip + vec2(1.0, 1.0)), u.x), u.y);
  return res * res;
}

const mat2 mtx = mat2(0.80, 0.60, -0.60, 0.80);

float fbm(vec2 p, float time, float speed) {
  float f = 0.0;

  f += 0.500000 * noise(p - time * speed);
  p = mtx * p * 2.02;
  f += 0.031250 * noise(p);
  p = mtx * p * 2.01;
  f += 0.250000 * noise(p);
  p = mtx * p * 2.03;
  f += 0.125000 * noise(p);
  p = mtx * p * 2.01;
  f += 0.062500 * noise(p - time * (speed * 5.));
  p = mtx * p * 2.04;
  f += 0.015625 * noise(p + time * (speed * 5.));

  return f / 0.96875;
}

float pattern(vec2 p, float time, float speed) {
  float f1 = fbm(p, time, speed);
  float f2 = fbm(p + f1, time, speed);

  return fbm(p + f2, time, speed);
}
vec4 noiseShader(vec2 uv, float time, float speed) {
  float shade = pattern(uv, time, speed);
  return vec4(vec3(shade), shade);
}
`;

const BLEND_REFLECT = `
float blendReflect(float base, float blend) {
	return (blend==1.0)?blend:min(base*base/(1.0-blend),1.0);
}

vec3 blendReflect(vec3 base, vec3 blend) {
	return vec3(blendReflect(base.r,blend.r),blendReflect(base.g,blend.g),blendReflect(base.b,blend.b));
}

vec3 blendReflect(vec3 base, vec3 blend, float opacity) {
	return (blendReflect(base, blend) * opacity + base * (1.0 - opacity));
}
`;

const BLEND_NEGATION = `
vec3 blendNegation(vec3 base, vec3 blend) {
	return vec3(1.0)-abs(vec3(1.0)-base-blend);
}

vec3 blendNegation(vec3 base, vec3 blend, float opacity) {
	return (blendNegation(base, blend) * opacity + base * (1.0 - opacity));
}
`;

const BLEND_COLOR_BURN = `
float blendColorBurn(float base, float blend) {
	return (blend==0.0)?blend:max((1.0-((1.0-base)/blend)),0.0);
}

vec3 blendColorBurn(vec3 base, vec3 blend) {
	return vec3(blendColorBurn(base.r,blend.r),blendColorBurn(base.g,blend.g),blendColorBurn(base.b,blend.b));
}

vec3 blendColorBurn(vec3 base, vec3 blend, float opacity) {
	return (blendColorBurn(base, blend) * opacity + base * (1.0 - opacity));
}
`;

const OIL = `
vec4 oil(vec2 uv, float time, float strength) {
    float t = time;
    vec3 col = vec3(0.0);
    vec2 pos = uv;
    float noisePos = snoise(uv * 1.15) * .005;

    for (float k = 1.0; k < 5.0; k += 1.) {
        pos.x += strength * sin(2.0 * t + k * 1.5 * pos.y + noisePos * 10.);
        pos.y += strength * cos(2.0 * t + k * 1.5 * pos.x - noisePos);
    }

    col += clamp(-0.0 + 0.5 * cos(t * 0.5 + pos.xyx * 3.0).xxx, -0.1, 0.99);
    return vec4(col, 1.0);
}
`;

const SKY_VERTEX = `
out vec2 vUv;
void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const SKY_FRAGMENT = `
precision highp float;

${CONTRAST}
${SNOISE}
${CUSTOM_ROUGHNESS}
${NOISE_SHADER}
${BLEND_REFLECT}
${BLEND_NEGATION}
${BLEND_COLOR_BURN}
${OIL}

#include <tonemapping_pars_fragment>

uniform sampler2D tScene;
uniform float uTime;
uniform float uShader1Speed;
uniform float uShader1Alpha;
uniform float uShader1Scale;
uniform float uShader2Speed;
uniform float uShader2Scale;
uniform float uShader1Mix3;
uniform float uShader3Scale;
uniform float uShaderMix;

in vec2 vUv;
out vec4 FragColor;

void main() {
  vec2 uv = vUv;

  vec2 pos = vUv.xy * 4.;
  pos.x *= 1.5;

  vec4 noise = noiseShader(pos, uTime, uShader1Speed * .1);
  vec4 diffuseColor = texture(tScene, vUv);

  diffuseColor.rgb = blendReflect(diffuseColor.rgb, noise.rgb, .5);
  diffuseColor.rgb = contrast(diffuseColor.rgb, 2.);
  diffuseColor.rgb = diffuseColor.rgb * 2.;

  FragColor = vec4(.9 - diffuseColor.rgb, 1.);

  #include <tonemapping_fragment>
}
`;

class SkyCompositeMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      glslVersion: THREE.GLSL3,
      toneMapped: false,
      uniforms: {
        tScene: { value: null },
        uTime: { value: 0 },
        uShader1Alpha: { value: 0.5 },
        uShader1Speed: { value: 0.5 },
        uShader2Speed: { value: 0 },
        uShader1Scale: { value: 5.5 },
        uShader2Scale: { value: 0 },
        uShader1Mix3: { value: 1.5 },
        uShader3Scale: { value: 0 },
        uShaderMix: { value: 1.5 },
      },
      vertexShader: SKY_VERTEX,
      fragmentShader: SKY_FRAGMENT,
      blending: THREE.NormalBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
  }
}

type SkySettings = {
  renderToScreen: boolean;
};

export class SkyRenderManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.Camera;
  readonly screenCamera: THREE.OrthographicCamera;
  readonly screenGeometry: THREE.BufferGeometry;
  readonly screen: THREE.Mesh;
  readonly renderTargetA: THREE.WebGLRenderTarget;
  readonly renderTargetComposite: THREE.WebGLRenderTarget;
  readonly compositeMaterial: SkyCompositeMaterial;
  readonly settings: SkySettings;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.settings = { renderToScreen: false };

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
    this.compositeMaterial = new SkyCompositeMaterial();
    this.screen = new THREE.Mesh(this.screenGeometry, this.compositeMaterial);
    this.screen.frustumCulled = false;

    this.renderTargetA = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.renderTargetComposite = this.renderTargetA.clone();
  }

  resize(width: number, height: number, dpr: number) {
    if (this.settings.renderToScreen) {
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(width, height);
    }
    const w = Math.max(1, Math.round(width * dpr));
    const h = Math.max(1, Math.round(height * dpr));
    this.renderTargetA.setSize(w, h);
    this.renderTargetComposite.setSize(w, h);
  }

  update(time: number, camera: THREE.Camera = this.camera, scene: THREE.Scene = this.scene) {
    const renderer = this.renderer;
    renderer.setRenderTarget(this.renderTargetA);
    renderer.render(scene, camera);

    this.compositeMaterial.uniforms.tScene.value = this.renderTargetA.texture;
    this.compositeMaterial.uniforms.uTime.value = time;
    this.screen.material = this.compositeMaterial;

    if (this.settings.renderToScreen) {
      renderer.setRenderTarget(null);
      renderer.render(this.screen, this.screenCamera);
    } else {
      renderer.setRenderTarget(this.renderTargetComposite);
      renderer.render(this.screen, this.screenCamera);
      renderer.setRenderTarget(null);
    }
  }
}
