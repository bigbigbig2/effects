import * as THREE from "three";
import { BufferSim } from "./BufferSim";

const MOUSE_SIM_FRAGMENT = `
precision highp float;

uniform sampler2D uTexture;
uniform sampler2D uNoiseTexture;
uniform vec2 uPosOld;
uniform vec2 uPosNew;
uniform vec2 uCoords;
uniform float uSpeed;
uniform float uPersistance;
uniform float uThickness;
uniform float uTime;
uniform float uDiffusionSize;
uniform float uDiffusion;
uniform vec3 uColor;
varying vec2 vUv;

float circle(vec2 uv, vec2 center, float size) {
  float circle = length(uv - center);
  return 1. - smoothstep(0.0, size, circle);
}

void main() {
  vec4 noise1 = texture2D(uNoiseTexture, vUv * 4.0 + vec2(uTime * .1, .0));
  vec4 noise2 = texture2D(uNoiseTexture, vUv * 8.0 + vec2(.0, uTime * .1) + noise1.rg * .5);
  vec4 noise3 = texture2D(uNoiseTexture, vUv * 16.0 + vec2(-uTime*.05, 0.) + noise2.rg * .5);
  vec4 noise = (noise1 + noise2 * .5 + noise3 * .25 ) / 1.75;

  float dirX = (-.5 + noise.g) * noise.r * 10.;
  float dirY = (-.5 + noise.b) * noise.r * 10.;

  vec4 oldTexture = texture2D(uTexture, vUv);
  float br = 1. - + (oldTexture.r + oldTexture.g + oldTexture.b)/3.0;
  vec4 col = oldTexture * (1.0 - uDiffusion);
  float p2 = (uDiffusion)/4.0;

  col.rgb *= uPersistance;

  if (uSpeed > 0.0){
    float lineValue = 0.;
    float th = clamp( uThickness + uSpeed * .3, .0001, .2) ;

    vec2 newUv = vUv;
    float ratio = uCoords.x / uCoords.y;
    newUv.y /= ratio;

    vec2 posOld = uPosOld;
    posOld.y /= ratio;

    lineValue = circle(newUv, posOld, th);

    col.rgb = mix(col.rgb, uColor, lineValue * .05);
    col.rgb = clamp( col.rgb, vec3(0.), vec3(1.));
  }

  gl_FragColor = vec4(col);
}
`;

const MOUSE_SIM_VERTEX = `
precision highp float;

uniform float uTime;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
}
`;

type MouseSimOptions = {
  renderer: THREE.WebGLRenderer;
  camera?: THREE.Camera;
  mesh?: THREE.Object3D | null;
  rayCastMesh?: THREE.Object3D | null;
  width?: number;
  height?: number;
  persistance?: number;
  thickness?: number;
  diffusion?: number;
  diffusionSize?: number;
  pressure?: number;
  noiseTexture?: THREE.Texture | null;
};

export class MouseSim {
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster | null = null;
  private camera: THREE.Camera | null = null;
  private mesh: THREE.Object3D | null = null;
  private rayCastMesh: THREE.Object3D | null = null;
  private intersects: THREE.Intersection[] = [];
  private onMesh = false;
  private pressure: number;
  private basePersistance: number;
  private baseThickness: number;
  private targetPos = new THREE.Vector2(0.5, 0.5);
  private newPos = new THREE.Vector2(0.5, 0.5);
  private oldPos = new THREE.Vector2(0.5, 0.5);
  private mouse = new THREE.Vector2();
  private size = new THREE.Vector2(window.innerWidth, window.innerHeight);

  readonly simulationMaterial: THREE.ShaderMaterial;
  readonly bufferSim: BufferSim;

  constructor(options: MouseSimOptions) {
    const {
      renderer,
      camera,
      mesh,
      rayCastMesh,
      width = window.innerWidth / 4,
      height = window.innerHeight / 4,
      persistance = 0.75,
      thickness = 0.25,
      diffusion = 0,
      diffusionSize = 0,
      pressure = 1,
      noiseTexture = null,
    } = options;

    this.renderer = renderer;
    this.pressure = pressure;
    this.basePersistance = persistance;
    this.baseThickness = thickness;
    this.size.set(window.innerWidth, window.innerHeight);

    this.onMesh = !!mesh;
    if (this.onMesh && camera) {
      this.mesh = mesh || null;
      this.camera = camera;
      this.rayCastMesh = rayCastMesh || mesh || null;
      this.raycaster = new THREE.Raycaster();
    }

    this.simulationMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uNoiseTexture: { value: noiseTexture },
        uCoords: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uPersistance: { value: persistance },
        uThickness: { value: thickness },
        uDiffusion: { value: diffusion },
        uDiffusionSize: { value: diffusionSize },
        uTime: { value: 0 },
        uPosOld: { value: new THREE.Vector2(0, 0) },
        uPosNew: { value: new THREE.Vector2(0, 0) },
        uSpeed: { value: 0 },
        uColor: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: MOUSE_SIM_VERTEX,
      fragmentShader: MOUSE_SIM_FRAGMENT,
      transparent: true,
    });

    this.bufferSim = new BufferSim(renderer, width, height, this.simulationMaterial);
  }

  onResize(width: number, height: number, simWidth?: number, simHeight?: number) {
    this.size.set(width, height);
    const targetW = simWidth ?? width;
    const targetH = simHeight ?? height;
    this.bufferSim.onResize(targetW, targetH);
    this.simulationMaterial.uniforms.uCoords.value.set(width, height);
  }

  private updateTargetFromPointer(pointer: { x: number; y: number }) {
    if (!this.onMesh || !this.raycaster || !this.camera || !this.rayCastMesh) {
      this.targetPos.set(pointer.x / this.size.x, 1 - pointer.y / this.size.y);
      return;
    }

    this.mouse.x = (pointer.x / this.size.x) * 2 - 1;
    this.mouse.y = -(pointer.y / this.size.y) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.intersects = this.raycaster.intersectObjects([this.rayCastMesh]);
    if (this.intersects.length > 0 && this.intersects[0].uv) {
      this.targetPos.set(this.intersects[0].uv.x, this.intersects[0].uv.y);
    }
  }

  update(
    time: number,
    delta: number,
    pointer: { x: number; y: number }
  ) {
    this.updateTargetFromPointer(pointer);

    this.newPos.lerp(this.targetPos, delta * 7.5);
    const speed = new THREE.Vector2().subVectors(this.newPos, this.oldPos);

    this.simulationMaterial.uniforms.uPosNew.value.copy(this.newPos);
    this.simulationMaterial.uniforms.uPosOld.value.copy(this.oldPos);
    this.simulationMaterial.uniforms.uSpeed.value = Math.max(speed.length(), 1e-4);
    this.simulationMaterial.uniforms.uTime.value = time;
    this.simulationMaterial.uniforms.uPersistance.value = Math.pow(
      this.basePersistance,
      delta * 10
    );
    this.simulationMaterial.uniforms.uThickness.value =
      this.baseThickness * this.pressure;

    this.bufferSim.render();
    this.renderer.setRenderTarget(null);
    this.oldPos.copy(this.newPos);
  }

  setConfig(config: { persistance?: number; thickness?: number; pressure?: number }) {
    if (config.persistance !== undefined) {
      this.basePersistance = config.persistance;
    }
    if (config.thickness !== undefined) {
      this.baseThickness = config.thickness;
    }
    if (config.pressure !== undefined) {
      this.pressure = config.pressure;
    }
  }
}
