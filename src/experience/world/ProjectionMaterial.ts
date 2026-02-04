import * as THREE from "three";

/**
 * 投影材质 (ProjectionMaterial)
 *
 * 一个自定义的 ShaderMaterial，用于将纹理投影到网格上。
 * 支持 Instancing（实例化渲染），使得每个实例（立方体）可以根据其 UV 坐标
 * 采样纹理的一部分，从而拼凑出完整的图像。
 *
 * 特性：
 * - 支持视差效果 (uParallax)
 * - 支持透明度控制 (vAlpha)
 */
export class ProjectionMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      transparent: true,
      defines: {
        USE_INSTANCING: "", // 启用实例化支持
      },
      uniforms: {
        uTexture: { value: null }, // 投影的纹理
        uParallax: { value: new THREE.Vector2() }, // 视差偏移量
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
          // 应用视差偏移
          vec2 uv = vUv + uParallax;
          vec4 tex = texture2D(uTexture, uv);
          // 结合纹理颜色和实例透明度
          gl_FragColor = vec4(tex.rgb, tex.a * vAlpha);
        }
      `,
    });
  }
}