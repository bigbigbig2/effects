import * as THREE from "three";

/**
 * ProjectionMaterial
 *
 * 自定义投影材质：
 * - 用于把一张纹理“投影”到实例化的立方体网格上
 * - 支持 Instancing（aUv / aAlpha）
 * - 支持轻微视差偏移（uParallax）
 */
export class ProjectionMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      transparent: true,
      defines: {
        USE_INSTANCING: "", // 启用实例化路径
      },
      uniforms: {
        uTexture: { value: null }, // 投影纹理
        uParallax: { value: new THREE.Vector2() }, // 视差偏移
      },
      vertexShader: `
        attribute vec2 aUv;
        attribute float aAlpha;
        varying vec2 vUv;
        varying float vAlpha;
        void main() {
          vUv = aUv;
          vAlpha = aAlpha;
          #ifdef USE_INSTANCING
            vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          #else
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          #endif
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform vec2 uParallax;
        varying vec2 vUv;
        varying float vAlpha;
        void main() {
          // 视差偏移
          vec2 uv = vUv + uParallax;
          vec4 tex = texture2D(uTexture, uv);
          // 纹理颜色 * 实例透明度
          gl_FragColor = vec4(tex.rgb, tex.a * vAlpha);
        }
      `,
    });
  }
}
