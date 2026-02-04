import * as THREE from "three";

type CubeGridOptions = {
  width?: number; // 网格宽度（列数）
  height?: number; // 网格高度（行数）
  depth?: number; // 网格深度（层数）
  cubeSize?: number; // 单个立方体的大小
  material: THREE.Material; // 材质
};

/**
 * 立方体网格屏幕 (CubeGridScreen)
 *
 * 创建一个由许多小立方体组成的网格屏幕。
 * 使用 InstancedMesh 优化性能，所有立方体共享同一个几何体和材质。
 * 每个立方体都有自己的 UV 坐标，使得整个网格可以像屏幕一样显示一张完整的图片。
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
      // 每一行的透明度随机，产生一点噪点效果
      const rowAlpha = 0.35 + Math.random() * 0.65;
      for (let x = 0; x < width; x += 1) {
        for (let z = 0; z < depth; z += 1) {
          // 计算每个立方体的位置，使其居中
          const offsetX = x * cubeSize - totalWidth * 0.5;
          const offsetY = y * cubeSize - totalHeight * 0.5;
          const offsetZ = (z - (depth - 1) * 0.5) * cubeSize;

          dummy.position.set(offsetX, offsetY, offsetZ);
          dummy.updateMatrix();
          this.mesh.setMatrixAt(index, dummy.matrix);

          // 计算 UV 坐标，映射到 0-1 范围
          const u = width === 1 ? 0.5 : x / (width - 1);
          const v = height === 1 ? 0.5 : y / (height - 1);

          uvs[index * 2] = u;
          uvs[index * 2 + 1] = v;

          // 设置单个立方体的透明度
          const cubeRand = Math.random();
          alphas[index] = rowAlpha * (0.5 + 0.5 * cubeRand);

          index += 1;
        }
      }
    }

    // 将 UV 和 Alpha 作为实例属性传递给 Shader
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
