import * as THREE from "three";
import { ENV_FRAGMENT, ENV_VERTEX } from "./shaders";

const ENV_SETTINGS = {
  ENVMAP_INTENSITY: 1,
  SHADER_1_ALPHA: 0.5,
  SHADER_1_SPEED: 0.5,
  SHADER_1_SCALE: 5.5,
  SHADER_2_ALPHA: 0,
  SHADER_2_SCALE: 13,
  SHADER_3_ALPHA: 0,
  SHADER_3_SPEED: 0,
  SHADER_3_SCALE: 0,
  SHADER_1_MIX_3: 1.5,
};

class WorkEnvironmentMaterial extends THREE.MeshStandardMaterial {
  readonly customUniforms: Record<string, THREE.IUniform>;

  constructor() {
    super({ side: THREE.BackSide, envMapIntensity: ENV_SETTINGS.ENVMAP_INTENSITY, fog: false });
    this.dithering = true;

    this.customUniforms = {
      uTime: new THREE.Uniform(0),
      uMultiplier: new THREE.Uniform(2),
      uDarken: new THREE.Uniform(1),
      tSky: new THREE.Uniform(null),
      uDarkenColor: new THREE.Uniform(new THREE.Color("#464646")),
      uEnvTint: new THREE.Uniform(new THREE.Color("#ffffff")),
      uShader1Alpha: new THREE.Uniform(ENV_SETTINGS.SHADER_1_ALPHA),
      uShader1Speed: new THREE.Uniform(ENV_SETTINGS.SHADER_1_SPEED),
      uShader1Scale: new THREE.Uniform(ENV_SETTINGS.SHADER_1_SCALE),
      uShader2Alpha: new THREE.Uniform(ENV_SETTINGS.SHADER_2_ALPHA),
      uShader2Scale: new THREE.Uniform(ENV_SETTINGS.SHADER_2_SCALE),
      uShader3Alpha: new THREE.Uniform(ENV_SETTINGS.SHADER_3_ALPHA),
      uShader3Speed: new THREE.Uniform(ENV_SETTINGS.SHADER_3_SPEED),
      uShader3Scale: new THREE.Uniform(ENV_SETTINGS.SHADER_3_SCALE),
      uShader1Mix3: new THREE.Uniform(ENV_SETTINGS.SHADER_1_MIX_3),
    };

    this.onBeforeCompile = (shader) => {
      shader.uniforms.uMultiplier = this.customUniforms.uMultiplier;
      shader.uniforms.uShader1Speed = this.customUniforms.uShader1Speed;
      shader.uniforms.uShader1Alpha = this.customUniforms.uShader1Alpha;
      shader.uniforms.uShader1Scale = this.customUniforms.uShader1Scale;
      shader.uniforms.uShader2Alpha = this.customUniforms.uShader2Alpha;
      shader.uniforms.uShader2Scale = this.customUniforms.uShader2Scale;
      shader.uniforms.uShader3Alpha = this.customUniforms.uShader3Alpha;
      shader.uniforms.uShader3Scale = this.customUniforms.uShader3Scale;
      shader.uniforms.uShader3Speed = this.customUniforms.uShader3Speed;
      shader.uniforms.uShader1Mix3 = this.customUniforms.uShader1Mix3;
      shader.uniforms.uDarkenColor = this.customUniforms.uDarkenColor;
      shader.uniforms.uDarken = this.customUniforms.uDarken;
      shader.uniforms.uTime = this.customUniforms.uTime;
      shader.uniforms.tSky = this.customUniforms.tSky;
      shader.uniforms.uEnvTint = this.customUniforms.uEnvTint;

      shader.vertexShader = ENV_VERTEX;
      shader.fragmentShader = ENV_FRAGMENT;
    };
  }

  update(time: number) {
    this.customUniforms.uTime.value = time;
  }
}

export class WorkEnvironment extends THREE.Group {
  readonly material: WorkEnvironmentMaterial;
  readonly mesh: THREE.Mesh;

  constructor() {
    super();
    const geometry = new THREE.CylinderGeometry(300, 300, 10, 64, 1, true);
    this.material = new WorkEnvironmentMaterial();
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.add(this.mesh);
  }

  setSkyTexture(texture: THREE.Texture | null) {
    this.material.customUniforms.tSky.value = texture;
  }

  setDarkenColor(color: string) {
    this.material.customUniforms.uDarkenColor.value = new THREE.Color(color);
  }

  setDarken(value: number) {
    this.material.customUniforms.uDarken.value = value;
  }

  setEnvTint(color: string) {
    this.material.customUniforms.uEnvTint.value = new THREE.Color(color);
  }

  update(time: number) {
    this.material.update(time);
  }
}
