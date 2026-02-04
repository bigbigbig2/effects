import * as THREE from "three";
import type { Input } from "../core/Input";
import type { TweenDriver } from "../motion/TweenDriver";
import { mapRange } from "../utils/math";
import type { ProjectItem } from "../data/projects";
import { WorkScreen } from "../world/WorkScreen";
import { WorkRenderManager } from "../pipeline/WorkRenderManager";
import { WorkEnvironment } from "../world/WorkEnvironment";
import { WorkFloor } from "../world/WorkFloor";

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
  private rotationOffset = 0;
  private visibleIndex = 0;
  private rotationAdjustment = 0;
  private rotationOffsetComputed = false;

  private ambientLight: THREE.AmbientLight;
  private spotLight: THREE.SpotLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private directionalLight2: THREE.DirectionalLight | null = null;

  private floor: WorkFloor | null = null;
  private env: WorkEnvironment | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    projects: ProjectItem[],
    textures: { perlin: THREE.Texture | null; noise: THREE.Texture | null; env: THREE.CubeTexture | null }
  ) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#1a1a1a").convertLinearToSRGB();
    this.scene.fog = new THREE.Fog("grey", 0, 100);

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

    this.sceneWrap.add(this.blocksWrap);

    this.floor = new WorkFloor({
      renderer,
      scene: this.scene,
      camera: this.camera,
      fog: this.scene.fog as THREE.Fog,
    });
    this.floor.position.y = -1.65;

    this.env = new WorkEnvironment();
    this.env.position.y = -12.65;
    this.env.rotation.y = -THREE.MathUtils.degToRad(this.rotationAdjustment);

    this.sceneWrap.add(this.floor);
    this.sceneWrap.add(this.env);
    this.scene.add(this.sceneWrap);
    this.applyRotationOffset();
  }

  private setLights() {
    this.ambientLight = new THREE.AmbientLight("#464646", 1);
    this.scene.add(this.ambientLight);

    this.spotLight = new THREE.SpotLight(0xffffff, 220);
    this.spotLight.position.set(0, 0, 3.7);
    this.spotLight.angle = Math.PI / 4;
    this.spotLight.penumbra = 0.95;
    this.scene.add(this.spotLight);
    this.scene.add(this.spotLight.target);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.directionalLight.position.set(10.5, 10, 1);
    this.scene.add(this.directionalLight);

    this.directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight2.position.set(-10.5, 5, -1);
    this.scene.add(this.directionalLight2);
  }

  private setBlocks(
    projects: ProjectItem[],
    renderer: THREE.WebGLRenderer,
    textures: { perlin: THREE.Texture | null; noise: THREE.Texture | null }
  ) {
    this.blocks = [];
    projects.forEach((project, index) => {
      const instance = new WorkScreen({
        renderer,
        camera: this.camera,
        perlinTexture: textures.perlin,
        noiseTexture: textures.noise,
      });
      instance.material.emissiveIntensity = 0.5;
      instance.material.customUniforms.uReveal.value = 1;
      instance.material.customUniforms.uRevealProject.value = 1;
      instance.material.customUniforms.uRevealSides.value = 1;
      instance.material.customUniforms.uRevealSpread.value = 0;
      instance.material.customUniforms.uRevealSpreadSides.value = 0;
      this.blocks.push({
        id: project.slug,
        rotation: -this.theta * index,
        instance,
      });
    });

    const { itemWidth, count } = this;
    this.radius = count > 0 ? Math.round(itemWidth / 2 / Math.tan(Math.PI / count)) : 0;
    this.rotationAdjustment = 0;

    this.blocks.forEach((block, index) => {
      block.instance.position.x = -Math.sin((this.theta * index * Math.PI) / 180) * this.radius;
      block.instance.position.z = Math.cos((this.theta * index * Math.PI) / 180) * this.radius;
      if (block.id === "demorgen") {
        this.rotationAdjustment = block.rotation;
      }
      block.instance.lookAt(this.blocksWrap.position);
      this.blocksWrap.add(block.instance);
    });

    this.sceneWrap.position.set(0, 0, this.radius - 0.3);
    if (this.env) {
      this.env.rotation.y = -THREE.MathUtils.degToRad(this.rotationAdjustment);
    }
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.applyRotationOffset();
  }

  private applyRotationOffset() {
    if (this.rotationOffsetComputed) return;
    const center = new THREE.Vector3();
    this.sceneWrap.updateMatrixWorld(true);
    this.sceneWrap.getWorldPosition(center);
    const dir = new THREE.Vector3().subVectors(this.camera.position, center);
    this.rotationOffset = Math.atan2(dir.x, dir.z);
    this.currentTheta = this.rotationOffset;
    this.targetTheta = this.rotationOffset;
    this.sceneWrap.rotation.y = this.rotationOffset;
    this.rotationOffsetComputed = true;
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

  setSkyTexture(texture: THREE.Texture | null) {
    this.env?.setSkyTexture(texture);
  }

  setSpotLightMap(texture: THREE.Texture) {
    if (!this.spotLight) return;
    this.spotLight.map = texture;
    this.spotLight.needsUpdate = true;
  }

  setActiveIndex(index: number) {
    this.activeIndex = index;
  }

  setVisibilityMode(onlyActive: boolean) {
    this.onlyActiveVisible = onlyActive;
  }

  setLightIntensity(ambient: number, spot: number) {
    if (this.ambientLight) {
      this.ambientLight.intensity = ambient;
    }
    if (this.spotLight) {
      this.spotLight.intensity = spot;
    }
  }

  setAmbientLight(color: string, intensity: number) {
    const tone = new THREE.Color(color).convertLinearToSRGB();
    this.ambientLight.color.copy(tone);
    this.ambientLight.intensity = intensity;
    this.env?.setDarkenColor(`#${tone.getHexString()}`);
  }

  setBlocksColor(color: string) {
    const tone = new THREE.Color(color).convertLinearToSRGB();
    this.blocks.forEach((block) => {
      block.instance.material.emissive.copy(tone);
    });
  }

  setEnvironmentTint(color: string) {
    this.env?.setEnvTint(color);
  }

  setDarken(value: number) {
    this.renderManager.compositeMaterial.uniforms.uDarken.value = value;
  }

  setSaturation(value: number) {
    this.renderManager.compositeMaterial.uniforms.uSaturation.value = value;
  }

  setFog(enabled: boolean, color: string, near: number, far: number) {
    if (!enabled) {
      this.scene.fog = null;
      this.floor?.setFog(null);
      return;
    }
    const fogColor = new THREE.Color(color);
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(fogColor);
      this.scene.fog.near = near;
      this.scene.fog.far = far;
    } else {
      this.scene.fog = new THREE.Fog(fogColor, near, far);
    }
    this.floor?.setFog(this.scene.fog as THREE.Fog);
  }

  setGroundSettings(options: {
    enabled: boolean;
    color: string;
    roughness: number;
    metalness: number;
    opacity: number;
    envIntensity: number;
    y: number;
    scale: number;
  }) {
    if (!this.floor) return;
    this.floor.visible = options.enabled;
    this.floor.setColor(options.color);
    this.floor.setReflectivity(options.envIntensity);
    this.floor.setMirror(options.opacity);
    this.floor.setRoughness(options.roughness);
    this.floor.setMetalness(options.metalness);
    this.floor.position.y = options.y;
    this.floor.scale.setScalar(options.scale);
  }

  setGroundNormal(texture: THREE.Texture | null) {
    if (!texture) return;
    this.floor?.setNormalMap(texture);
  }

  setMouseSettings(config: {
    factor: number;
    lightness: number;
    thickness: number;
    persistance: number;
    pressure: number;
  }) {
    this.blocks.forEach((block) => {
      block.instance.material.customUniforms.uMouseFactor.value = config.factor;
      block.instance.material.customUniforms.uMouseLightness.value = config.lightness;
      block.instance.setMouseSimConfig({
        thickness: config.thickness,
        persistance: config.persistance,
        pressure: config.pressure,
      });
    });
  }

  resize(width: number, height: number, dpr: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderManager.resize(width, height, Math.min(dpr, 1.5));
    this.blocks.forEach((block) => block.instance.resize(width, height));
    this.floor?.resize(width, height, Math.min(dpr, 1.5));
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

    this.env?.update(time);

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
