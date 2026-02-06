/**
 * shaders.ts
 *
 * 集中管理 Work / Floor / Environment 的自定义 Shader。
 * 仅包含 GLSL 字符串，不包含运行时代码。
 */
// WorkScreen 顶点着色器（实例化 + 鼠标扰动）
export const WORK_VERTEX = `

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

  // vec2 displacementPos = instancePos.xy + uTime;
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

  
  // float toCenter = length(instancePos.xy);
  float fadeDiplacementScale = (revealCombined * 4.85) - (toCenter * (revealCombined / 4.85));
  float fadeDiplacement = clamp(fadeDiplacementScale, -1.0, 1.0);
  
  transformed = mix(transformed, perlinDisplaced, (1. - fadeDiplacement) * .25);
  transformed *= fade;
  transformed *= uRevealSides;
  
  float mouseTransform = mouseSim.r * 15.;
  
  vec4 displacement = texture2D(tDisplacement, newUv);  
  float displacementF = displacement.r;

  // vec2 displacementUv = newUv;
  // vec4 displacement = texture2D(tPerlin, displacementUv - uTime * .05);
  // float displacementF = displacement.r * 5.0;

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

  transformed = mix(transformedSpread, transformed, uRevealSpreadSides);
  transformed = mix(transformedSpread, transformed, 1. - uRevealSpread);
  
  vec4 mvPosition = vec4( transformed, 1.0 );

  #ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
  #endif

  mvPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * mvPosition;

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

// WorkScreen 鐗囨鐫€鑹插櫒锛堥鑹?鍏夌収/閫忔槑搴?榧犳爣褰卞搷锛?// WorkScreen 片段着色器（颜色/光照/透明度/鼠标影响）
// WorkScreen 片段着色器（颜色/光照/透明度/鼠标影响）
export const WORK_FRAGMENT = `

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
// #include <color_pars_fragment>
#include <uv_pars_fragment>
// #include <map_pars_fragment>
// #include <alphamap_pars_fragment>
// #include <alphatest_pars_fragment>
// #include <aomap_pars_fragment>
// #include <lightmap_pars_fragment>
// #include <emissivemap_pars_fragment>
#include <bsdfs>
// #include <iridescence_fragment>
// #include <cube_uv_reflection_fragment>
// #include <envmap_common_pars_fragment>
// #include <envmap_physical_pars_fragment>
// #include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
// #include <bumpmap_pars_fragment>
// #include <normalmap_pars_fragment>
// #include <clearcoat_pars_fragment>
// #include <iridescence_pars_fragment>
// #include <roughnessmap_pars_fragment>
// #include <metalnessmap_pars_fragment>
// #include <logdepthbuf_pars_fragment>
// #include <clipping_planes_pars_fragment>

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
	// #include <clipping_planes_fragment>
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

  // create a vignette
  
  // get screen uv
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

  // #include <tonemapping_fragment>
}
`;

// 鍦伴潰椤剁偣鐫€鑹插櫒
// 地面顶点着色器
// 地面顶点着色器
export const FLOOR_VERTEX = `

uniform mat3 uMapTransform;
uniform mat4 uMatrix;
out vec2 vUv;
out vec4 vCoord;
out vec3 vNormal;
out vec3 vToEye;
void main() {
  vUv = (uMapTransform * vec3(uv, 1.0)).xy;
  vCoord = uMatrix * vec4(position, 1.0);
  vNormal = normalMatrix * normal;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vToEye = cameraPosition - worldPosition.xyz;
  vec4 mvPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * mvPosition;
}

`;

// 鍦伴潰鐗囨鐫€鑹插櫒锛堝弽灏勩€佺矖绯欏害銆佹硶绾挎壈鍔ㄣ€侀浘锛?// 地面片段着色器（反射、粗糙度、法线扰动、雾）
// 地面片段着色器（反射、粗糙度、法线扰动、雾）
export const FLOOR_FRAGMENT = `

precision mediump float;



float random(vec2 co) {
    float a = 12.9898;
    float b = 78.233;
    float c = 43758.5453;
    float dt = dot(co.xy, vec2(a, b));
    float sn = mod(dt, 3.14);
    return fract(sin(sn) * c);
}


vec3 dither(vec3 color) {
    // Calculate grid position
    float grid_position = random(gl_FragCoord.xy);
    // Shift the individual colors differently, thus making it even harder to see the dithering pattern
    vec3 dither_shift_RGB = vec3(0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0);
    // Modify shift acording to grid position
    dither_shift_RGB = mix(2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position);
    // Shift the color by dither_shift
    return color + dither_shift_RGB;
}


