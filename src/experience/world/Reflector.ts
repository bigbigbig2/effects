import * as THREE from "three";

/**
 * Reflector
 *
 * 地面反射渲染器：
 * - 通过“镜像相机”渲染场景到离屏纹理
 * - 支持简单模糊迭代，软化反射
 */

// 全屏模糊（用于反射软化）
const BLUR_VERTEX = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const BLUR_FRAGMENT = `
precision mediump float;

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

float smootherstep(float edge0, float edge1, float x) {
  x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

uniform sampler2D tMap;
uniform vec2 uDirection;
uniform vec2 uResolution;

in vec2 vUv;
out vec4 FragColor;

void main() {
  vec4 tMapped = texture(tMap, vUv);
  vec2 distance = smootherstep(1.0, 0.0, vUv.y) * uDirection;
  vec4 blurred = blur(tMap, vUv, uResolution, distance);
  FragColor = mix(tMapped, blurred, 1.25);
}
`;

// 反射模糊材质
class BlurMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      glslVersion: THREE.GLSL3,
      uniforms: {
        tMap: { value: null },
        uDirection: { value: new THREE.Vector2(1, 0) },
        uResolution: { value: new THREE.Vector2() },
      },
      vertexShader: BLUR_VERTEX,
      fragmentShader: BLUR_FRAGMENT,
      blending: THREE.NormalBlending,
      depthWrite: false,
      depthTest: false,
    });
  }
}

// 全屏三角形（比全屏四边形更省顶点）
const createScreenTriangle = () => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array([-1, 3, 0, -1, -1, 0, 3, -1, 0]), 3)
  );
  geometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array([0, 2, 0, 0, 2, 0]), 2)
  );
  return geometry;
};

export class Reflector extends THREE.Group {
  readonly clipBias: number;
  readonly blurIterations: number;

  // 反射平面与中间计算缓存
  private reflectorPlane = new THREE.Plane();
  private normal = new THREE.Vector3();
  private reflectorWorldPosition = new THREE.Vector3();
  private cameraWorldPosition = new THREE.Vector3();
  private rotationMatrix = new THREE.Matrix4();
  private lookAtPosition = new THREE.Vector3(0, 0, -1);
  private clipPlane = new THREE.Vector4();
  private view = new THREE.Vector3();
  private target = new THREE.Vector3();
  private q = new THREE.Vector4();

  private textureMatrix = new THREE.Matrix4();
  private virtualCamera = new THREE.PerspectiveCamera();

  readonly textureMatrixUniform = new THREE.Uniform(this.textureMatrix);
  readonly renderTarget: THREE.WebGLRenderTarget;
  private renderTargetRead: THREE.WebGLRenderTarget;
  private renderTargetWrite: THREE.WebGLRenderTarget;
  readonly renderTargetUniform: THREE.Uniform;

  private blurMaterial = new BlurMaterial();
  private screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private screenTriangle = createScreenTriangle();
  private screen = new THREE.Mesh(this.screenTriangle, this.blurMaterial);

  constructor({
    width = 512,
    height = 512,
    clipBias = 0,
    blurIterations = 2,
  }: {
    width?: number;
    height?: number;
    clipBias?: number;
    blurIterations?: number;
  } = {}) {
    super();
    this.clipBias = clipBias;
    this.blurIterations = blurIterations;

    // 离屏渲染目标（反射纹理）
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
    this.renderTargetRead = this.renderTarget.clone();
    this.renderTargetWrite = this.renderTarget.clone();
    this.renderTarget.depthBuffer = true;

    // 输出纹理供地面材质采样
    this.renderTargetUniform = new THREE.Uniform(
      this.blurIterations > 0 ? this.renderTargetRead.texture : this.renderTarget.texture
    );

    this.blurMaterial.uniforms.uResolution.value.set(width, height);
    this.screen.frustumCulled = false;
  }

  // Resize：反射纹理尺寸
  setSize(width: number, height: number, dpr: number) {
    const w = width * 0.75;
    const h = height * 0.75;
    this.renderTarget.setSize(w, h);
    this.renderTargetRead.setSize(w, h);
    this.renderTargetWrite.setSize(w, h);
    this.blurMaterial.uniforms.uResolution.value.set(width * dpr, height * dpr);
  }

