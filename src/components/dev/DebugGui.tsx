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

      gui = new GUI({ width: 340, title: "Render Debug" });
      gui.domElement.classList.add("debug-gui");

      const view = gui.addFolder("View");
      view
        .add(settings.layers, "debugView", DEBUG_VIEW_OPTIONS)
        .name("Display")
        .onChange((value: DebugView) => setSettings({ layers: { debugView: value } }));
      view.open();

      const layers = gui.addFolder("Layers");
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

      const composite = gui.addFolder("Composite");
      composite
        .addColor(settings.composite, "bgColor")
        .name("Background")
        .onChange((value: string) => setSettings({ composite: { bgColor: value } }));
      composite
        .add(settings.composite, "contrast", 0.5, 2, 0.01)
        .name("Contrast")
        .onChange((value: number) => setSettings({ composite: { contrast: value } }));
      composite
        .add(settings.render, "darken", 0, 1, 0.01)
        .name("Darken")
        .onChange((value: number) => setSettings({ render: { darken: value } }));
      composite
        .add(settings.render, "saturation", 0.2, 2, 0.01)
        .name("Saturation")
        .onChange((value: number) => setSettings({ render: { saturation: value } }));
      composite
        .add(settings.composite, "perlin", 0, 0.5, 0.01)
        .name("Perlin")
        .onChange((value: number) => setSettings({ composite: { perlin: value } }));
      composite
        .add(settings.composite, "fluidStrength", 0, 1, 0.01)
        .name("Fluid Strength")
        .onChange((value: number) => setSettings({ composite: { fluidStrength: value } }));
      composite
        .add(settings.composite, "mediaReveal", 0, 1, 0.01)
        .name("Media Reveal")
        .onChange((value: number) => setSettings({ composite: { mediaReveal: value } }));
      composite
        .add(settings.composite, "enableToneMapping")
        .name("Tone Mapping")
        .onChange((value: boolean) => setSettings({ composite: { enableToneMapping: value } }));
      composite
        .add(settings.composite, "exposure", 0.25, 3, 0.01)
        .name("Exposure")
        .onChange((value: number) => setSettings({ composite: { exposure: value } }));
      composite.open();

      const fog = gui.addFolder("Fog");
      fog
        .add(settings.work, "fogEnabled")
        .name("Enabled")
        .onChange((value: boolean) => setSettings({ work: { fogEnabled: value } }));
      fog
        .addColor(settings.work, "fogColor")
        .name("Color")
        .onChange((value: string) => setSettings({ work: { fogColor: value } }));
      fog
        .add(settings.work, "fogNear", 0, 200, 0.5)
        .name("Near")
        .onChange((value: number) => setSettings({ work: { fogNear: value } }));
      fog
        .add(settings.work, "fogFar", 10, 800, 1)
        .name("Far")
        .onChange((value: number) => setSettings({ work: { fogFar: value } }));
      fog.open();

      const work = gui.addFolder("Work");
      work
        .add(settings.work, "onlyActiveVisible")
        .name("Only Active")
        .onChange((value: boolean) => setSettings({ work: { onlyActiveVisible: value } }));
      work
        .add(settings.work, "ambientIntensity", -2, 2, 0.01)
        .name("Ambient")
        .onChange((value: number) => setSettings({ work: { ambientIntensity: value } }));
      work
        .add(settings.work, "spotIntensity", 0, 400, 1)
        .name("Spot")
        .onChange((value: number) => setSettings({ work: { spotIntensity: value } }));

      const ground = work.addFolder("Ground");
      ground
        .add(settings.work, "groundEnabled")
        .name("Enabled")
        .onChange((value: boolean) => setSettings({ work: { groundEnabled: value } }));
      ground
        .addColor(settings.work, "groundColor")
        .name("Color")
        .onChange((value: string) => setSettings({ work: { groundColor: value } }));
      ground
        .add(settings.work, "groundRoughness", 0, 1, 0.01)
        .name("Roughness")
        .onChange((value: number) => setSettings({ work: { groundRoughness: value } }));
      ground
        .add(settings.work, "groundMetalness", 0, 1, 0.01)
        .name("Metalness")
        .onChange((value: number) => setSettings({ work: { groundMetalness: value } }));
      ground
        .add(settings.work, "groundOpacity", 0, 1, 0.01)
        .name("Opacity")
        .onChange((value: number) => setSettings({ work: { groundOpacity: value } }));
      ground
        .add(settings.work, "groundEnvIntensity", 0, 2, 0.01)
        .name("Env Intensity")
        .onChange((value: number) => setSettings({ work: { groundEnvIntensity: value } }));
      ground
        .add(settings.work, "groundY", -10, 10, 0.01)
        .name("Y")
        .onChange((value: number) => setSettings({ work: { groundY: value } }));
      ground
        .add(settings.work, "groundScale", 0.2, 3, 0.01)
        .name("Scale")
        .onChange((value: number) => setSettings({ work: { groundScale: value } }));
      ground.close();

      const env = work.addFolder("Environment");
      env
        .add(settings.work, "envDarken", 0, 2, 0.01)
        .name("Darken")
        .onChange((value: number) => setSettings({ work: { envDarken: value } }));
      env
        .add(settings.work, "envShader1Alpha", 0, 1, 0.01)
        .name("Shader1 Alpha")
        .onChange((value: number) => setSettings({ work: { envShader1Alpha: value } }));
      env
        .add(settings.work, "envShader1Speed", 0, 2, 0.01)
        .name("Shader1 Speed")
        .onChange((value: number) => setSettings({ work: { envShader1Speed: value } }));
      env
        .add(settings.work, "envShader1Scale", 0, 20, 0.1)
        .name("Shader1 Scale")
        .onChange((value: number) => setSettings({ work: { envShader1Scale: value } }));
      env
        .add(settings.work, "envShader2Alpha", 0, 1, 0.01)
        .name("Shader2 Alpha")
        .onChange((value: number) => setSettings({ work: { envShader2Alpha: value } }));
      env
        .add(settings.work, "envShader2Scale", 0, 20, 0.1)
        .name("Shader2 Scale")
        .onChange((value: number) => setSettings({ work: { envShader2Scale: value } }));
      env
        .add(settings.work, "envShader3Alpha", 0, 1, 0.01)
        .name("Shader3 Alpha")
        .onChange((value: number) => setSettings({ work: { envShader3Alpha: value } }));
      env
        .add(settings.work, "envShader3Speed", 0, 2, 0.01)
        .name("Shader3 Speed")
        .onChange((value: number) => setSettings({ work: { envShader3Speed: value } }));
      env
        .add(settings.work, "envShader3Scale", 0, 20, 0.1)
        .name("Shader3 Scale")
        .onChange((value: number) => setSettings({ work: { envShader3Scale: value } }));
      env
        .add(settings.work, "envShader1Mix3", 0, 3, 0.01)
        .name("Shader1 Mix3")
        .onChange((value: number) => setSettings({ work: { envShader1Mix3: value } }));
      env.close();

      const mouse = work.addFolder("Mouse");
      mouse
        .add(settings.work, "mouseFactor", 0, 1, 0.01)
        .name("Factor")
        .onChange((value: number) => setSettings({ work: { mouseFactor: value } }));
      mouse
        .add(settings.work, "mouseLightness", 0, 2, 0.01)
        .name("Lightness")
        .onChange((value: number) => setSettings({ work: { mouseLightness: value } }));
      mouse
        .add(settings.work, "mouseThickness", 0.01, 0.5, 0.01)
        .name("Thickness")
        .onChange((value: number) => setSettings({ work: { mouseThickness: value } }));
      mouse
        .add(settings.work, "mousePersistance", 0.1, 1, 0.01)
        .name("Persistence")
        .onChange((value: number) => setSettings({ work: { mousePersistance: value } }));
      mouse
        .add(settings.work, "mousePressure", 0, 1, 0.01)
        .name("Pressure")
        .onChange((value: number) => setSettings({ work: { mousePressure: value } }));
      mouse.close();

      work.open();

      const render = gui.addFolder("Render");
      render
        .add(settings.render, "bloomEnabled")
        .name("Bloom Enabled")
        .onChange((value: boolean) => setSettings({ render: { bloomEnabled: value } }));
      render
        .add(settings.render, "bloomStrength", 0, 0.6, 0.01)
        .name("Bloom Strength")
        .onChange((value: number) => setSettings({ render: { bloomStrength: value } }));
      render
        .add(settings.render, "bloomRadius", 0, 2, 0.05)
        .name("Bloom Radius")
        .onChange((value: number) => setSettings({ render: { bloomRadius: value } }));
      render
        .add(settings.render, "luminosityEnabled")
        .name("Luminosity Enabled")
        .onChange((value: boolean) => setSettings({ render: { luminosityEnabled: value } }));
      render
        .add(settings.render, "luminosityThreshold", 0, 1, 0.01)
        .name("Luminosity Threshold")
        .onChange((value: number) => setSettings({ render: { luminosityThreshold: value } }));
      render
        .add(settings.render, "luminositySmoothing", 0, 1, 0.01)
        .name("Luminosity Smoothing")
        .onChange((value: number) => setSettings({ render: { luminositySmoothing: value } }));
      render.close();

      const sky = gui.addFolder("Sky");
      sky
        .add(settings.sky, "shader1Alpha", 0, 1, 0.01)
        .name("Shader1 Alpha")
        .onChange((value: number) => setSettings({ sky: { shader1Alpha: value } }));
      sky
        .add(settings.sky, "shader1Speed", 0, 2, 0.01)
        .name("Shader1 Speed")
        .onChange((value: number) => setSettings({ sky: { shader1Speed: value } }));
      sky
        .add(settings.sky, "shader1Scale", 0, 20, 0.1)
        .name("Shader1 Scale")
        .onChange((value: number) => setSettings({ sky: { shader1Scale: value } }));
      sky
        .add(settings.sky, "shader2Speed", 0, 2, 0.01)
        .name("Shader2 Speed")
        .onChange((value: number) => setSettings({ sky: { shader2Speed: value } }));
      sky
        .add(settings.sky, "shader2Scale", 0, 20, 0.1)
        .name("Shader2 Scale")
        .onChange((value: number) => setSettings({ sky: { shader2Scale: value } }));
      sky
        .add(settings.sky, "shaderMix", 0, 3, 0.01)
        .name("Shader Mix")
        .onChange((value: number) => setSettings({ sky: { shaderMix: value } }));
      sky.close();

      const controls = gui.addFolder("Controls");
      controls
        .add(settings.controls, "stepVelocity", 0.01, 1, 0.01)
        .name("Step Velocity")
        .onChange((value: number) => setSettings({ controls: { stepVelocity: value } }));
      controls
        .add(settings.controls, "stepDistance", 0.001, 0.05, 0.001)
        .name("Step Distance")
        .onChange((value: number) => setSettings({ controls: { stepDistance: value } }));
      controls
        .add(settings.controls, "stepCooldown", 0.05, 1.2, 0.05)
        .name("Step Cooldown")
        .onChange((value: number) => setSettings({ controls: { stepCooldown: value } }));
      controls
        .add(settings.controls, "stepDuration", 0.2, 1.6, 0.05)
        .name("Step Duration")
        .onChange((value: number) => setSettings({ controls: { stepDuration: value } }));
      controls
        .add(settings.controls, "settleThreshold", 0.0005, 0.02, 0.0005)
        .name("Settle Threshold")
        .onChange((value: number) => setSettings({ controls: { settleThreshold: value } }));
      controls
        .add(settings.controls, "unlockVelocity", 0.005, 0.2, 0.005)
        .name("Unlock Velocity")
        .onChange((value: number) => setSettings({ controls: { unlockVelocity: value } }));
      controls
        .add(settings.controls, "lockScroll")
        .name("Lock Scroll")
        .onChange((value: boolean) => setSettings({ controls: { lockScroll: value } }));
      controls
        .add(settings.controls, "wheelThreshold", 40, 400, 10)
        .name("Wheel Threshold")
        .onChange((value: number) => setSettings({ controls: { wheelThreshold: value } }));
      controls.close();

      gui.add({ reset: () => resetSettings() }, "reset").name("Reset All");
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
