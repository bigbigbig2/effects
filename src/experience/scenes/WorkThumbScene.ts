import * as THREE from "three";
import type { Assets } from "../core/Assets";
import type { ProjectItem } from "../data/projects";
import { WorkThumbRenderManager } from "../pipeline/WorkThumbRenderManager";

// 辅助函数：object-fit: cover 效果
const COVER_TEXTURE = `
vec4 coverTexture(sampler2D tex, vec2 imgSize, vec2 ouv, vec2 containerSize) {
  vec2 s = containerSize;
  vec2 i = imgSize;
  float rs = s.x / s.y;
  float ri = i.x / i.y;
  vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
  vec2 newOffset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
  vec2 uv = ouv * s / new + newOffset;
  vec4 color = texture(tex, uv);

  return color;
}
`;

const THUMB_FRAGMENT = `
precision highp float;

${COVER_TEXTURE}

uniform sampler2D tMap;
uniform vec2 uMapSize;
uniform vec2 uResolution;
uniform float uProgress;
uniform float uTransitionCount;
uniform float uTransitionSmoothness;
in vec2 vUv;
out vec4 FragColor;

// 扫描线过渡效果
vec4 transition(vec4 color1, vec4 color2, float progress, vec2 uv) {
  float pr = smoothstep(-uTransitionSmoothness, 0.0, uv.y - progress * (1.0 + uTransitionSmoothness));
  float s = step(pr, fract(uTransitionCount * uv.y));
  return mix(color1, color2, s);
}

void main() {
  vec2 uv = vUv;
  vec4 map = coverTexture(tMap, uMapSize, uv, uResolution);
  vec4 color = vec4(uv.x, uv.y, 0.0, 0.0);
  vec4 mixed = transition(map, color, 1.0 - uProgress, uv);
  FragColor = mixed;
}
`;

const THUMB_VERTEX = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ThumbMaterial:
// 缩略图材质，支持过渡动画。
class ThumbMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      glslVersion: THREE.GLSL3,
      toneMapped: false,
      transparent: false,
      uniforms: {
        tMap: { value: null },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uMapSize: { value: new THREE.Vector2(1, 1) },
        uProgress: { value: 1 },
        uTransitionCount: { value: 150 },
        uTransitionSmoothness: { value: 0.2 },
      },
      vertexShader: THUMB_VERTEX,
      fragmentShader: THUMB_FRAGMENT,
      depthWrite: false,
      depthTest: false,
    });
  }
}

// ThumbItem:
// 单个缩略图对象。
class ThumbItem {
  readonly id: string;
  readonly mesh: THREE.Mesh;
  readonly material: ThumbMaterial;

  constructor(id: string) {
    this.id = id;
    this.material = new ThumbMaterial();
    const geometry = new THREE.PlaneGeometry(1, 1);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.scale.set(2, 2, 2);
  }

  setTexture(texture: THREE.Texture | null) {
    this.material.uniforms.tMap.value = texture;
    if (texture?.image) {
      this.material.uniforms.uMapSize.value.set(
        texture.image.width || 1,
        texture.image.height || 1
      );
    }
  }
}

// ThumbGallery:
// 管理缩略图列表的滚动排布。
class ThumbGallery extends THREE.Group {
  readonly thumbs: ThumbItem[] = [];
  readonly scrollWrap: THREE.Group;
  totalItems = 0;
  itemWidth = 0;
  progress = 0;
  isTransitioning = false;

  constructor() {
    super();
    this.frustumCulled = false;
    this.scrollWrap = new THREE.Group();
    this.add(this.scrollWrap);
  }

  initThumbs(items: ThumbItem[]) {
    this.thumbs.length = 0;
    this.scrollWrap.clear();
    items.forEach((item) => {
      this.thumbs.push(item);
      this.scrollWrap.add(item.mesh);
    });
    this.totalItems = this.thumbs.length;
    this.calcItemWidth();
  }

  calcItemWidth() {
    if (this.thumbs.length > 0) {
      this.itemWidth = this.thumbs[0].mesh.scale.x;
    }
  }

  updateGalleryProgress(progress: number) {
    if (this.isTransitioning || this.totalItems === 0) return;
    const itemWidth = this.itemWidth;
    const totalWidth = this.totalItems * itemWidth;
    this.progress = progress * totalWidth;

    for (let i = 0; i < this.totalItems; i += 1) {
      const thumb = this.thumbs[i];
      const base = itemWidth * i;
      let x = (base + this.progress + totalWidth * 67890) % totalWidth;
      if (x > totalWidth / 2) x -= totalWidth;
      thumb.mesh.position.set(x, 0, 0);
      thumb.mesh.visible = !(x < -1.5 || x > 1.5);
    }
  }
}

/**
 * WorkThumbScene
 *
 * 作用：生成离屏缩略图纹理，用作 SpotLight.map 的投影纹理。
 * - 使用正交相机渲染缩略图阵列
 * - 通过 WorkThumbRenderManager 做暗化/饱和处理
 */
export class WorkThumbScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly renderManager: WorkThumbRenderManager;
  readonly thumbs: ThumbGallery;
  private assets: Assets;
  private projects: ProjectItem[];

  constructor(renderer: THREE.WebGLRenderer, assets: Assets, projects: ProjectItem[]) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#222222").convertLinearToSRGB();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderManager = new WorkThumbRenderManager(renderer, this.scene, this.camera);
    this.thumbs = new ThumbGallery();
    this.scene.add(this.thumbs);
    this.assets = assets;
    this.projects = projects;
    this.initThumbs();
  }

  private async initThumbs() {
    const items = this.projects.map((project) => new ThumbItem(project.slug));
    this.thumbs.initThumbs(items);
    for (let i = 0; i < items.length; i += 1) {
      const project = this.projects[i];
      const texture = await this.assets.loadTexture(
        project.texture,
        project.fallbackTexture
      );
      items[i].setTexture(texture);
    }
  }

  // 每帧更新缩略图位置并渲染离屏纹理
  update(progress: number) {
    this.thumbs.updateGalleryProgress(progress);
    this.renderManager.update(this.camera, this.scene);
  }

  // 设置投影纹理的暗化/饱和度
  setThumbSettings(options: { darkness: number; darknessColor: string; saturation: number }) {
    const uniforms = this.renderManager.compositeMaterial.uniforms;
    uniforms.uDarkenIntensity.value = options.darkness;
    uniforms.uDarkenColor.value = new THREE.Color(options.darknessColor);
    uniforms.uSaturation.value = options.saturation;
  }

  resize(width: number, height: number, dpr: number) {
    this.renderManager.resize(width, height, dpr);
    this.thumbs.calcItemWidth();
  }

  // 输出给 SpotLight.map 的纹理
  get texture() {
    return this.renderManager.renderTargetComposite.texture;
  }
}
