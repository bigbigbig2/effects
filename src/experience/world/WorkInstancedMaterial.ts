import * as THREE from "three";
import { WORK_FRAGMENT, WORK_VERTEX } from "./shaders";

/**
 * WorkInstancedMaterial
 *
 * WorkScreen 使用的自定义 Instanced 材质：
 * - 基于 MeshPhysicalMaterial
 * - 通过 onBeforeCompile 注入自定义 Shader
 * - 维护一组自定义 uniforms（鼠标模拟 / 位移 / reveal 等）
 */

type WorkMaterialOptions = {
  perlinTexture?: THREE.Texture | null;
};

export class WorkInstancedMaterial extends THREE.MeshPhysicalMaterial {
  readonly customUniforms: Record<string, THREE.IUniform>;

  constructor({ perlinTexture }: WorkMaterialOptions = {}) {
    super({ color: new THREE.Color("#808080") });

    // 占位纹理，避免未绑定时采样异常
    const dummyTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    dummyTexture.needsUpdate = true;

    this.dithering = true;
    this.transparent = true;
    this.envMapIntensity = 0.75;
    this.roughness = 1;
    this.depthTest = false;
    this.depthWrite = false;
    this.fog = false;

    // 自定义 uniforms（将通过 onBeforeCompile 注入）
    this.customUniforms = {
      uTime: { value: 0 },
      uCoords: { value: new THREE.Vector2() },
      uGridSize: { value: new THREE.Vector3() },
      uGridOffset: { value: new THREE.Vector3() },
      tMouseSim: { value: dummyTexture },
      tMouseSim2: { value: dummyTexture },
      uMouseSpeed: { value: 0 },
      uMouseFactor: { value: 0 },
      uMouseLightness: { value: 1 },
      uUvOffset: { value: new THREE.Vector2() },
      uUvOffsetScale: { value: 1 },
      uReveal: { value: 0 },
      uRevealProject: { value: 1 },
      uRevealSides: { value: 0 },
      uRevealSpreadSides: { value: 0 },
      uRevealSpread: { value: 0 },
      tPerlin: { value: perlinTexture ?? dummyTexture },
      tDisplacement: { value: dummyTexture },
    };

    // 把自定义 uniforms 注入到 Shader
    this.onBeforeCompile = (shader) => {
      shader.uniforms.uGridSize = this.customUniforms.uGridSize;
      shader.uniforms.uGridOffset = this.customUniforms.uGridOffset;
      shader.uniforms.uTime = this.customUniforms.uTime;
      shader.uniforms.uCoords = this.customUniforms.uCoords;
      shader.uniforms.tMouseSim = this.customUniforms.tMouseSim;
      shader.uniforms.tMouseSim2 = this.customUniforms.tMouseSim2;
      shader.uniforms.uMouseSpeed = this.customUniforms.uMouseSpeed;
      shader.uniforms.uUvOffset = this.customUniforms.uUvOffset;
      shader.uniforms.uUvOffsetScale = this.customUniforms.uUvOffsetScale;
      shader.uniforms.uReveal = this.customUniforms.uReveal;
      shader.uniforms.uRevealSides = this.customUniforms.uRevealSides;
      shader.uniforms.uRevealProject = this.customUniforms.uRevealProject;
      shader.uniforms.uRevealSpread = this.customUniforms.uRevealSpread;
      shader.uniforms.uRevealSpreadSides = this.customUniforms.uRevealSpreadSides;
      shader.uniforms.tPerlin = this.customUniforms.tPerlin;
      shader.uniforms.tDisplacement = this.customUniforms.tDisplacement;
      shader.uniforms.uMouseFactor = this.customUniforms.uMouseFactor;
      shader.uniforms.uMouseLightness = this.customUniforms.uMouseLightness;

      shader.vertexShader = WORK_VERTEX;
      shader.fragmentShader = WORK_FRAGMENT;
    };
  }

  // 每帧更新：同步时间与屏幕尺寸
  update(time: number, width: number, height: number, dpr: number) {
    this.customUniforms.uTime.value = time;
    this.customUniforms.uCoords.value.set(width * dpr, height * dpr);
  }
}
