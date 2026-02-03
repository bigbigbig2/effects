import * as THREE from "three";

export class ProjectionMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      transparent: true,
      defines: {
        USE_INSTANCING: "",
      },
      uniforms: {
        uTexture: { value: null },
        uParallax: { value: new THREE.Vector2() },
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
          vec2 uv = vUv + uParallax;
          vec4 tex = texture2D(uTexture, uv);
          gl_FragColor = vec4(tex.rgb, tex.a * vAlpha);
        }
      `,
    });
  }
}