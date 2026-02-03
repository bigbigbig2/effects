import * as THREE from "three";

export class BufferSim {
  readonly renderer: THREE.WebGLRenderer;
  readonly shader: THREE.ShaderMaterial;
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly quad: THREE.Mesh;
  readonly fbos: THREE.WebGLRenderTarget[];
  input: THREE.WebGLRenderTarget;
  output: THREE.WebGLRenderTarget;
  private current = 0;

  constructor(
    renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    shader: THREE.ShaderMaterial
  ) {
    this.renderer = renderer;
    this.shader = shader;

    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      stencilBuffer: false,
      depthBuffer: false,
    });
    renderTarget.texture.generateMipmaps = false;

    this.fbos = [renderTarget, renderTarget.clone()];
    this.input = this.fbos[0];
    this.output = this.fbos[0];

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      0.00001,
      1000
    );

    const geometry = new THREE.PlaneGeometry(width, height);
    this.quad = new THREE.Mesh(geometry, this.shader);
    this.scene.add(this.quad);
  }

  onResize(width: number, height: number) {
    this.fbos[0].setSize(width, height);
    this.fbos[1].setSize(width, height);
    this.camera.left = width / -2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = height / -2;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.shader.uniforms.uTexture.value = this.fbos[this.current].texture;
    this.input = this.fbos[this.current];
    this.current = 1 - this.current;
    this.output = this.fbos[this.current];

    this.renderer.setRenderTarget(this.output);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }
}
