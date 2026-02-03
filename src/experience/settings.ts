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
    settings.controls = { ...settings.controls, ...partial.controls };
  }
  if (partial.render) {
    settings.render = { ...settings.render, ...partial.render };
  }
  if (partial.composite) {
    settings.composite = { ...settings.composite, ...partial.composite };
  }
  if (partial.work) {
    settings.work = { ...settings.work, ...partial.work };
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
