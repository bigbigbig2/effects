import * as THREE from "three";

const WORK_VERTEX = `
attribute float instanceIndex;
attribute float instanceAlpha;
attribute vec3 instanceOffset;
attribute vec3 instanceColor;
varying float vInstanceIndex;
varying float vInstanceAlpha;
varying vec3 vInstanceColor;
varying vec3 vPosition;
varying vec3 vOffset;
varying vec2 vUv;
uniform vec2 uCoords;
uniform float uTime;
uniform float uMouseFactor;
uniform sampler2D tDisplacement;
uniform sampler2D tMouseSim;
uniform sampler2D tPerlin;
uniform vec3 uGridSize;
uniform vec3 uGridOffset;
uniform vec3 uUvOffset;
uniform float uUvOffsetScale;
uniform float uReveal;
uniform float uRevealProject;
uniform float uRevealSides;
uniform float uRevealSpread;
uniform float uRevealSpreadSides;
#define STANDARD
varying vec3 vViewPosition;
varying float vNoise;

#ifdef USE_TRANSMISSION
  varying vec3 vWorldPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <shadowmap_pars_vertex>

void main() {
  vUv = uv;
  #include <uv_vertex>
  #include <color_vertex>
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <normal_vertex>
  #include <begin_vertex>

  vec2 screenUv = gl_Position.xy / uCoords.xy;

  vec2 newUv = screenUv;
  vec2 newOffset = instanceOffset.xy;

  newUv.x /= uGridSize.x;
  newUv.y /= uGridSize.y;

  newUv.x += newOffset.x;
  newUv.y += newOffset.y;

  vec2 mouseUv = newUv + uUvOffset.xy;

  mouseUv /= uUvOffsetScale;

  vec4 mouseSim = texture2D(tMouseSim, mouseUv);

  vec4 instancePos = instanceMatrix[3];

  vec2 perlinUv = newUv * .75;
  vec4 perlin = texture2D(tPerlin, perlinUv - uTime * .05);

  float revealCombined = uReveal * uRevealProject;

  float perlinDisplacementHeight = 10.;
  float perlinDisplacement =  (perlin.x * perlinDisplacementHeight);
  float toCenter = length(instancePos.xy);
  float fadeScale = (revealCombined * 5.75) - (toCenter * (revealCombined / 5.75));
  float fade = clamp(fadeScale, .0, 1.05);

  perlinDisplacement *= fade;

  float perlinScaleDisplacement = min(1., 1. - (perlinDisplacement -  (perlinDisplacementHeight / 2.)) * .1);

  vec3 perlinDisplaced = vec3(transformed);
  perlinDisplaced.z += perlinDisplacement - (perlinDisplacementHeight / 2.);
  perlinDisplaced *= perlinScaleDisplacement;

  transformed *= 1. - mouseSim.r * .05;

  float fadeDiplacementScale = (revealCombined * 4.85) - (toCenter * (revealCombined / 4.85));
  float fadeDiplacement = clamp(fadeDiplacementScale, -1.0, 1.0);

  transformed = mix(transformed, perlinDisplaced, (1. - fadeDiplacement) * .25);
  transformed *= fade;
  transformed *= uRevealSides;

  float mouseTransform = mouseSim.r * 15.;

  vec4 displacement = texture2D(tDisplacement, newUv);
  float displacementF = displacement.r;

  float waveDisplacement = displacementF * 3.0 + 6. * (1. - revealCombined);

  transformed.z -= 1.5;
  transformed.z += waveDisplacement;
  transformed.z += mouseTransform * uMouseFactor;
  transformed *= 1. - displacementF * .1;

  float spread = 3.;

  vec3 transformedSpread = transformed;

  transformedSpread.x -= instanceColor.x * spread;
  transformedSpread.x += spread / 2.0;
  transformedSpread.y -= instanceColor.y * spread;
  transformedSpread.y += spread / 2.0;
  transformedSpread.z -= instanceColor.z * spread;
  transformedSpread.z += spread / 2.0;

  transformed = mix(transformedSpread, transformed, 1. - uRevealSpread);

  vec4 mvPosition = vec4( transformed, 1.0 );

  #ifdef USE_INSTANCING
    mvPosition = instanceMatrix * mvPosition;
  #endif

  mvPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * mvPosition;

  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>

  vViewPosition = - mvPosition.xyz;

  transformed /= 1. - mouseSim.r * .2;
  vec4 worldPosition = vec4( transformed, 1.0 );

  worldPosition = instanceMatrix * worldPosition;
  worldPosition = modelMatrix * worldPosition;

  #include <shadowmap_vertex>
  #include <fog_vertex>
  vInstanceIndex = instanceIndex;
  vInstanceAlpha = instanceAlpha;
  vOffset = instanceOffset;

  #ifdef USE_TRANSMISSION
    vWorldPosition = worldPosition.xyz;
  #endif
  vPosition = position;
  vInstanceColor = instanceColor;
}
`;

