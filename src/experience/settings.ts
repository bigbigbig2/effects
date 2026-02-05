export type ExperienceSettings = {
  controls: {
    stepVelocity: number;
    stepDistance: number;
    stepCooldown: number;
    stepDuration: number;
    settleThreshold: number;
    unlockVelocity: number;
    lockScroll: boolean;
    wheelThreshold: number;
  };
  render: {
    darken: number;
    saturation: number;
    bloomEnabled: boolean;
    bloomStrength: number;
    bloomRadius: number;
    luminosityEnabled: boolean;
    luminosityThreshold: number;
    luminositySmoothing: number;
  };
  composite: {
    contrast: number;
    perlin: number;
    fluidStrength: number;
    mediaReveal: number;
    bgColor: string;
  };
  work: {
    onlyActiveVisible: boolean;
    ambientIntensity: number;
    spotIntensity: number;
    fogEnabled: boolean;
    fogColor: string;
    fogNear: number;
    fogFar: number;
    groundEnabled: boolean;
    groundColor: string;
    groundRoughness: number;
    groundMetalness: number;
    groundOpacity: number;
    groundEnvIntensity: number;
    groundY: number;
    groundScale: number;
    envDarken: number;
    envShader1Alpha: number;
    envShader1Speed: number;
    envShader1Scale: number;
    envShader2Alpha: number;
    envShader2Scale: number;
    envShader3Alpha: number;
    envShader3Speed: number;
    envShader3Scale: number;
    envShader1Mix3: number;
    mouseFactor: number;
    mouseLightness: number;
    mouseThickness: number;
    mousePersistance: number;
    mousePressure: number;
  };
  sky: {
    shader1Alpha: number;
    shader1Speed: number;
    shader1Scale: number;
    shader2Speed: number;
    shader2Scale: number;
    shaderMix: number;
  };
};

const defaultSettings: ExperienceSettings = {
  controls: {
    stepVelocity: 0.15,
    stepDistance: 0.01,
    stepCooldown: 0.35,
    stepDuration: 0.9,
    settleThreshold: 0.0025,
    unlockVelocity: 0.02,
    lockScroll: false,
    wheelThreshold: 120,
  },
  render: {
    darken: 0.2,
    saturation: 0.35,
    bloomEnabled: true,
    bloomStrength: 0.15,
    bloomRadius: 1.5,
    luminosityEnabled: true,
    luminosityThreshold: 0.1,
    luminositySmoothing: 0.95,
  },
  composite: {
    contrast: 1.1,
    perlin: 0.1,
    fluidStrength: 0.04,
    mediaReveal: 0,
    bgColor: "#1f1f1f",
  },
  work: {
    onlyActiveVisible: false,
    ambientIntensity: 0.5,
    spotIntensity: 220,
    fogEnabled: true,
    fogColor: "#A294FF",
    fogNear: 17.39,
    fogFar: 35.87,
    groundEnabled: true,
    groundColor: "#4a4a4a",
    groundRoughness: 0.93,
    groundMetalness: 0.2,
    groundOpacity: 1,
    groundEnvIntensity: 0.97,
    groundY: -1.65,
    groundScale: 1,
    envDarken: 1,
    envShader1Alpha: 0.5,
    envShader1Speed: 0.5,
    envShader1Scale: 5.5,
    envShader2Alpha: 0,
    envShader2Scale: 13,
    envShader3Alpha: 0,
    envShader3Speed: 0,
    envShader3Scale: 0,
    envShader1Mix3: 1.5,
    mouseFactor: 0.25,
    mouseLightness: 1,
    mouseThickness: 0.1,
    mousePersistance: 0.85,
    mousePressure: 0,
  },
  sky: {
    shader1Alpha: 0.5,
    shader1Speed: 0.5,
    shader1Scale: 5.5,
    shader2Speed: 0,
    shader2Scale: 0,
    shaderMix: 1.5,
  },
};

const settings: ExperienceSettings = {
  controls: { ...defaultSettings.controls },
  render: { ...defaultSettings.render },
  composite: { ...defaultSettings.composite },
  work: { ...defaultSettings.work },
  sky: { ...defaultSettings.sky },
};

type Listener = (value: ExperienceSettings) => void;

type PartialSettings = {
  controls?: Partial<ExperienceSettings["controls"]>;
  render?: Partial<ExperienceSettings["render"]>;
  composite?: Partial<ExperienceSettings["composite"]>;
  work?: Partial<ExperienceSettings["work"]>;
  sky?: Partial<ExperienceSettings["sky"]>;
};

const listeners = new Set<Listener>();

export function getSettings() {
  return settings;
}

export function setSettings(partial: PartialSettings) {
  if (partial.controls) {
    Object.assign(settings.controls, partial.controls);
  }
  if (partial.render) {
    Object.assign(settings.render, partial.render);
  }
  if (partial.composite) {
    Object.assign(settings.composite, partial.composite);
  }
  if (partial.work) {
    Object.assign(settings.work, partial.work);
  }
  if (partial.sky) {
    Object.assign(settings.sky, partial.sky);
  }
  listeners.forEach((listener) => listener(settings));
}

export function resetSettings() {
  setSettings({
    controls: { ...defaultSettings.controls },
    render: { ...defaultSettings.render },
    composite: { ...defaultSettings.composite },
    work: { ...defaultSettings.work },
    sky: { ...defaultSettings.sky },
  });
}

export function subscribeSettings(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