uniform sampler2D tReflect;
uniform vec3 uColor;
uniform float uReflectivity;
uniform float uMirror;
uniform float uFloorMixStrength;
uniform float uNormalDistortionStrength;
uniform float uRoughness;
uniform float uMetalness;

#ifdef USE_MAP
uniform sampler2D tMap;
#endif

#ifdef USE_NORMALMAP
uniform sampler2D tNormalMap;
uniform vec2 uNormalScale;
#endif

#ifdef USE_FOG
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
#endif

in vec2 vUv;
in vec4 vCoord;
in vec3 vNormal;
in vec3 vToEye;

out vec4 FragColor;

void main() {
    #ifdef USE_MAP
  vec4 color = texture(tMap, vUv);
    #else
  vec4 color = vec4(uColor, 1.0);
    #endif

    #ifdef USE_NORMALMAP
  vec4 normalColor = texture(tNormalMap, vUv * uNormalScale);
  vec3 normal = normalize(vec3(normalColor.r * uNormalDistortionStrength - (uNormalDistortionStrength / 2.), normalColor.b, normalColor.g * uNormalDistortionStrength - (uNormalDistortionStrength / 2.)));
  vec3 coord = vCoord.xyz / vCoord.w;
  vec2 uv = coord.xy + coord.z * normal.xz * 0.05;
  vec4 reflectColor = texture(tReflect, uv);
    #else
  vec3 normal = vNormal;
  vec4 reflectColor = textureProj(tReflect, vCoord);
    #endif

    // Fresnel term
  vec3 toEye = normalize(vToEye);
  float theta = max(dot(toEye, normal), .0);
  float reflectance = max(0.01, min(uReflectivity + (1.0 - uReflectivity) * pow((1.0 - theta), 5.0), 1.));

  reflectColor = mix(vec4(0), reflectColor, reflectance);

  float roughness = clamp(uRoughness, 0.0, 1.0);
  float metalness = clamp(uMetalness, 0.0, 1.0);
  float mixStrength = uFloorMixStrength * (1.0 - roughness);
  vec3 baseColor = color.rgb * (1.0 - min(1.0, uMirror));
  vec3 reflected = reflectColor.rgb * mixStrength;
  vec3 combined = baseColor + reflected;
  FragColor.rgb = mix(combined, reflectColor.rgb, metalness * 0.5);

    #ifdef USE_FOG
  float fogDepth = gl_FragCoord.z / gl_FragCoord.w;
  float fogFactor = smoothstep(uFogNear, uFogFar, fogDepth);

  FragColor.rgb = mix(FragColor.rgb, uFogColor, fogFactor);
    #endif

    #ifdef DITHERING
  FragColor.rgb = dither(FragColor.rgb);
    #endif



  FragColor.a = 1.0;
}
`;

// 鐜椤剁偣鐫€鑹插櫒
// 环境顶点着色器
// 环境顶点着色器
export const ENV_VERTEX = `

varying vec2 vUv;
#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
  vUv = uv;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}
`;

// 鐜鐗囨鐫€鑹插櫒锛堝櫔澹板眰銆佹殫鍖栥€佹贩鍚堬級
// 环境片段着色器（噪声层、暗化、混合）
// 环境片段着色器（噪声层、暗化、混合）
export const ENV_FRAGMENT = `


vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+10.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}


