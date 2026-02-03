import * as THREE from "three";

type CubeGridOptions = {
  width?: number;
  height?: number;
  depth?: number;
  cubeSize?: number;
  material: THREE.Material;
};

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

    for (let y = 0; y < height; y += 1) {
      const rowAlpha = 0.35 + Math.random() * 0.65;
      for (let x = 0; x < width; x += 1) {
        for (let z = 0; z < depth; z += 1) {
          const offsetX = x * cubeSize - totalWidth * 0.5;
          const offsetY = y * cubeSize - totalHeight * 0.5;
          const offsetZ = (z - (depth - 1) * 0.5) * cubeSize;

          dummy.position.set(offsetX, offsetY, offsetZ);
          dummy.updateMatrix();
          this.mesh.setMatrixAt(index, dummy.matrix);

          const u = width === 1 ? 0.5 : x / (width - 1);
          const v = height === 1 ? 0.5 : y / (height - 1);

          uvs[index * 2] = u;
          uvs[index * 2 + 1] = v;

          const cubeRand = Math.random();
          alphas[index] = rowAlpha * (0.5 + 0.5 * cubeRand);

          index += 1;
        }
      }
    }

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
