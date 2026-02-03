export type ExperienceSettings = {
  controls: {
    stepVelocity: number;
    stepDistance: number;
    stepCooldown: number;
    stepDuration: number;
    settleThreshold: number;
    unlockVelocity: number;
    lockScroll: boolean;
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
    fogDensity: number;
    groundEnabled: boolean;
    groundColor: string;
    groundRoughness: number;
    groundMetalness: number;
    groundOpacity: number;
    groundEnvIntensity: number;
    groundY: number;
    groundScale: number;
    mouseFactor: number;
    mouseLightness: number;
    mouseThickness: number;
    mousePersistance: number;
    mousePressure: number;
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
  },
  render: {
    darken: 0,
    saturation: 1,
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
    fluidStrength: 0.5,
    mediaReveal: 0,
    bgColor: "#1f1f1f",
  },
  work: {
    onlyActiveVisible: true,
    ambientIntensity: 4.6,
    spotIntensity: 520,
    fogEnabled: true,
    fogColor: "#1a1a1a",
    fogDensity: 0.065,
    groundEnabled: true,
    groundColor: "#0f0f0f",
    groundRoughness: 0.55,
    groundMetalness: 0.2,
    groundOpacity: 0.65,
    groundEnvIntensity: 0.8,
    groundY: -3.6,
    groundScale: 1,
    mouseFactor: 1.4,
    mouseLightness: 0.6,
    mouseThickness: 0.25,
    mousePersistance: 0.75,
    mousePressure: 1,
  },
};

const settings: ExperienceSettings = {
  controls: { ...defaultSettings.controls },
  render: { ...defaultSettings.render },
  composite: { ...defaultSettings.composite },
  work: { ...defaultSettings.work },
};

type Listener = (value: ExperienceSettings) => void;

const listeners = new Set<Listener>();

export function getSettings() {
  return settings;
}

export function setSettings(partial: Partial<ExperienceSettings>) {
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
  listeners.forEach((listener) => listener(settings));
}

export function resetSettings() {
  setSettings({
    controls: { ...defaultSettings.controls },
    render: { ...defaultSettings.render },
    composite: { ...defaultSettings.composite },
    work: { ...defaultSettings.work },
  });
}

export function subscribeSettings(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
