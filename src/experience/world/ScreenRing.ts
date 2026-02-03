import * as THREE from "three";
import type { Input } from "../core/Input";
import type { Camera } from "../core/Camera";
import type { ScrollDriver } from "../motion/ScrollDriver";
import type { TweenDriver } from "../motion/TweenDriver";
import type { Assets } from "../core/Assets";
import { CubeGridScreen } from "./CubeGridScreen";
import { ProjectionMaterial } from "./ProjectionMaterial";
import { projects } from "../data/projects";

type UpdateParams = {
  delta: number;
  elapsed: number;
  scroll: ScrollDriver;
  tween: TweenDriver;
  input: Input;
  camera: Camera;
};

type ScreenItem = {
  group: THREE.Group;
  material: ProjectionMaterial;
  mesh: THREE.InstancedMesh;
};

export class ScreenRing {
  private group = new THREE.Group();
  private screens: ScreenItem[] = [];
  private currentTheta = 0;
  private targetTheta = 0;
  private radius = 5.5;
  private parallaxScale = 0.03;
  private velocityScale = 0.00035;
  private tempPosition = new THREE.Vector3();
  private tempDirection = new THREE.Vector3();
  private tempForward = new THREE.Vector3();

  constructor(private scene: THREE.Scene, private assets: Assets) {
    this.scene.add(this.group);
    this.createScreens();
  }

  private createScreens() {
    projects.forEach((project) => {
      const material = new ProjectionMaterial();
      material.depthWrite = false;

      const grid = new CubeGridScreen({
        width: 30,
        height: 18,
        depth: 1,
        cubeSize: 0.08,
        material,
      });

      const screenGroup = new THREE.Group();
      screenGroup.add(grid.mesh);
      this.group.add(screenGroup);

      this.screens.push({
        group: screenGroup,
        material,
        mesh: grid.mesh,
      });

      this.assets
        .loadTexture(project.texture, project.fallbackTexture)
        .then((texture) => {
          material.uniforms.uTexture.value = texture;
        })
        .catch(() => {
          material.uniforms.uTexture.value = null;
        });
    });

    this.layoutScreens();
  }

  private layoutScreens() {
    const count = this.screens.length;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * this.radius;
      const z = Math.sin(angle) * this.radius;
      const screen = this.screens[i];
      screen.group.position.set(x, 0, z);
      screen.group.lookAt(0, 0, 0);
    }
  }

  update({ delta, scroll, tween, input, camera }: UpdateParams) {
    const progress = tween.progress;
    const velocity = tween.velocity;

    this.targetTheta = -progress * Math.PI * 2;
    this.currentTheta += (this.targetTheta - this.currentTheta) * Math.min(1, delta * 4);
    this.group.rotation.y = this.currentTheta;

    const parallaxX = input.pointer.normX * this.parallaxScale + velocity * this.velocityScale;
    const parallaxY = -input.pointer.normY * this.parallaxScale;

    this.tempForward.set(0, 0, -1).applyQuaternion(camera.instance.quaternion);

    this.screens.forEach((screen) => {
      screen.material.uniforms.uParallax.value.set(parallaxX, parallaxY);

      screen.group.getWorldPosition(this.tempPosition);
      this.tempDirection.copy(this.tempPosition).sub(camera.instance.position).normalize();
      const dot = this.tempForward.dot(this.tempDirection);
      screen.group.visible = dot > 0.2;
    });
  }

  destroy() {
    this.screens.forEach((screen) => {
      screen.mesh.geometry.dispose();
      if (Array.isArray(screen.mesh.material)) {
        screen.mesh.material.forEach((mat) => mat.dispose());
      } else {
        screen.mesh.material.dispose();
      }
    });
    this.scene.remove(this.group);
  }
}
