import * as THREE from "three";

// Scene 类：
// 简单的 Three.js Scene 包装器。
// 目前功能较少，主要用于统一管理场景实例。
export class Scene {
  readonly instance: THREE.Scene;

  constructor() {
    this.instance = new THREE.Scene();
  }
}
