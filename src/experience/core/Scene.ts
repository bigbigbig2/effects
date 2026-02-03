import * as THREE from "three";

export class Scene {
  readonly instance: THREE.Scene;

  constructor() {
    this.instance = new THREE.Scene();
  }
}
