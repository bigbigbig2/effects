import * as THREE from "three";
import { FLOOR_FRAGMENT, FLOOR_VERTEX } from "./shaders";
import { Reflector } from "./Reflector";

class FloorMaterial extends THREE.ShaderMaterial {
  constructor({
    color = new THREE.Color(0x101010),
    map = null,
    normalMap = null,
    normalScale = new THREE.Vector2(1, 1),
    reflectivity = 0.97,
    mirror = 1,
    floorMixStrength = 15,
    fog = null,
    dithering = false,
  }: {
    color?: THREE.Color | string | number;
    map?: THREE.Texture | null;
    normalMap?: THREE.Texture | null;
    normalScale?: THREE.Vector2;
    reflectivity?: number;
    mirror?: number;
    floorMixStrength?: number;
    fog?: THREE.Fog | null;
    dithering?: boolean;
  } = {}) {
    const uniforms: Record<string, THREE.IUniform> = {
      tReflect: new THREE.Uniform(null),
      uMapTransform: new THREE.Uniform(new THREE.Matrix3()),
      uMatrix: new THREE.Uniform(new THREE.Matrix4()),
      uColor: new THREE.Uniform(color instanceof THREE.Color ? color : new THREE.Color(color)),
      uReflectivity: new THREE.Uniform(reflectivity),
      uMirror: new THREE.Uniform(mirror),
      uFloorMixStrength: new THREE.Uniform(floorMixStrength),
      uNormalDistortionStrength: new THREE.Uniform(2.5),
      uRoughness: new THREE.Uniform(0.55),
      uMetalness: new THREE.Uniform(0.2),
    };

    const defines: Record<string, string> = {};

    if (map) {
      map.updateMatrix();
      defines.USE_MAP = "";
      uniforms.tMap = new THREE.Uniform(map);
      uniforms.uMapTransform = new THREE.Uniform(map.matrix);
    }

    if (normalMap) {
      normalMap.updateMatrix();
      defines.USE_NORMALMAP = "";
      uniforms.tNormalMap = new THREE.Uniform(normalMap);
      uniforms.uNormalScale = new THREE.Uniform(normalScale);
      if (!map) {
        uniforms.uMapTransform = new THREE.Uniform(normalMap.matrix);
      }
    }

    if (fog) {
      defines.USE_FOG = "";
      uniforms.uFogColor = new THREE.Uniform(fog.color);
      uniforms.uFogNear = new THREE.Uniform(fog.near);
      uniforms.uFogFar = new THREE.Uniform(fog.far);
    }

    if (dithering) {
      defines.DITHERING = "";
    }

    super({
      glslVersion: THREE.GLSL3,
      defines,
      uniforms,
      vertexShader: FLOOR_VERTEX,
      fragmentShader: FLOOR_FRAGMENT,
      blending: THREE.NormalBlending,
      transparent: false,
      depthWrite: true,
      depthTest: true,
    });
  }

  setFog(fog: THREE.Fog | null) {
    if (!fog) {
      if (this.defines && this.defines.USE_FOG !== undefined) {
        delete this.defines.USE_FOG;
      }
      delete (this.uniforms as Record<string, THREE.IUniform>).uFogColor;
      delete (this.uniforms as Record<string, THREE.IUniform>).uFogNear;
      delete (this.uniforms as Record<string, THREE.IUniform>).uFogFar;
      this.needsUpdate = true;
      return;
    }

    if (!this.defines || this.defines.USE_FOG === undefined) {
      this.defines = { ...(this.defines ?? {}), USE_FOG: "" };
      this.needsUpdate = true;
    }

    (this.uniforms as Record<string, THREE.IUniform>).uFogColor = new THREE.Uniform(fog.color);
    (this.uniforms as Record<string, THREE.IUniform>).uFogNear = new THREE.Uniform(fog.near);
    (this.uniforms as Record<string, THREE.IUniform>).uFogFar = new THREE.Uniform(fog.far);
  }
}

export class WorkFloor extends THREE.Group {
  readonly material: FloorMaterial;
  readonly reflector: Reflector;
  readonly mesh: THREE.Mesh;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  constructor({
    renderer,
    scene,
    camera,
    normalMap = null,
    fog = null,
  }: {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    normalMap?: THREE.Texture | null;
    fog?: THREE.Fog | null;
  }) {
    super();
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.reflector = new Reflector();

    const geometry = new THREE.CircleGeometry(60, 32);
    this.material = new FloorMaterial({
      color: "#4a4a4a",
      normalMap,
      mirror: 1,
      reflectivity: 0.97,
      floorMixStrength: 15,
      fog,
    });

    this.material.uniforms.tReflect = this.reflector.renderTargetUniform;
    this.material.uniforms.uMatrix = this.reflector.textureMatrixUniform;

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.add(this.reflector);
    this.mesh.onBeforeRender = () => {
      this.visible = false;
      this.reflector.update(this.renderer, this.scene, this.camera);
      this.visible = true;
    };
    this.add(this.mesh);
  }

  setNormalMap(texture: THREE.Texture | null) {
    if (!texture) return;
    texture.updateMatrix();
    this.material.defines = { ...(this.material.defines ?? {}), USE_NORMALMAP: "" };
    this.material.uniforms.tNormalMap = new THREE.Uniform(texture);
    this.material.uniforms.uNormalScale = new THREE.Uniform(new THREE.Vector2(1, 1));
    this.material.uniforms.uMapTransform = new THREE.Uniform(texture.matrix);
    this.material.needsUpdate = true;
  }

  setColor(color: string) {
    this.material.uniforms.uColor.value = new THREE.Color(color);
  }

  setReflectivity(value: number) {
    this.material.uniforms.uReflectivity.value = value;
  }

  setMirror(value: number) {
    this.material.uniforms.uMirror.value = value;
  }

  setRoughness(value: number) {
    this.material.uniforms.uRoughness.value = value;
  }

  setMetalness(value: number) {
    this.material.uniforms.uMetalness.value = value;
  }

  setFloorMixStrength(value: number) {
    this.material.uniforms.uFloorMixStrength.value = value;
  }

  setFog(fog: THREE.Fog | null) {
    this.material.setFog(fog);
  }

  resize(width: number, height: number, dpr: number) {
    this.reflector.setSize(width, height, dpr);
  }
}
