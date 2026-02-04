import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { MouseSim } from "../core/MouseSim";
import { damp } from "../utils/math";
import { WorkInstancedMaterial } from "./WorkInstancedMaterial";

type WorkScreenOptions = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  perlinTexture: THREE.Texture | null;
  noiseTexture: THREE.Texture | null;
};

/**
 * 工作区屏幕 (WorkScreen)
 *
 * 这是 3D 场景中的核心视觉组件，通常表现为一个由许多小方块组成的"云"或"墙"。
 * 它使用 InstancedMesh 渲染大量 RoundedBoxGeometry，并结合自定义 Shader 实现复杂的动画效果。
 *
 * 主要功能：
 * - 生成 3D 粒子网格
 * - 集成鼠标交互 (MouseSim)
 * - 射线检测平面 (RayPlane) 用于精确的鼠标拾取
 */
export class WorkScreen extends THREE.Group {
  readonly settings = {
    xNum: 35, // X轴方块数量
    yNum: 23, // Y轴方块数量
    zNum: 7,  // Z轴方块数量
    size: 1.25, // 方块大小
    spacing: 0.1, // 方块间距
    scale: 0.09, // 整体缩放
  };

  readonly rotationWrap = new THREE.Group();
  readonly mesh: THREE.InstancedMesh;
  readonly material: WorkInstancedMaterial;
  readonly geometry: RoundedBoxGeometry;
  readonly instanceCount: number;
  readonly planeMaterial: THREE.ShaderMaterial;
  readonly plane: THREE.Mesh;
  readonly rayPlane: THREE.Mesh;
  readonly mouseSim: MouseSim;
  private mouseSpeed = 0;

  constructor(options: WorkScreenOptions) {
    super();

    const { renderer, camera, perlinTexture, noiseTexture } = options;

    // 创建圆角立方体几何体
    this.geometry = new RoundedBoxGeometry(
      this.settings.size,
      this.settings.size,
      this.settings.size,
      2,
      0.05
    );
    this.material = new WorkInstancedMaterial({ perlinTexture });
    this.material.customUniforms.uGridSize.value.set(
      this.settings.xNum,
      this.settings.yNum,
      this.settings.zNum
    );

    // 计算实例总数
    this.instanceCount =
      this.settings.xNum * this.settings.yNum * this.settings.zNum;
    
    // 创建 InstancedMesh
    this.mesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.instanceCount
    );
    this.rotationWrap.add(this.mesh);
    this.rotationWrap.scale.set(
      this.settings.scale,
      this.settings.scale,
      this.settings.scale
    );
    this.add(this.rotationWrap);

    // 初始化实例属性（颜色、位置等）
    this.createInstancedAttributes();
    this.positionInstancedMesh();

