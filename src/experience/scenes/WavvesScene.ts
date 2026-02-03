import * as THREE from "three";

const VIGNETTE = `
float vignette(vec2 coords, float vignin, float vignout, float vignfade, float fstop) {
  float dist = distance(coords.xy, vec2(0.5, 0.5));
  dist = smoothstep(vignout + (fstop / vignfade), vignin + (fstop / vignfade), dist);
  return clamp(dist, 0.0, 1.0);
}
`;

const WAVVES_FRAGMENT = `
precision highp float;

${VIGNETTE}

#include <tonemapping_pars_fragment>

uniform sampler2D tScene;
uniform float uTime;
uniform float uRatio;

float vignout = .5;
float vignin = 0.01;
float vignfade = 2.0;

in vec2 vUv;
out vec4 FragColor;

void main() {
  vec2 uvOff = vUv;

  uvOff.x -= 0.5;
  uvOff.x *= uRatio;
  uvOff.x += 0.5;

  vec2 uvVignette = uvOff;

  uvOff.xy -= 0.5;
  uvOff *= 5.;
  uvOff.xy += 0.5;

  float strength = 1. - abs(sin(distance(uvOff, vec2(0.5)) - 0.5 - uTime)) ;
  float vignetteF = vignette(uvVignette.xy, vignin, vignout, vignfade, .4);

  FragColor = vec4(vec3(strength), 1.);
  FragColor.rgb *= 1. - vignetteF;

  #include <tonemapping_fragment>
}
`;

const WAVVES_VERTEX = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

class WavvesCompositeMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      glslVersion: THREE.GLSL3,
      toneMapped: false,
      uniforms: {
        tScene: { value: null },
        uRatio: { value: 1 },
        uTime: { value: 0 },
      },
      vertexShader: WAVVES_VERTEX,
      fragmentShader: WAVVES_FRAGMENT,
      blending: THREE.NormalBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
  }
}

class WavvesRenderManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.Camera;
  readonly screenCamera: THREE.OrthographicCamera;
  readonly screenGeometry: THREE.BufferGeometry;
  readonly screen: THREE.Mesh;
  readonly renderTargetA: THREE.WebGLRenderTarget;
  readonly renderTargetComposite: THREE.WebGLRenderTarget;
  readonly compositeMaterial: WavvesCompositeMaterial;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

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
    this.compositeMaterial = new WavvesCompositeMaterial();
    this.screen = new THREE.Mesh(this.screenGeometry, this.compositeMaterial);
    this.screen.frustumCulled = false;

    this.renderTargetA = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.renderTargetComposite = this.renderTargetA.clone();
  }

  resize(width: number, height: number, dpr: number) {
    const w = Math.round(width * dpr);
    const h = Math.round(height * dpr);
    this.renderTargetA.setSize(w, h);
    this.renderTargetComposite.setSize(w, h);
    this.compositeMaterial.uniforms.uRatio.value = width / height;
  }

  update(time: number, camera: THREE.Camera = this.camera, scene: THREE.Scene = this.scene) {
    const renderer = this.renderer;
    renderer.setRenderTarget(this.renderTargetA);
    renderer.render(scene, camera);

    this.compositeMaterial.uniforms.tScene.value = this.renderTargetA.texture;
    this.compositeMaterial.uniforms.uTime.value = time;

    renderer.setRenderTarget(this.renderTargetComposite);
    renderer.render(this.screen, this.screenCamera);
    renderer.setRenderTarget(null);
  }
}

export class WavvesScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly renderManager: WavvesRenderManager;

  constructor(renderer: THREE.WebGLRenderer) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderManager = new WavvesRenderManager(renderer, this.scene, this.camera);
  }

  update(time: number) {
    this.renderManager.update(time, this.camera, this.scene);
  }

  resize(width: number, height: number, dpr: number) {
    this.renderManager.resize(width, height, dpr);
  }

  get texture() {
    return this.renderManager.renderTargetComposite.texture;
  }
}
