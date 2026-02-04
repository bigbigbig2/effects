import * as THREE from "three";
import type { Assets } from "../core/Assets";
import type { ProjectItem } from "../data/projects";
import { SimpleRenderManager } from "../pipeline/SimpleRenderManager";

// GLSL 混合函数：变亮模式
const BLEND_LIGHTEN = `
float blendLighten(float base, float blend) {
	return max(blend, base);
}

vec3 blendLighten(vec3 base, vec3 blend) {
	return vec3(blendLighten(base.r, blend.r), blendLighten(base.g, blend.g), blendLighten(base.b, blend.b));
}
`;

// 片段着色器
const MEDIA_FRAGMENT = `
precision highp float;

${BLEND_LIGHTEN}

// 辅助函数：根据容器尺寸裁剪/覆盖纹理 (object-fit: cover)
vec4 coverTexture(sampler2D tex, vec2 imgSize, vec2 ouv, vec2 size) {
  vec2 s = size;
  vec2 i = imgSize;
  float rs = s.x / s.y;
  float ri = i.x / i.y;
  vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
  vec2 newOffset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
  vec2 uv = ouv * s / new + newOffset;

  return texture(tex, uv);
}

uniform sampler2D tMap;
uniform vec2 uMapSize;
uniform vec2 uContainerSize;
uniform float uCameraDistance;
uniform float uRadius;
uniform vec3 uBackgroundColor;
uniform float uReveal;

in vec2 vUv;
out vec4 FragColor;

// 圆角矩形距离场函数
float udRoundBox( vec2 p, vec2 b, float r ) {
  return length(max(abs(p)-b+r,0.0))-r;
}

void main() {
  // 视差效果
  float parallax = uCameraDistance * 0.0001;
  vec2 uv = vUv;
  uv.y -= parallax;

  vec4 color = coverTexture(tMap, uMapSize, uv, uContainerSize);
  color.rgb = blendLighten(color.rgb, vec3(.02)); // 稍微提亮

  // 圆角遮罩计算
  vec2 res = uContainerSize;
  vec2 halfRes = 0.5 * res;
  float b = udRoundBox(vUv.xy * res - halfRes, halfRes, uRadius);
  vec3 a = mix(vec3(1.0,0.0,0.0), vec3(0.0,0.0,0.0), smoothstep(0.0, 1.0, b));

  // 揭示动画混合
  color.rgb = mix(color.rgb, uBackgroundColor, 1. - uReveal);
  color.a = a.x;
  FragColor = color;
}
`;

const MEDIA_VERTEX = `
precision highp float;

uniform float uCircleRotation;
out vec2 vUv;
out vec3 vDir;
void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * mvPosition;
}
`;

// MediaMaterial 类：
// 用于显示项目媒体（图片/视频）的自定义材质，支持圆角和视差。
class MediaMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      glslVersion: THREE.GLSL3,
      toneMapped: false,
      uniforms: {
        tMap: { value: null },
        uContainerSize: { value: new THREE.Vector2(1, 1) },
        uMapSize: { value: new THREE.Vector2(1, 1) },
        uCameraDistance: { value: 0 },
        uRadius: { value: 0 },
        uBackgroundColor: { value: new THREE.Color(0x1f1f1f) },
        uReveal: { value: 1 },
      },
      vertexShader: MEDIA_VERTEX,
      fragmentShader: MEDIA_FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
  }
}

class MediaPlane extends THREE.Group {
  readonly material: MediaMaterial;
  readonly mesh: THREE.Mesh;
  private camera: THREE.OrthographicCamera;

  constructor(camera: THREE.OrthographicCamera) {
    super();
    this.camera = camera;
    const geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new MediaMaterial();
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.add(this.mesh);
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

  resize(width: number, height: number) {
    this.mesh.scale.set(width, height, 1);
    this.material.uniforms.uContainerSize.value.set(width, height);
  }

  update() {
    this.material.uniforms.uCameraDistance.value =
      this.camera.position.y - this.position.y;
  }
}

export class MediaScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly renderManager: SimpleRenderManager;
  readonly plane: MediaPlane;
  private textures = new Map<string, THREE.Texture>();
  private currentSlug: string | null = null;
  private projects: ProjectItem[];
  private assets: Assets;

  constructor(
    renderer: THREE.WebGLRenderer,
    assets: Assets,
    projects: ProjectItem[]
  ) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderManager = new SimpleRenderManager(renderer, this.scene, this.camera);
    this.plane = new MediaPlane(this.camera);
    this.scene.add(this.plane);
    this.assets = assets;
    this.projects = projects;
  }

  async setActiveIndex(index: number) {
    const project = this.projects[index];
    if (!project || project.slug === this.currentSlug) return;
    this.currentSlug = project.slug;

    let texture = this.textures.get(project.slug);
    if (!texture) {
      texture = await this.assets.loadTexture(project.texture, project.fallbackTexture);
      this.textures.set(project.slug, texture);
    }
    this.plane.setTexture(texture);
  }

  resize(width: number, height: number, dpr: number) {
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
    this.plane.resize(width, height);
    this.renderManager.resize(width, height, dpr);
  }

  update() {
    this.plane.update();
    this.renderManager.update(this.camera, this.scene);
  }

  setBackgroundColor(color: string) {
    this.plane.material.uniforms.uBackgroundColor.value = new THREE.Color(color);
  }

  get texture() {
    return this.renderManager.renderTargetComposite.texture;
  }
}