const WORK_FRAGMENT = `
varying float vInstanceIndex;
varying float vInstanceAlpha;
varying vec3 vInstanceColor;
varying vec3 vPosition;
varying vec3 vOffset;
uniform vec3 uGridSize;
uniform vec3 uGridOffset;
uniform float uTime;
uniform float uMouseFactor;
uniform float uMouseLightness;
uniform vec2 uCoords;
uniform float uReveal;
uniform float uRevealProject;
uniform float uRevealSides;
varying vec2 vUv;
uniform sampler2D tMouseSim2;
uniform sampler2D tDisplacement;

#define STANDARD
#ifdef PHYSICAL
  #define IOR
  #define SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
uniform float ior;
#endif
#ifdef SPECULAR
uniform float specularIntensity;
uniform vec3 specularColor;
  #ifdef USE_SPECULARINTENSITYMAP
uniform sampler2D specularIntensityMap;
  #endif
  #ifdef USE_SPECULARCOLORMAP
uniform sampler2D specularColorMap;
  #endif
#endif
#ifdef USE_CLEARCOAT
uniform float clearcoat;
uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
uniform float iridescence;
uniform float iridescenceIOR;
uniform float iridescenceThicknessMinimum;
uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
uniform vec3 sheenColor;
uniform float sheenRoughness;
  #ifdef USE_SHEENCOLORMAP
uniform sampler2D sheenColorMap;
  #endif
  #ifdef USE_SHEENROUGHNESSMAP
uniform sampler2D sheenRoughnessMap;
  #endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <uv_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>

float random(vec2 st)
{
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float vignette(vec2 coords, vec2 center, float vignin, float vignout, float vignfade, float fstop) {
  float dist = distance(coords.xy, center);
  dist = smoothstep(vignout + (fstop / vignfade), vignin + (fstop / vignfade), dist);
  return clamp(dist, 0.0, 1.0);
}

void main() {
  vec4 diffuseColor = vec4(diffuse, opacity);
  ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
  vec3 totalEmissiveRadiance = emissive;

  #include <roughnessmap_fragment>
  #include <metalnessmap_fragment>
  #include <normal_fragment_begin>
  #include <normal_fragment_maps>
  #include <lights_physical_fragment>
  #include <lights_fragment_begin>
  #include <lights_fragment_end>

  vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
  vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
  vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;

  #include <opaque_fragment>

  float mixedAlpha = vInstanceAlpha;
  vec2 newUv = vUv;
  vec2 newOffset = vOffset.xy;

  newUv.x /= uGridSize.x;
  newUv.y /= uGridSize.y;

  newUv.x += newOffset.x;
  newUv.y += newOffset.y;

  vec2 gridUv = vec2(floor(newUv.x * uGridSize.x), floor(newUv.y * uGridSize.y));
  vec2 gridUv2 = vec2(floor(newUv.y * uGridSize.y), floor(newUv.x * uGridSize.y));

  float alpha = mix(random(gridUv * vInstanceAlpha), random(gridUv), 1.);
  float alpha2 = mix(random(gridUv2 * vInstanceAlpha), random(gridUv2), 1.);

  vec2 screenUv = gl_FragCoord.xy / uCoords.xy;
  vec4 mouseSim = texture2D(tMouseSim2, screenUv);
  vec4 displacement = texture2D(tDisplacement, newUv);

  float revealCombined = uReveal * uRevealProject;
  float mouseF = 1. - mouseSim.r;

  mixedAlpha =  ((alpha * alpha2) * vInstanceAlpha);
  if(screenUv.y > 0.1) mixedAlpha += clamp(mouseSim.r * (uMouseFactor * 0.5), 0., 1.);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(mouseF), (1. - uMouseLightness));

  float vignin = 0.01;
  float vignout = 0.2;
  float vignfade = 6.;
  float fstop = 1.0;

  vec2 center = vec2(0.5, 0.5);

  float v = vignette(newUv.xy, center.xy, 0.01, 0.2,  6., 1.0);
  float v2 = vignette(newUv.xy, center.xy, 0.01, 2.0 * pow(revealCombined, .25),  6. , 1.0);

  mixedAlpha += v * .1;
  mixedAlpha -= 1. - v2;
  mixedAlpha *= uRevealSides;

  gl_FragColor.a = mixedAlpha;
}
`;

