"use client";

import { useEffect } from "react";
import { getSettings, resetSettings, setSettings } from "../../experience/settings";
import type { DebugView } from "../../experience/settings";

const DEBUG_VIEW_OPTIONS: Record<string, DebugView> = {
  Final: "final",
  Work: "work",
  Media: "media",
  Bloom: "bloom",
  Mouse: "mouse",
  Fluid: "fluid",
  Noise: "noise",
  Perlin: "perlin",
  Background: "bg",
  Sky: "sky",
  Thumb: "thumb",
};

export function DebugGui() {
  useEffect(() => {
    let gui: import("lil-gui").GUI | null = null;
    let disposed = false;

    const setup = async () => {
      const { GUI } = await import("lil-gui");
      if (disposed) return;
      const settings = getSettings();

      gui = new GUI({ width: 300, title: "Debug View" });
      gui.domElement.classList.add("debug-gui");

      const view = gui.addFolder("View");
      view
        .add(settings.layers, "debugView", DEBUG_VIEW_OPTIONS)
        .name("Display")
        .onChange((value: DebugView) => setSettings({ layers: { debugView: value } }));
      view.open();

      const layers = gui.addFolder("Layer Masks");
      layers
        .add(settings.layers, "showWork")
        .name("Work")
        .onChange((value: boolean) => setSettings({ layers: { showWork: value } }));
      layers
        .add(settings.layers, "showMedia")
        .name("Media")
        .onChange((value: boolean) => setSettings({ layers: { showMedia: value } }));
      layers
        .add(settings.layers, "showBloom")
        .name("Bloom")
        .onChange((value: boolean) => setSettings({ layers: { showBloom: value } }));
      layers
        .add(settings.layers, "showMouse")
        .name("Mouse")
        .onChange((value: boolean) => setSettings({ layers: { showMouse: value } }));
      layers
        .add(settings.layers, "showFluid")
        .name("Fluid")
        .onChange((value: boolean) => setSettings({ layers: { showFluid: value } }));
      layers.open();

      gui.add({ reset: () => resetSettings() }, "reset").name("Reset");
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