float randomF(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float customRoughness(float roughness, vec2 vUv, float size, float time) {
  float roughnessFactor = roughness;
  // Triangular tiling
  vec2 triangle = vec2(mod(vUv.x * size, 1.0), mod(vUv.y * size, 1.0));

    // Generate random shades of grey based on the cell position
  vec2 cell = floor(vUv * size);
  float shade = randomF(cell) * 0.8 + 0.1; // Shades between 0.25 and 0.75
  vec4 roughnessColor = vec4(1.);

    // Create the triangle pattern
  if(triangle.y > triangle.x) {
    roughnessColor = vec4(vec3(shade), 1.0);
  } else {
    roughnessColor = vec4(vec3(1.0 - shade), 1.0);
  }

   roughnessFactor *= roughnessColor.g;

  return roughnessFactor;
}


float noiseShaderRandom(vec2 n) {
  return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 ip = floor(p);
  vec2 u = fract(p);
  u = u * u * (3.0 - 2.0 * u);

  float res = mix(mix(noiseShaderRandom(ip), noiseShaderRandom(ip + vec2(1.0, 0.0)), u.x), mix(noiseShaderRandom(ip + vec2(0.0, 1.0)), noiseShaderRandom(ip + vec2(1.0, 1.0)), u.x), u.y);
  return res * res;
}

const mat2 mtx = mat2(0.80, 0.60, -0.60, 0.80);

float fbm(vec2 p, float time, float speed) {
  float f = 0.0;

  f += 0.500000 * noise(p - time * speed);
  p = mtx * p * 2.02;
  f += 0.031250 * noise(p);
  p = mtx * p * 2.01;
  f += 0.250000 * noise(p);
  p = mtx * p * 2.03;
  f += 0.125000 * noise(p);
  p = mtx * p * 2.01;
  f += 0.062500 * noise(p - time * (speed * 5.));
  p = mtx * p * 2.04;
  f += 0.015625 * noise(p + time * (speed * 5.));

  return f / 0.96875;
}

float pattern(vec2 p, float time, float speed) {
  float f1 = fbm(p, time, speed);
  float f2 = fbm(p + f1, time, speed);

  return fbm(p + f2, time, speed);
}
vec4 noiseShader(vec2 uv, float time, float speed) {
  float shade = pattern(uv, time, speed);
  return vec4(vec3(shade), shade);
}



float blendColorDodge(float base, float blend) {
	return (blend==1.0)?blend:min(base/(1.0-blend),1.0);
}

vec3 blendColorDodge(vec3 base, vec3 blend) {
	return vec3(blendColorDodge(base.r,blend.r),blendColorDodge(base.g,blend.g),blendColorDodge(base.b,blend.b));
}

vec3 blendColorDodge(vec3 base, vec3 blend, float opacity) {
	return (blendColorDodge(base, blend) * opacity + base * (1.0 - opacity));
}


float blendColorBurn(float base, float blend) {
	return (blend==0.0)?blend:max((1.0-((1.0-base)/blend)),0.0);
}

vec3 blendColorBurn(vec3 base, vec3 blend) {
	return vec3(blendColorBurn(base.r,blend.r),blendColorBurn(base.g,blend.g),blendColorBurn(base.b,blend.b));
}

vec3 blendColorBurn(vec3 base, vec3 blend, float opacity) {
	return (blendColorBurn(base, blend) * opacity + base * (1.0 - opacity));
}


float blendLinearBurn(float base, float blend) {
	// Note : Same implementation as BlendSubtractf
	return max(base+blend-1.0,0.0);
}

vec3 blendLinearBurn(vec3 base, vec3 blend) {
	// Note : Same implementation as BlendSubtract
	return max(base+blend-vec3(1.0),vec3(0.0));
}

vec3 blendLinearBurn(vec3 base, vec3 blend, float opacity) {
	return (blendLinearBurn(base, blend) * opacity + base * (1.0 - opacity));
}


float blendLinearDodge(float base, float blend) {
	// Note : Same implementation as BlendAddf
	return min(base+blend,1.0);
}

vec3 blendLinearDodge(vec3 base, vec3 blend) {
	// Note : Same implementation as BlendAdd
	return min(base+blend,vec3(1.0));
}

vec3 blendLinearDodge(vec3 base, vec3 blend, float opacity) {
	return (blendLinearDodge(base, blend) * opacity + base * (1.0 - opacity));
}


float blendDarken(float base, float blend) {
	return min(blend,base);
}

vec3 blendDarken(vec3 base, vec3 blend) {
	return vec3(blendDarken(base.r,blend.r),blendDarken(base.g,blend.g),blendDarken(base.b,blend.b));
}

vec3 blendDarken(vec3 base, vec3 blend, float opacity) {
	return (blendDarken(base, blend) * opacity + base * (1.0 - opacity));
}


float blendLighten(float base, float blend) {
	return max(blend,base);
}

vec3 blendLighten(vec3 base, vec3 blend) {
	return vec3(blendLighten(base.r,blend.r),blendLighten(base.g,blend.g),blendLighten(base.b,blend.b));
}

vec3 blendLighten(vec3 base, vec3 blend, float opacity) {
	return (blendLighten(base, blend) * opacity + base * (1.0 - opacity));
}


float blendOverlay(float base, float blend) {
	return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
	return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
}

vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
	return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
}


