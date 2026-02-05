"use client";

import { useEffect } from "react";
import { getSettings, resetSettings, setSettings } from "../../experience/settings";

export function DebugGui() {
  useEffect(() => {
    let gui: import("lil-gui").GUI | null = null;
    let disposed = false;

    const setup = async () => {
      const { GUI } = await import("lil-gui");
      if (disposed) return;
      const settings = getSettings();

      gui = new GUI({ width: 320, title: "DEBUG" });
      gui.domElement.classList.add("debug-gui");

      const controls = gui.addFolder("Interaction");
      controls
        .add(settings.controls, "stepVelocity", 0.01, 1, 0.01)
        .onChange((value: number) => setSettings({ controls: { stepVelocity: value } }));
      controls
        .add(settings.controls, "stepDistance", 0.001, 0.05, 0.001)
        .onChange((value: number) => setSettings({ controls: { stepDistance: value } }));
      controls
        .add(settings.controls, "stepCooldown", 0.05, 1.2, 0.05)
        .onChange((value: number) => setSettings({ controls: { stepCooldown: value } }));
      controls
        .add(settings.controls, "stepDuration", 0.2, 1.6, 0.05)
        .onChange((value: number) => setSettings({ controls: { stepDuration: value } }));
      controls
        .add(settings.controls, "settleThreshold", 0.0005, 0.02, 0.0005)
        .onChange((value: number) => setSettings({ controls: { settleThreshold: value } }));
      controls
        .add(settings.controls, "unlockVelocity", 0.005, 0.2, 0.005)
        .onChange((value: number) => setSettings({ controls: { unlockVelocity: value } }));
      controls
        .add(settings.controls, "lockScroll")
        .onChange((value: boolean) => setSettings({ controls: { lockScroll: value } }));
      controls
        .add(settings.controls, "wheelThreshold", 40, 400, 10)
        .onChange((value: number) => setSettings({ controls: { wheelThreshold: value } }));
      controls.open();

      const render = gui.addFolder("Render");
      render
        .add(settings.render, "darken", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ render: { darken: value } }));
      render
        .add(settings.render, "saturation", 0.4, 2, 0.05)
        .onChange((value: number) => setSettings({ render: { saturation: value } }));
      render
        .add(settings.render, "bloomStrength", 0, 0.6, 0.01)
        .onChange((value: number) => setSettings({ render: { bloomStrength: value } }));
      render
        .add(settings.render, "bloomRadius", 0, 2, 0.05)
        .onChange((value: number) => setSettings({ render: { bloomRadius: value } }));
      render
        .add(settings.render, "bloomEnabled")
        .onChange((value: boolean) => setSettings({ render: { bloomEnabled: value } }));
      render
        .add(settings.render, "luminosityEnabled")
        .onChange((value: boolean) => setSettings({ render: { luminosityEnabled: value } }));
      render
        .add(settings.render, "luminosityThreshold", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ render: { luminosityThreshold: value } }));
      render
        .add(settings.render, "luminositySmoothing", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ render: { luminositySmoothing: value } }));
      render
        .add(settings.render, "toneMapping", ["ACES", "Filmic", "Reinhard", "None"])
        .onChange((value: "ACES" | "Filmic" | "Reinhard" | "None") =>
          setSettings({ render: { toneMapping: value } })
        );
      render
        .add(settings.render, "toneMappingExposure", 0.1, 2.5, 0.05)
        .onChange((value: number) => setSettings({ render: { toneMappingExposure: value } }));
      render
        .add(settings.render, "outputColorSpace", ["SRGB", "Linear"])
        .onChange((value: "SRGB" | "Linear") =>
          setSettings({ render: { outputColorSpace: value } })
        );
      render
        .add(settings.render, "debugBloom")
        .onChange((value: boolean) => setSettings({ render: { debugBloom: value } }));

      const composite = gui.addFolder("Composite");
      composite
        .add(settings.composite, "contrast", 0.5, 2, 0.05)
        .onChange((value: number) => setSettings({ composite: { contrast: value } }));
      composite
        .add(settings.composite, "perlin", 0, 0.5, 0.01)
        .onChange((value: number) => setSettings({ composite: { perlin: value } }));
      composite
        .add(settings.composite, "fluidStrength", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ composite: { fluidStrength: value } }));
      composite
        .add(settings.composite, "mediaReveal", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ composite: { mediaReveal: value } }));
      composite
        .addColor(settings.composite, "bgColor")
        .onChange((value: string) => setSettings({ composite: { bgColor: value } }));

      const work = gui.addFolder("Work Scene");
      work
        .add(settings.work, "onlyActiveVisible")
        .onChange((value: boolean) => setSettings({ work: { onlyActiveVisible: value } }));
      work
        .add(settings.work, "fogEnabled")
        .onChange((value: boolean) => setSettings({ work: { fogEnabled: value } }));
      work
        .addColor(settings.work, "fogColor")
        .onChange((value: string) => setSettings({ work: { fogColor: value } }));
      work
        .add(settings.work, "fogNear", 0, 200, 1)
        .onChange((value: number) => setSettings({ work: { fogNear: value } }));
      work
        .add(settings.work, "fogFar", 10, 400, 1)
        .onChange((value: number) => setSettings({ work: { fogFar: value } }));
      work
        .add(settings.work, "ambientIntensity", -2, 2, 0.05)
        .onChange((value: number) => setSettings({ work: { ambientIntensity: value } }));
      work
        .add(settings.work, "spotIntensity", 0, 300, 1)
        .onChange((value: number) => setSettings({ work: { spotIntensity: value } }));
      work
        .add(settings.work, "groundEnabled")
        .onChange((value: boolean) => setSettings({ work: { groundEnabled: value } }));
      work
        .addColor(settings.work, "groundColor")
        .onChange((value: string) => setSettings({ work: { groundColor: value } }));
      work
        .add(settings.work, "groundRoughness", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ work: { groundRoughness: value } }));
      work
        .add(settings.work, "groundMetalness", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ work: { groundMetalness: value } }));
      work
        .add(settings.work, "groundOpacity", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ work: { groundOpacity: value } }));
      work
        .add(settings.work, "groundEnvIntensity", 0, 2, 0.01)
        .onChange((value: number) => setSettings({ work: { groundEnvIntensity: value } }));
      work
        .add(settings.work, "groundY", -5, 5, 0.01)
        .onChange((value: number) => setSettings({ work: { groundY: value } }));
      work
        .add(settings.work, "groundScale", 0.2, 3, 0.01)
        .onChange((value: number) => setSettings({ work: { groundScale: value } }));
      work
        .addColor(settings.work, "envTint")
        .onChange((value: string) => setSettings({ work: { envTint: value } }));
      work
        .add(settings.work, "mouseFactor", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ work: { mouseFactor: value } }));
      work
        .add(settings.work, "mouseLightness", 0, 2, 0.01)
        .onChange((value: number) => setSettings({ work: { mouseLightness: value } }));
      work
        .add(settings.work, "mouseThickness", 0.01, 0.5, 0.01)
        .onChange((value: number) => setSettings({ work: { mouseThickness: value } }));
      work
        .add(settings.work, "mousePersistance", 0.1, 1, 0.01)
        .onChange((value: number) => setSettings({ work: { mousePersistance: value } }));
      work
        .add(settings.work, "mousePressure", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ work: { mousePressure: value } }));

      gui.add({ reset: () => resetSettings() }, "reset");
    };

    setup();

    return () => {
      disposed = true;
      gui?.destroy();
      gui = null;
    };
  }, []);

  return null;
}