    // 创建用于鼠标交互的不可见平面
    const planeGeometry = new THREE.PlaneGeometry(1, 1);
    const rayPlaneGeometry = new THREE.PlaneGeometry(1, 1);
    this.planeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uUvOffset: { value: new THREE.Vector2(0, 0) },
        tMouseSim: { value: null },
        uTime: { value: 0 },
        uRatio: { value: 1 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec2 uUvOffset;
        uniform float uTime;
        uniform sampler2D tMouseSim;
        varying vec2 vUv;
        uniform float uRatio;
        void main() {
          vec2 uvOff = vUv;

          uvOff.x -= 0.5;
          uvOff.x *= uRatio;
          uvOff.x += 0.5;

          vec2 p = uvOff.xy * 2. - 1.0;
          float r = length(p) * 0.9;
          vec3 color = vec3(0.24, 0.7, 0.4);

          float a = pow(r, .25);
          float b = sin(r * 0.8 - 1.6);
          float c = sin(r - .010);
          float s = sin(a - uTime * 1. + b);

          color *= abs(1. / (s * 10.8)) - 0.1;

          gl_FragColor = vec4(color, 1.);
        }
      `,
      transparent: true,
    });
    this.planeMaterial.depthTest = false;
    this.planeMaterial.depthWrite = false;

    // 射线检测平面材质
    const rayPlaneMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });

    this.plane = new THREE.Mesh(planeGeometry, this.planeMaterial);
    this.rayPlane = new THREE.Mesh(rayPlaneGeometry, rayPlaneMaterial);
    this.plane.visible = false;
    this.rayPlane.visible = false;

    // 调整平面大小以覆盖网格区域
    const scaleFactor = 1.3;
    this.plane.scale.set(35 * scaleFactor, 23 * scaleFactor, 1);
    this.plane.position.set(0, 0, (23 * scaleFactor) / 2);
    this.rayPlane.scale.set(35 * scaleFactor, 23 * scaleFactor, 1);
    this.rayPlane.position.set(0, 0, (23 * scaleFactor) / 2 + 0.01);
    this.planeMaterial.uniforms.uRatio.value = 35 / 23;

    const rayScale = 1.5;
    this.rayPlane.scale.multiplyScalar(rayScale);
    this.material.customUniforms.uUvOffset.value.x =
      (this.rayPlane.scale.x - this.plane.scale.x) / 2 / this.plane.scale.x;
    this.material.customUniforms.uUvOffset.value.y =
      (this.rayPlane.scale.y - this.plane.scale.y) / 2 / this.plane.scale.y;
    this.material.customUniforms.uUvOffsetScale.value = rayScale;

    this.rotationWrap.add(this.rayPlane);

    // 初始化鼠标模拟器
    this.mouseSim = new MouseSim({
      renderer,
      camera,
      mesh: this.plane,
      rayCastMesh: this.rayPlane,
      persistance: 0.85,
      thickness: 0.1,
      noiseTexture: noiseTexture ?? null,
    });
  }

  private createInstancedAttributes() {
    const indices = new Float32Array(this.instanceCount);
    const colors = new Float32Array(this.instanceCount * 3);
    const alphas = new Float32Array(this.instanceCount);

    for (let i = 0; i < this.instanceCount; i += 1) {
      indices[i] = i;
      colors[i * 3] = Math.random();
      colors[i * 3 + 1] = Math.random();
      colors[i * 3 + 2] = Math.random();
      alphas[i] = Math.random();
    }

    this.geometry.setAttribute(
      "instanceIndex",
      new THREE.InstancedBufferAttribute(indices, 1)
    );
    this.geometry.setAttribute(
      "instanceColor",
      new THREE.InstancedBufferAttribute(colors, 3)
    );
    this.geometry.setAttribute(
      "instanceAlpha",
      new THREE.InstancedBufferAttribute(alphas, 1)
    );
  }

  private positionInstancedMesh() {
    const dummy = new THREE.Object3D();
    let index = 0;
    const { xNum, yNum, zNum, spacing, size } = this.settings;
    const cell = size + spacing;
    const totalX = (xNum - 1) * cell;
    const totalY = (yNum - 1) * cell;
    const totalZ = (zNum - 1) * cell;
    const halfX = totalX / 2;
    const halfY = totalY / 2;
    const halfZ = totalZ / 2;
    const offsets = new Float32Array(this.instanceCount * 3);

    for (let z = 0; z < zNum; z += 1) {
      for (let x = 0; x < xNum; x += 1) {
        for (let y = 0; y < yNum; y += 1) {
          dummy.position.set(x * cell - halfX, y * cell - halfY, z * cell - halfZ);
          dummy.updateMatrix();
          this.mesh.setMatrixAt(index, dummy.matrix);

          offsets[index * 3] = x / xNum;
          offsets[index * 3 + 1] = y / yNum;
          offsets[index * 3 + 2] = z / zNum;
          index += 1;
        }
      }
    }

    this.geometry.setAttribute(
      "instanceOffset",
      new THREE.InstancedBufferAttribute(offsets, 3)
    );
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  resize(width: number, height: number) {
    // Match original: mouse sim resolution follows the plane scale, not viewport size.
    this.mouseSim.onResize(this.plane.scale.x, this.plane.scale.y);
  }

  update(
    time: number,
    delta: number,
    dpr: number,
    pointer: { x: number; y: number },
    size: { width: number; height: number },
    displacementTexture: THREE.Texture | null
  ) {
    this.material.update(time, size.width, size.height, dpr);
    this.mouseSim.update(time, delta, pointer);
    this.material.customUniforms.tMouseSim.value = this.mouseSim.bufferSim.output.texture;
    this.mouseSpeed = damp(
      this.mouseSpeed,
      this.mouseSim.simulationMaterial.uniforms.uSpeed.value,
      10,
      delta
    );
    this.material.customUniforms.uMouseSpeed.value = this.mouseSpeed;
    this.planeMaterial.uniforms.uTime.value = time;
    this.material.customUniforms.tDisplacement.value = displacementTexture;
  }

  setMouseSimConfig(config: { persistance?: number; thickness?: number; pressure?: number }) {
    this.mouseSim.setConfig(config);
  }
}
