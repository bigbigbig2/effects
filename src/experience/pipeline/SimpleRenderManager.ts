import * as THREE from "three";

const SIMPLE_VERTEX = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const SIMPLE_FRAGMENT = `
precision highp float;

uniform sampler2D tScene;
in vec2 vUv;
out vec4 FragColor;

void main() {
  vec4 mixed = texture(tScene, vUv);
  FragColor = vec4(mixed.rgb, 1.);
}
`;

class SimpleCompositeMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      glslVersion: THREE.GLSL3,
      toneMapped: false,
      uniforms: {
        tScene: { value: null },
      },
      vertexShader: SIMPLE_VERTEX,
      fragmentShader: SIMPLE_FRAGMENT,
      blending: THREE.NormalBlending,
      depthWrite: false,
      depthTest: false,
    });
  }
}

type SimpleSettings = {
  renderToScreen: boolean;
};

export class SimpleRenderManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.Camera;
  readonly screenCamera: THREE.OrthographicCamera;
  readonly screenGeometry: THREE.BufferGeometry;
  readonly screen: THREE.Mesh;
  readonly renderTargetA: THREE.WebGLRenderTarget;
  readonly renderTargetComposite: THREE.WebGLRenderTarget;
  readonly compositeMaterial: THREE.ShaderMaterial;
  readonly settings: SimpleSettings;

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
    this.compositeMaterial = new SimpleCompositeMaterial();
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
    const w = Math.round(width * dpr);
    const h = Math.round(height * dpr);
    this.renderTargetA.setSize(w, h);
    this.renderTargetComposite.setSize(w, h);
  }

  update(
    camera: THREE.Camera = this.camera,
    scene: THREE.Scene = this.scene
  ) {
    const renderer = this.renderer;
    renderer.setRenderTarget(this.renderTargetA);
    renderer.render(scene, camera);

    this.compositeMaterial.uniforms.tScene.value = this.renderTargetA.texture;
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