type WorkMaterialOptions = {
  perlinTexture?: THREE.Texture | null;
};

export class WorkInstancedMaterial extends THREE.MeshPhysicalMaterial {
  readonly customUniforms: Record<string, THREE.IUniform>;

  constructor({ perlinTexture }: WorkMaterialOptions = {}) {
    super({ color: new THREE.Color("#808080") });

    const dummyTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    dummyTexture.needsUpdate = true;

    this.dithering = true;
    this.transparent = true;
    this.envMapIntensity = 0.75;
    this.roughness = 1;
    this.depthTest = false;
    this.depthWrite = false;

    this.customUniforms = {
      uTime: { value: 0 },
      uCoords: { value: new THREE.Vector2() },
      uGridSize: { value: new THREE.Vector3() },
      uGridOffset: { value: new THREE.Vector3() },
      tMouseSim: { value: dummyTexture },
      tMouseSim2: { value: dummyTexture },
      uMouseSpeed: { value: 0 },
      uMouseFactor: { value: 1 },
      uMouseLightness: { value: 1 },
      uUvOffset: { value: new THREE.Vector2() },
      uUvOffsetScale: { value: 1 },
      uReveal: { value: 1 },
      uRevealProject: { value: 1 },
      uRevealSides: { value: 1 },
      uRevealSpreadSides: { value: 0 },
      uRevealSpread: { value: 0 },
      tPerlin: { value: perlinTexture ?? dummyTexture },
      tDisplacement: { value: dummyTexture },
    };

    this.onBeforeCompile = (shader) => {
      shader.uniforms.uGridSize = this.customUniforms.uGridSize;
      shader.uniforms.uGridOffset = this.customUniforms.uGridOffset;
      shader.uniforms.uTime = this.customUniforms.uTime;
      shader.uniforms.uCoords = this.customUniforms.uCoords;
      shader.uniforms.tMouseSim = this.customUniforms.tMouseSim;
      shader.uniforms.tMouseSim2 = this.customUniforms.tMouseSim2;
      shader.uniforms.uMouseSpeed = this.customUniforms.uMouseSpeed;
      shader.uniforms.uUvOffset = this.customUniforms.uUvOffset;
      shader.uniforms.uUvOffsetScale = this.customUniforms.uUvOffsetScale;
      shader.uniforms.uReveal = this.customUniforms.uReveal;
      shader.uniforms.uRevealSides = this.customUniforms.uRevealSides;
      shader.uniforms.uRevealProject = this.customUniforms.uRevealProject;
      shader.uniforms.uRevealSpread = this.customUniforms.uRevealSpread;
      shader.uniforms.uRevealSpreadSides = this.customUniforms.uRevealSpreadSides;
      shader.uniforms.tPerlin = this.customUniforms.tPerlin;
      shader.uniforms.tDisplacement = this.customUniforms.tDisplacement;
      shader.uniforms.uMouseFactor = this.customUniforms.uMouseFactor;
      shader.uniforms.uMouseLightness = this.customUniforms.uMouseLightness;

      shader.vertexShader = WORK_VERTEX;
      shader.fragmentShader = WORK_FRAGMENT;
    };
  }

  update(time: number, width: number, height: number, dpr: number) {
    this.customUniforms.uTime.value = time;
    this.customUniforms.uCoords.value.set(width * dpr, height * dpr);
  }
}
