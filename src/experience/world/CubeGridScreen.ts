import * as THREE from "three";

// 网格屏幕参数
// - width/height/depth: 网格在 X/Y/Z 维度的数量
// - cubeSize: 单个立方体尺寸
// - material: 统一材质（通常是投影材质）
type CubeGridOptions = {
  width?: number;
  height?: number;
  depth?: number;
  cubeSize?: number;
  material: THREE.Material;
};

/**
 * CubeGridScreen
 *
 * 用 InstancedMesh 生成“立方体屏幕”网格：
 * - 每个立方体共享同一套几何体与材质
 * - 使用实例属性保存 UV 与 Alpha
 * - 可将一张图像映射成“方块屏幕”的整体视觉
 */
export class CubeGridScreen {
  readonly mesh: THREE.InstancedMesh;

  constructor({ width = 30, height = 18, depth = 1, cubeSize = 0.08, material }: CubeGridOptions) {
    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const count = width * height * depth;

    this.mesh = new THREE.InstancedMesh(geometry, material, count);

    const dummy = new THREE.Object3D();
    const uvs = new Float32Array(count * 2);
    const alphas = new Float32Array(count);

    let index = 0;
    const totalWidth = (width - 1) * cubeSize;
    const totalHeight = (height - 1) * cubeSize;

    // 生成网格布局
    for (let y = 0; y < height; y += 1) {
      // 每行的透明度略带随机，增加颗粒感
      const rowAlpha = 0.35 + Math.random() * 0.65;
      for (let x = 0; x < width; x += 1) {
        for (let z = 0; z < depth; z += 1) {
          // 计算每个立方体的位置并居中
          const offsetX = x * cubeSize - totalWidth * 0.5;
          const offsetY = y * cubeSize - totalHeight * 0.5;
          const offsetZ = (z - (depth - 1) * 0.5) * cubeSize;

          dummy.position.set(offsetX, offsetY, offsetZ);
          dummy.updateMatrix();
          this.mesh.setMatrixAt(index, dummy.matrix);

          // 实例 UV（映射到 0-1）
          const u = width === 1 ? 0.5 : x / (width - 1);
          const v = height === 1 ? 0.5 : y / (height - 1);

          uvs[index * 2] = u;
          uvs[index * 2 + 1] = v;

          // 每个立方体的透明度
          const cubeRand = Math.random();
          alphas[index] = rowAlpha * (0.5 + 0.5 * cubeRand);

          index += 1;
        }
      }
    }

    // 将 UV / Alpha 作为实例属性传入 Shader
    geometry.setAttribute("aUv", new THREE.InstancedBufferAttribute(uvs, 2));
    geometry.setAttribute("aAlpha", new THREE.InstancedBufferAttribute(alphas, 1));

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((mat) => mat.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}