float blendReflect(float base, float blend) {
	return (blend==1.0)?blend:min(base*base/(1.0-blend),1.0);
}

vec3 blendReflect(vec3 base, vec3 blend) {
	return vec3(blendReflect(base.r,blend.r),blendReflect(base.g,blend.g),blendReflect(base.b,blend.b));
}

vec3 blendReflect(vec3 base, vec3 blend, float opacity) {
	return (blendReflect(base, blend) * opacity + base * (1.0 - opacity));
}


float blendVividLight(float base, float blend) {
	return (blend<0.5)?blendColorBurn(base,(2.0*blend)):blendColorDodge(base,(2.0*(blend-0.5)));
}

vec3 blendVividLight(vec3 base, vec3 blend) {
	return vec3(blendVividLight(base.r,blend.r),blendVividLight(base.g,blend.g),blendVividLight(base.b,blend.b));
}

vec3 blendVividLight(vec3 base, vec3 blend, float opacity) {
	return (blendVividLight(base, blend) * opacity + base * (1.0 - opacity));
}


float blendHardMix(float base, float blend) {
	return (blendVividLight(base,blend)<0.5)?0.0:1.0;
}

vec3 blendHardMix(vec3 base, vec3 blend) {
	return vec3(blendHardMix(base.r,blend.r),blendHardMix(base.g,blend.g),blendHardMix(base.b,blend.b));
}

vec3 blendHardMix(vec3 base, vec3 blend, float opacity) {
	return (blendHardMix(base, blend) * opacity + base * (1.0 - opacity));
}


float blendLinearLight(float base, float blend) {
	return blend<0.5?blendLinearBurn(base,(2.0*blend)):blendLinearDodge(base,(2.0*(blend-0.5)));
}

vec3 blendLinearLight(vec3 base, vec3 blend) {
	return vec3(blendLinearLight(base.r,blend.r),blendLinearLight(base.g,blend.g),blendLinearLight(base.b,blend.b));
}

vec3 blendLinearLight(vec3 base, vec3 blend, float opacity) {
	return (blendLinearLight(base, blend) * opacity + base * (1.0 - opacity));
}


float blendPinLight(float base, float blend) {
	return (blend<0.5)?blendDarken(base,(2.0*blend)):blendLighten(base,(2.0*(blend-0.5)));
}

vec3 blendPinLight(vec3 base, vec3 blend) {
	return vec3(blendPinLight(base.r,blend.r),blendPinLight(base.g,blend.g),blendPinLight(base.b,blend.b));
}

vec3 blendPinLight(vec3 base, vec3 blend, float opacity) {
	return (blendPinLight(base, blend) * opacity + base * (1.0 - opacity));
}


vec3 blendGlow(vec3 base, vec3 blend) {
	return blendReflect(blend,base);
}

vec3 blendGlow(vec3 base, vec3 blend, float opacity) {
	return (blendGlow(base, blend) * opacity + base * (1.0 - opacity));
}


vec3 blendHardLight(vec3 base, vec3 blend) {
	return blendOverlay(blend,base);
}

vec3 blendHardLight(vec3 base, vec3 blend, float opacity) {
	return (blendHardLight(base, blend) * opacity + base * (1.0 - opacity));
}


vec3 blendPhoenix(vec3 base, vec3 blend) {
	return min(base,blend)-max(base,blend)+vec3(1.0);
}

vec3 blendPhoenix(vec3 base, vec3 blend, float opacity) {
	return (blendPhoenix(base, blend) * opacity + base * (1.0 - opacity));
}


vec3 blendNormal(vec3 base, vec3 blend) {
	return blend;
}

vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
	return (blendNormal(base, blend) * opacity + base * (1.0 - opacity));
}


vec3 blendNegation(vec3 base, vec3 blend) {
	return vec3(1.0)-abs(vec3(1.0)-base-blend);
}

vec3 blendNegation(vec3 base, vec3 blend, float opacity) {
	return (blendNegation(base, blend) * opacity + base * (1.0 - opacity));
}


vec3 blendMultiply(vec3 base, vec3 blend) {
	return base*blend;
}

vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
	return (blendMultiply(base, blend) * opacity + base * (1.0 - opacity));
}


vec3 blendAverage(vec3 base, vec3 blend) {
	return (base+blend)/2.0;
}

vec3 blendAverage(vec3 base, vec3 blend, float opacity) {
	return (blendAverage(base, blend) * opacity + base * (1.0 - opacity));
}