  // 每帧更新反射纹理
  update(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.reflectorWorldPosition.setFromMatrixPosition(this.matrixWorld);
    this.cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
    this.rotationMatrix.extractRotation(this.matrixWorld);
    this.normal.set(0, 0, 1).applyMatrix4(this.rotationMatrix);
    this.view.subVectors(this.reflectorWorldPosition, this.cameraWorldPosition);

    // 背面不渲染反射
    if (this.view.dot(this.normal) > 0) return;

    this.view.reflect(this.normal).negate();
    this.view.add(this.reflectorWorldPosition);

    this.rotationMatrix.extractRotation(camera.matrixWorld);
    this.lookAtPosition.set(0, 0, -1).applyMatrix4(this.rotationMatrix);
    this.lookAtPosition.add(this.cameraWorldPosition);
    this.target.subVectors(this.reflectorWorldPosition, this.lookAtPosition);
    this.target.reflect(this.normal).negate();
    this.target.add(this.reflectorWorldPosition);

    this.virtualCamera.position.copy(this.view);
    this.virtualCamera.up.set(0, 1, 0);
    this.virtualCamera.up.applyMatrix4(this.rotationMatrix);
    this.virtualCamera.up.reflect(this.normal);
    this.virtualCamera.lookAt(this.target);
    this.virtualCamera.far = camera.far;
    this.virtualCamera.updateMatrixWorld();
    this.virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

    this.textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.textureMatrix.multiply(this.virtualCamera.projectionMatrix);
    this.textureMatrix.multiply(this.virtualCamera.matrixWorldInverse);
    this.textureMatrix.multiply(this.matrixWorld);

    this.reflectorPlane.setFromNormalAndCoplanarPoint(this.normal, this.reflectorWorldPosition);
    this.reflectorPlane.applyMatrix4(this.virtualCamera.matrixWorldInverse);
    this.clipPlane.set(
      this.reflectorPlane.normal.x,
      this.reflectorPlane.normal.y,
      this.reflectorPlane.normal.z,
      this.reflectorPlane.constant
    );

    const projectionMatrix = this.virtualCamera.projectionMatrix;
    this.q.x = (Math.sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
    this.q.y = (Math.sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
    this.q.z = -1;
    this.q.w = (1 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
    this.clipPlane.multiplyScalar(2 / this.clipPlane.dot(this.q));

    projectionMatrix.elements[2] = this.clipPlane.x;
    projectionMatrix.elements[6] = this.clipPlane.y;
    projectionMatrix.elements[10] = this.clipPlane.z + 1 - this.clipBias;
    projectionMatrix.elements[14] = this.clipPlane.w;

    // 保存当前渲染状态
    const currentRenderTarget = renderer.getRenderTarget();
    const currentXrEnabled = renderer.xr.enabled;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

    // 关闭 XR/阴影自动更新，避免污染主渲染
    renderer.xr.enabled = false;
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(this.renderTarget);
    renderer.state.buffers.depth.setMask(true);
    if (renderer.autoClear === false) renderer.clear();
    renderer.render(scene, this.virtualCamera);

    // 反射模糊迭代
    const blurIterations = this.blurIterations;
    for (let i = 0; i < blurIterations; i += 1) {
      if (i === 0) {
        this.blurMaterial.uniforms.tMap.value = this.renderTarget.texture;
      } else {
        this.blurMaterial.uniforms.tMap.value = this.renderTargetRead.texture;
      }
      const distance = (blurIterations - i - 1) * 15;
      this.blurMaterial.uniforms.uDirection.value.set(i % 2 === 0 ? distance : 0, i % 2 === 0 ? 0 : distance);
      renderer.setRenderTarget(this.renderTargetWrite);
      renderer.render(this.screen, this.screenCamera);
      const swap = this.renderTargetRead;
      this.renderTargetRead = this.renderTargetWrite;
      this.renderTargetWrite = swap;
      this.renderTargetUniform.value = this.renderTargetRead.texture;
    }

    // 恢复渲染状态
    renderer.xr.enabled = currentXrEnabled;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    renderer.setRenderTarget(currentRenderTarget);
  }

  // 释放 GPU 资源
  destroy() {
    this.renderTargetWrite.dispose();
    this.renderTargetRead.dispose();
    this.renderTarget.dispose();
    this.blurMaterial.dispose();
    this.screenTriangle.dispose();
  }
}
