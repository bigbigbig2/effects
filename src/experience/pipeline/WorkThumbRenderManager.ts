import * as THREE from "three";

const SATURATION = `
vec3 saturation(vec3 rgb, float adjustment) {
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}
`;

const BLEND_MULTIPLY = `
vec3 blendMultiply(vec3 base, vec3 blend) {
	return base * blend;
}

vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
	return (blendMultiply(base, blend) * opacity + base * (1.0 - opacity));
}
`;

const COMPOSITE_FRAGMENT = `
precision highp float;

${BLEND_MULTIPLY}
${SATURATION}

#include <tonemapping_pars_fragment>

uniform sampler2D tScene;
uniform float uDarkenIntensity;
uniform vec3 uDarkenColor;
uniform float uSaturation;

in vec2 vUv;
out vec4 FragColor;

void main() {
  vec2 uv = vUv;
  vec4 mixed = texture(tScene, uv);

  mixed.rgb = blendMultiply(mixed.rgb, uDarkenColor, uDarkenIntensity);
  mixed.rgb = saturation(mixed.rgb, uSaturation);
  FragColor = vec4(mixed.rgb, 1.0);

  #include <tonemapping_fragment>
}
`;

const COMPOSITE_VERTEX = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

class ThumbCompositeMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      glslVersion: THREE.GLSL3,
      toneMapped: false,
      uniforms: {
        tScene: { value: null },
        uDarkenIntensity: { value: 0 },
        uDarkenColor: { value: new THREE.Color(0x000000) },
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

export class WorkThumbRenderManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.Camera;
  readonly screenCamera: THREE.OrthographicCamera;
  readonly screenGeometry: THREE.BufferGeometry;
  readonly screen: THREE.Mesh;
  readonly renderTargetA: THREE.WebGLRenderTarget;
  readonly renderTargetComposite: THREE.WebGLRenderTarget;
  readonly compositeMaterial: THREE.ShaderMaterial;

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
    this.compositeMaterial = new ThumbCompositeMaterial();
    this.screen = new THREE.Mesh(this.screenGeometry, this.compositeMaterial);
    this.screen.frustumCulled = false;

    this.renderTargetA = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.renderTargetComposite = this.renderTargetA.clone();
  }

  resize(width: number, height: number, dpr: number) {
    const size = Math.round(Math.min(width, height) * dpr);
    this.renderTargetA.setSize(size, size);
    this.renderTargetComposite.setSize(size, size);
  }

  update(camera: THREE.Camera = this.camera, scene: THREE.Scene = this.scene) {
    const renderer = this.renderer;
    renderer.setRenderTarget(this.renderTargetA);
    renderer.render(scene, camera);

    this.compositeMaterial.uniforms.tScene.value = this.renderTargetA.texture;
    this.screen.material = this.compositeMaterial;

    renderer.setRenderTarget(this.renderTargetComposite);
    renderer.render(this.screen, this.screenCamera);
    renderer.setRenderTarget(null);
  }
}