float blendScreen(float base, float blend) {
	return 1.0-((1.0-base)*(1.0-blend));
}

vec3 blendScreen(vec3 base, vec3 blend) {
	return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
}

vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
	return (blendScreen(base, blend) * opacity + base * (1.0 - opacity));
}


float blendSoftLight(float base, float blend) {
	return (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
	return vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
	return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}


float blendSubtract(float base, float blend) {
	return max(base+blend-1.0,0.0);
}

vec3 blendSubtract(vec3 base, vec3 blend) {
	return max(base+blend-vec3(1.0),vec3(0.0));
}

vec3 blendSubtract(vec3 base, vec3 blend, float opacity) {
	return (blendSubtract(base, blend) * opacity + base * (1.0 - opacity));
}


vec3 blendExclusion(vec3 base, vec3 blend) {
	return base+blend-2.0*base*blend;
}

vec3 blendExclusion(vec3 base, vec3 blend, float opacity) {
	return (blendExclusion(base, blend) * opacity + base * (1.0 - opacity));
}


vec3 blendDifference(vec3 base, vec3 blend) {
	return abs(base-blend);
}

vec3 blendDifference(vec3 base, vec3 blend, float opacity) {
	return (blendDifference(base, blend) * opacity + base * (1.0 - opacity));
}


float blendAdd(float base, float blend) {
	return min(base+blend,1.0);
}

vec3 blendAdd(vec3 base, vec3 blend) {
	return min(base+blend,vec3(1.0));
}

vec3 blendAdd(vec3 base, vec3 blend, float opacity) {
	return (blendAdd(base, blend) * opacity + base * (1.0 - opacity));
}



vec3 blend(int mode, vec3 base, vec3 blend, float opacity) {
  if(mode == 1) {
    return blendAdd(base, blend, opacity);
  } else if(mode == 2) {
    return blendAverage(base, blend, opacity);
  } else if(mode == 3) {
    return blendColorBurn(base, blend, opacity);
  } else if(mode == 4) {
    return blendColorDodge(base, blend, opacity);
  } else if(mode == 5) {
    return blendDarken(base, blend, opacity);
  } else if(mode == 6) {
    return blendDifference(base, blend, opacity);
  } else if(mode == 7) {
    return blendExclusion(base, blend, opacity);
  } else if(mode == 8) {
    return blendGlow(base, blend, opacity);
  } else if(mode == 9) {
    return blendHardLight(base, blend, opacity);
  } else if(mode == 10) {
    return blendHardMix(base, blend, opacity);
  } else if(mode == 11) {
    return blendLighten(base, blend, opacity);
  } else if(mode == 12) {
    return blendLinearBurn(base, blend, opacity);
  } else if(mode == 13) {
    return blendLinearDodge(base, blend, opacity);
  } else if(mode == 14) {
    return blendLinearLight(base, blend, opacity);
  } else if(mode == 15) {
    return blendMultiply(base, blend, opacity);
  } else if(mode == 16) {
    return blendNegation(base, blend, opacity);
  } else if(mode == 17) {
    return blendNormal(base, blend, opacity);
  } else if(mode == 18) {
    return blendOverlay(base, blend, opacity);
  } else if(mode == 19) {
    return blendPhoenix(base, blend, opacity);
  } else if(mode == 20) {
    return blendPinLight(base, blend, opacity);
  } else if(mode == 21) {
    return blendReflect(base, blend, opacity);
  } else if(mode == 22) {
    return blendScreen(base, blend, opacity);
  } else if(mode == 23) {
    return blendSoftLight(base, blend, opacity);
  } else if(mode == 24) {
    return blendSubtract(base, blend, opacity);
  } else if(mode == 25) {
    return blendVividLight(base, blend, opacity);
  }
}



vec4 oil(vec2 uv, float time, float strength) {
    float t = time;
    vec3 col = vec3(0.0);
    vec2 pos = uv;
    float noisePos = snoise(uv * 1.15) * .005;

    for (float k = 1.0; k < 5.0; k += 1.) { 
        pos.x += strength * sin(2.0 * t + k * 1.5 * pos.y + noisePos * 10.);
        pos.y += strength * cos(2.0 * t + k * 1.5 * pos.x - noisePos);
    }

    col += clamp(-0.0 + 0.5 * cos(t * 0.5 + pos.xyx * 3.0).xxx, -0.1, 0.99);
    return vec4(col, 1.0);
}


uniform float uMultiplier;
uniform float uShader1Speed;
uniform float uShader1Alpha;
uniform float uShader1Scale;

uniform float uShader2Alpha;
uniform float uShader2Scale;

uniform float uShader3Speed;
uniform float uShader3Alpha;
uniform float uShader3Scale;

uniform float uShader1Mix2;
uniform float uShader1Mix3;

uniform vec3 uDarkenColor;
uniform float uDarken;

uniform sampler2D tSky;

uniform float uTime;
varying vec2 vUv;

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
// #include <color_pars_fragment>
#include <uv_pars_fragment>
// #include <map_pars_fragment>
// #include <alphamap_pars_fragment>
// #include <alphatest_pars_fragment>
// #include <aomap_pars_fragment>
// #include <lightmap_pars_fragment>
// #include <emissivemap_pars_fragment>
#include <bsdfs>
// #include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
// #include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
// #include <bumpmap_pars_fragment>
// #include <normalmap_pars_fragment>
// #include <clearcoat_pars_fragment>
// #include <iridescence_pars_fragment>
// #include <roughnessmap_pars_fragment>
// #include <metalnessmap_pars_fragment>
// #include <logdepthbuf_pars_fragment>
// #include <clipping_planes_pars_fragment>

float smoothMask(float coord, float center, float spread) {
  return (1. - smoothstep(coord,  center, center - spread)) + (1. - smoothstep(coord,  center, center + spread));
}

void main() {
	// #include <clipping_planes_fragment>
  vec4 diffuseColor = vec4(diffuse, opacity);
  ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
  vec3 totalEmissiveRadiance = emissive;

	// #include <logdepthbuf_fragment>
	// #include <map_fragment>
	// #include <color_fragment>

  vec2 skyUv = vUv;
  vec2 skyUv2 = vUv;

  
  skyUv.x += .5;
  skyUv2.x -= .75;

  vec4 noise = texture(tSky, (skyUv * 2.));
  vec4 noise2 = texture(tSky, (skyUv2 * 1.));
  
  vec3 maskColor = vec3(1.0, 1.0, 1.0);
  
  float m = 0.0;

  m = max(m, 1. - smoothstep(vUv.x, 0.00, 0.015));
  m = max(m, 1. - smoothstep(vUv.x, 1.015, 0.985));
  m = max(m, smoothMask(vUv.x, .5, 0.01));
  m = m * 1. - smoothMask(vUv.x, .75, 0.02);
  m = clamp(m, 0.0, 1.0);

  vec4 noiseMixed = mix(noise, noise2, m);
  
  diffuseColor.rgb = blend(4, diffuseColor.rgb, noiseMixed.rgb, 0.5);
  
  vec2 skyMaskUv = vUv;
  
  skyMaskUv.y -= .1;
  
  float skyMask = mod((skyMaskUv.y) * 5., 1.);
  skyMask = max(skyMask, step(0.6, skyMaskUv.y));
  
  diffuseColor.rgb = blend(16, diffuseColor.rgb, noiseMixed.rgb , skyMask);
  diffuseColor.rgb += vec3(smoothstep(vUv.y, .45, .595));

  float skyMask2 = mod((skyMaskUv.y) * 2.5, 1.);
  skyMask2 = max(skyMask, step(0.6, skyMaskUv.y));

  diffuseColor.rgb = mix(vec3(1.0, 1.0, 1.0), diffuseColor.rgb, skyMask2 * 1.5);
  diffuseColor.rgb *= 1.15;
  diffuseColor.rgb *= clamp(diffuseColor.rgb, vec3(0.0), vec3(1.0));
  
	// #include <alphamap_fragment>
	// #include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	// #include <clearcoat_normal_fragment_begin>
	// #include <clearcoat_normal_fragment_maps>
	// #include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	// #include <aomap_fragment>
  vec3 totalDiffuse = reflectedLight.indirectDiffuse;
  vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	// #include <transmission_fragment>
  vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
  
  vec3 black = vec3(0.095, 0.095, 0.095);
  
	#include <opaque_fragment>

  gl_FragColor.rgb = blend(4, gl_FragColor.rgb, uDarkenColor, uDarken);
  // gl_FragColor.rgb = 1. - noiseMixed.rgb;
  // gl_FragColor.rgb = vec3(mask4);



	// #include <tonemapping_fragment>
	// #include <colorspace_fragment>
	// #include <fog_fragment>
	// #include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}
`;
