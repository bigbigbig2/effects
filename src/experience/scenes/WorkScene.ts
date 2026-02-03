import * as THREE from "three";
import type { Input } from "../core/Input";
import type { TweenDriver } from "../motion/TweenDriver";
import { mapRange } from "../utils/math";
import type { ProjectItem } from "../data/projects";
import { WorkScreen } from "../world/WorkScreen";
import { WorkRenderManager } from "../pipeline/WorkRenderManager";

type WorkSceneUpdate = {
  time: number;
  delta: number;
  dpr: number;
  input: Input;
  tween: TweenDriver;
  displacementTexture: THREE.Texture | null;
  size: { width: number; height: number };
};

export class WorkScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderManager: WorkRenderManager;
  readonly blocksWrap: THREE.Group;
  readonly sceneWrap: THREE.Group;

  private blocks: { id: string; rotation: number; instance: WorkScreen }[] = [];
  private radius = 0;
  private count = 0;
  private theta = 0;
  private itemWidth = 6.5;
  private currentTheta = 0;
  private targetTheta = 0;
  private activeIndex = 0;
  private onlyActiveVisible = true;
  private rotationOffset = Math.PI;
  private visibleIndex = 0;

  private ambientLight: THREE.AmbientLight;
  private spotLight: THREE.SpotLight | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    projects: ProjectItem[],
    textures: { perlin: THREE.Texture | null; noise: THREE.Texture | null; env: THREE.CubeTexture | null }
  ) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#1a1a1a").convertLinearToSRGB();

    this.camera = new THREE.PerspectiveCamera(55, 1, 1, 2000);
    this.camera.position.set(0, 0, 5.5);

    this.renderManager = new WorkRenderManager(renderer, this.scene, this.camera, textures.noise);

    if (textures.env) {
      this.scene.environment = textures.env;
    }

    this.blocksWrap = new THREE.Group();
    this.sceneWrap = new THREE.Group();

    this.count = projects.length;
    this.theta = this.count > 0 ? 360 / this.count : 0;

    this.setLights();
    this.setBlocks(projects, renderer, textures);
    this.currentTheta = this.rotationOffset;
    this.targetTheta = this.rotationOffset;
    this.sceneWrap.rotation.y = this.rotationOffset;

    this.sceneWrap.add(this.blocksWrap);
    this.scene.add(this.sceneWrap);
  }

  private setLights() {
    this.ambientLight = new THREE.AmbientLight("#e4e4e4", 4.6);
    this.scene.add(this.ambientLight);

    this.spotLight = new THREE.SpotLight(0xffffff, 520);
    this.spotLight.position.set(0, 0, 3.7);
    this.spotLight.angle = Math.PI / 4;
    this.spotLight.penumbra = 0.95;
    this.scene.add(this.spotLight);
    this.scene.add(this.spotLight.target);

    const directional = new THREE.DirectionalLight(0xffffff, 1.5);
    directional.position.set(10.5, 10, 1);
    this.scene.add(directional);

    const directional2 = new THREE.DirectionalLight(0xffffff, 1);
    directional2.position.set(-10.5, 5, -1);
    this.scene.add(directional2);
  }

  private setBlocks(
    projects: ProjectItem[],
    renderer: THREE.WebGLRenderer,
    textures: { perlin: THREE.Texture | null; noise: THREE.Texture | null }
  ) {
    this.blocks = [];
    projects.forEach((project, index) => {
      this.blocks.push({
        id: project.slug,
        rotation: -this.theta * index,
        instance: new WorkScreen({
          renderer,
          camera: this.camera,
          perlinTexture: textures.perlin,
          noiseTexture: textures.noise,
        }),
      });
    });

    const { itemWidth, count } = this;
    this.radius = count > 0 ? Math.round(itemWidth / 2 / Math.tan(Math.PI / count)) : 0;

    this.blocks.forEach((block, index) => {
      block.instance.position.x = -Math.sin((this.theta * index * Math.PI) / 180) * this.radius;
      block.instance.position.z = Math.cos((this.theta * index * Math.PI) / 180) * this.radius;
      block.instance.lookAt(this.blocksWrap.position);
      this.blocksWrap.add(block.instance);
    });

    this.sceneWrap.position.set(0, 0, this.radius - 0.3);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  setPerlinTexture(texture: THREE.Texture) {
    this.blocks.forEach((block) => {
      block.instance.material.customUniforms.tPerlin.value = texture;
    });
  }

  setNoiseTexture(texture: THREE.Texture) {
    this.blocks.forEach((block) => {
      block.instance.mouseSim.simulationMaterial.uniforms.uNoiseTexture.value = texture;
    });
    if (this.renderManager.mouseSimulation) {
      this.renderManager.mouseSimulation.simulationMaterial.uniforms.uNoiseTexture.value = texture;
    }
  }

  setEnvironment(texture: THREE.CubeTexture) {
    this.scene.environment = texture;
  }

  setSpotLightMap(texture: THREE.Texture) {
    if (!this.spotLight) return;
    this.spotLight.map = texture;
    this.spotLight.needsUpdate = true;
  }

  setActiveIndex(index: number) {
    this.activeIndex = index;
  }

  resize(width: number, height: number, dpr: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderManager.resize(width, height, Math.min(dpr, 1.5));
    this.blocks.forEach((block) => block.instance.resize(width, height));
  }

  update({ time, delta, dpr, input, tween, displacementTexture, size }: WorkSceneUpdate) {
    const progress = tween.progress;
    this.targetTheta = this.rotationOffset + progress * Math.PI * 2;
    this.currentTheta += (this.targetTheta - this.currentTheta) * Math.min(1, delta * 4);
    this.sceneWrap.rotation.y = this.currentTheta;

    if (this.count > 0) {
      const normalized = (this.currentTheta - this.rotationOffset) / (Math.PI * 2);
      let index = Math.round(normalized * this.count) % this.count;
      if (index < 0) index += this.count;
      this.visibleIndex = index;
    }

    if (this.spotLight) {
      this.spotLight.position.x = this.camera.position.x * 0.175;
      this.spotLight.position.y = 0.3 + this.camera.position.y * 0.175;
    }

    const pointer = { x: input.pointer.x, y: input.pointer.y };
    const worldPos = new THREE.Vector3();

    for (let i = 0; i < this.blocks.length; i += 1) {
      const block = this.blocks[i];
      block.instance.getWorldPosition(worldPos);

      const visible =
        this.onlyActiveVisible
          ? i === this.visibleIndex
          : !(worldPos.x > 5.5 || worldPos.x < -5.5 || worldPos.z > 5);

      block.instance.visible = visible;

      if (!visible) continue;

      block.instance.update(
        time,
        delta,
        Math.min(dpr, 1.5),
        pointer,
        size,
        displacementTexture
      );

      block.instance.material.customUniforms.uRevealSides.value = mapRange(
        Math.abs(worldPos.x),
        0,
        5,
        1,
        0,
        true
      );
      block.instance.material.customUniforms.uRevealSpreadSides.value = mapRange(
        Math.abs(worldPos.x),
        2,
        6,
        1,
        0,
        true
      );
      if (this.renderManager.mouseSimulation) {
        block.instance.material.customUniforms.tMouseSim2.value =
          this.renderManager.mouseSimulation.bufferSim.output.texture;
      }
    }

    this.renderManager.update({
      time,
      delta,
      pointer,
      camera: this.camera,
      scene: this.scene,
    });
  }

  get texture() {
    return this.renderManager.renderTargetComposite.texture;
  }
}
