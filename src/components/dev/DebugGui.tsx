"use client";

import { useEffect } from "react";
import {
  getSettings,
  resetSettings,
  setSettings,
} from "../../experience/settings";

// DebugGui 组件：
// 一个用于调整体验参数的调试界面，基于 lil-gui 库。
// 仅在开发环境或需要实时调整参数时使用。
// 它可以控制交互、渲染、合成等各个方面的参数。
export function DebugGui() {
  useEffect(() => {
    let gui: import("lil-gui").GUI | null = null;
    let hidden = false;
    let disposed = false;

    const setup = async () => {
      // 动态导入 lil-gui，避免在生产构建中包含不必要的代码（如果构建工具有做相关优化）
      const { GUI } = await import("lil-gui");
      if (disposed) return;
      const settings = getSettings();
      gui = new GUI({ width: 320, title: "DEBUG" });
      gui.domElement.classList.add("debug-gui");

      // 交互控制参数文件夹
      const controls = gui.addFolder("Interaction");
      controls
        .add(settings.controls, "stepVelocity", 0.01, 1, 0.01) // 步进速度
        .onChange((value: number) => setSettings({ controls: {
          stepVelocity: value,
          stepDistance: 0,
          stepCooldown: 0,
          stepDuration: 0,
          settleThreshold: 0,
          unlockVelocity: 0,
          lockScroll: false,
          wheelThreshold: 0
        } }));
      controls
        .add(settings.controls, "stepDistance", 0.001, 0.05, 0.001) // 步进距离
        .onChange((value: number) => setSettings({ controls: {
          stepDistance: value,
          stepVelocity: 0,
          stepCooldown: 0,
          stepDuration: 0,
          settleThreshold: 0,
          unlockVelocity: 0,
          lockScroll: false,
          wheelThreshold: 0
        } }));
      controls
        .add(settings.controls, "stepCooldown", 0.05, 1.2, 0.05) // 步进冷却时间
        .onChange((value: number) => setSettings({ controls: {
          stepCooldown: value,
          stepVelocity: 0,
          stepDistance: 0,
          stepDuration: 0,
          settleThreshold: 0,
          unlockVelocity: 0,
          lockScroll: false,
          wheelThreshold: 0
        } }));
      controls
        .add(settings.controls, "stepDuration", 0.2, 1.6, 0.05) // 步进持续时间
        .onChange((value: number) => setSettings({ controls: {
          stepDuration: value,
          stepVelocity: 0,
          stepDistance: 0,
          stepCooldown: 0,
          settleThreshold: 0,
          unlockVelocity: 0,
          lockScroll: false,
          wheelThreshold: 0
        } }));
      controls
        .add(settings.controls, "settleThreshold", 0.0005, 0.02, 0.0005) // 稳定阈值
        .onChange((value: number) => setSettings({ controls: {
          settleThreshold: value,
          stepVelocity: 0,
          stepDistance: 0,
          stepCooldown: 0,
          stepDuration: 0,
          unlockVelocity: 0,
          lockScroll: false,
          wheelThreshold: 0
        } }));
      controls
        .add(settings.controls, "unlockVelocity", 0.005, 0.2, 0.005) // 解锁速度
        .onChange((value: number) => setSettings({ controls: {
          unlockVelocity: value,
          stepVelocity: 0,
          stepDistance: 0,
          stepCooldown: 0,
          stepDuration: 0,
          settleThreshold: 0,
          lockScroll: false,
          wheelThreshold: 0
        } }));
      controls
        .add(settings.controls, "lockScroll") // 是否锁定滚动
        .onChange((value: boolean) => setSettings({ controls: {
          lockScroll: value,
          stepVelocity: 0,
          stepDistance: 0,
          stepCooldown: 0,
          stepDuration: 0,
          settleThreshold: 0,
          unlockVelocity: 0,
          wheelThreshold: 0
        } }));
      controls
        .add(settings.controls, "wheelThreshold", 40, 400, 10) // 滚轮阈值
        .onChange((value: number) => setSettings({ controls: {
          wheelThreshold: value,
          stepVelocity: 0,
          stepDistance: 0,
          stepCooldown: 0,
          stepDuration: 0,
          settleThreshold: 0,
          unlockVelocity: 0,
          lockScroll: false
        } }));
      controls.open();

      // 渲染参数文件夹
      const render = gui.addFolder("Render");
      render
        .add(settings.render, "darken", 0, 1, 0.01) // 变暗程度
        .onChange((value: number) => setSettings({ render: {
          darken: value,
          saturation: 0,
          bloomEnabled: false,
          bloomStrength: 0,
          bloomRadius: 0,
          luminosityEnabled: false,
          luminosityThreshold: 0,
          luminositySmoothing: 0
        } }));
      render
        .add(settings.render, "saturation", 0.4, 2, 0.05) // 饱和度
        .onChange((value: number) => setSettings({ render: {
          saturation: value,
          darken: 0,
          bloomEnabled: false,
          bloomStrength: 0,
          bloomRadius: 0,
          luminosityEnabled: false,
          luminosityThreshold: 0,
          luminositySmoothing: 0
        } }));
      render
        .add(settings.render, "bloomStrength", 0, 0.6, 0.01) // 泛光强度
        .onChange((value: number) => setSettings({ render: {
          bloomStrength: value,
          darken: 0,
          saturation: 0,
          bloomEnabled: false,
          bloomRadius: 0,
          luminosityEnabled: false,
          luminosityThreshold: 0,
          luminositySmoothing: 0
        } }));
      render
        .add(settings.render, "bloomRadius", 0, 2, 0.05) // 泛光半径
        .onChange((value: number) => setSettings({ render: {
          bloomRadius: value,
          darken: 0,
          saturation: 0,
          bloomEnabled: false,
          bloomStrength: 0,
          luminosityEnabled: false,
          luminosityThreshold: 0,
          luminositySmoothing: 0
        } }));
      render
        .add(settings.render, "bloomEnabled") // 启用泛光
        .onChange((value: boolean) => setSettings({ render: {
          bloomEnabled: value,
          darken: 0,
          saturation: 0,
          bloomStrength: 0,
          bloomRadius: 0,
          luminosityEnabled: false,
          luminosityThreshold: 0,
          luminositySmoothing: 0
        } }));
      render
        .add(settings.render, "luminosityEnabled") // 启用亮度处理
        .onChange((value: boolean) => setSettings({ render: {
          luminosityEnabled: value,
          darken: 0,
          saturation: 0,
          bloomEnabled: false,
          bloomStrength: 0,
          bloomRadius: 0,
          luminosityThreshold: 0,
          luminositySmoothing: 0
        } }));
      render
        .add(settings.render, "luminosityThreshold", 0, 1, 0.01) // 亮度阈值
        .onChange((value: number) =>
          setSettings({ render: {
            luminosityThreshold: value,
            darken: 0,
            saturation: 0,
            bloomEnabled: false,
            bloomStrength: 0,
            bloomRadius: 0,
            luminosityEnabled: false,
            luminositySmoothing: 0
          } })
        );
      render
        .add(settings.render, "luminositySmoothing", 0, 1, 0.01) // 亮度平滑
        .onChange((value: number) =>
          setSettings({ render: {
            luminositySmoothing: value,
            darken: 0,
            saturation: 0,
            bloomEnabled: false,
            bloomStrength: 0,
            bloomRadius: 0,
            luminosityEnabled: false,
            luminosityThreshold: 0
          } })
        );

      // 合成参数文件夹
      const composite = gui.addFolder("Composite");
      composite
        .add(settings.composite, "contrast", 0.5, 2, 0.05) // 对比度
        .onChange((value: number) => setSettings({ composite: {
          contrast: value,
          perlin: 0,
          fluidStrength: 0,
          mediaReveal: 0,
          bgColor: "",
          mistStrength: 0
        } }));
      composite
        .add(settings.composite, "perlin", 0, 0.5, 0.01) // 柏林噪声强度
        .onChange((value: number) => setSettings({ composite: {
          perlin: value,
          contrast: 0,
          fluidStrength: 0,
          mediaReveal: 0,
          bgColor: "",
          mistStrength: 0
        } }));
      composite
        .add(settings.composite, "fluidStrength", 0, 1, 0.01) // 流体效果强度
        .onChange((value: number) =>
          setSettings({ composite: {
            fluidStrength: value,
            contrast: 0,
            perlin: 0,
            mediaReveal: 0,
            bgColor: "",
            mistStrength: 0
          } })
        );
      composite
        .add(settings.composite, "mediaReveal", 0, 1, 0.01) // 媒体揭示进度
        .onChange((value: number) =>
          setSettings({ composite: {
            mediaReveal: value,
            contrast: 0,
            perlin: 0,
            fluidStrength: 0,
            bgColor: "",
            mistStrength: 0
          } })
        );
      composite
        .add(settings.composite, "mistStrength", 0, 1, 0.01) // 雾气强度
        .onChange((value: number) =>
          setSettings({ composite: {
            mistStrength: value,
            contrast: 0,
            perlin: 0,
            fluidStrength: 0,
            mediaReveal: 0,
            bgColor: ""
          } })
        );
      composite
        .addColor(settings.composite, "bgColor")
        .onChange((value: string) => setSettings({ composite: {
          bgColor: value,
          contrast: 0,
          perlin: 0,
          fluidStrength: 0,
          mediaReveal: 0,
          mistStrength: 0
        } }));

      const work = gui.addFolder("Work Scene");
      work
        .add(settings.work, "onlyActiveVisible")
        .onChange((value: boolean) =>
          setSettings({ work: {
            onlyActiveVisible: value,
            ambientIntensity: 0,
            spotIntensity: 0,
            fogEnabled: false,
            fogColor: "",
            fogDensity: 0,
            groundEnabled: false,
            groundColor: "",
            groundRoughness: 0,
            groundMetalness: 0,
            groundOpacity: 0,
            groundEnvIntensity: 0,
            groundY: 0,
            groundScale: 0,
            mouseFactor: 0,
            mouseLightness: 0,
            mouseThickness: 0,
            mousePersistance: 0,
            mousePressure: 0
          } })
        );
      work
        .add(settings.work, "fogEnabled")
        .onChange((value: boolean) => setSettings({ work: {
          fogEnabled: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogColor: "",
          fogDensity: 0,
          groundEnabled: false,
          groundColor: "",
          groundRoughness: 0,
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));
      work
        .addColor(settings.work, "fogColor")
        .onChange((value: string) => setSettings({ work: {
          fogColor: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogDensity: 0,
          groundEnabled: false,
          groundColor: "",
          groundRoughness: 0,
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));
      work
        .add(settings.work, "fogDensity", 0.0, 0.2, 0.005)
        .onChange((value: number) => setSettings({ work: {
          fogDensity: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          groundEnabled: false,
          groundColor: "",
          groundRoughness: 0,
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));
      work
        .add(settings.work, "mouseFactor", 0, 4, 0.05)
        .onChange((value: number) => setSettings({ work: {
          mouseFactor: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          fogDensity: 0,
          groundEnabled: false,
          groundColor: "",
          groundRoughness: 0,
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));
      work
        .add(settings.work, "mouseLightness", 0, 1, 0.05)
        .onChange((value: number) => setSettings({ work: {
          mouseLightness: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          fogDensity: 0,
          groundEnabled: false,
          groundColor: "",
          groundRoughness: 0,
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseThickness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));
      work
        .add(settings.work, "mouseThickness", 0.05, 0.6, 0.01)
        .onChange((value: number) => setSettings({ work: {
          mouseThickness: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          fogDensity: 0,
          groundEnabled: false,
          groundColor: "",
          groundRoughness: 0,
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));
      work
        .add(settings.work, "mousePersistance", 0.2, 0.98, 0.01)
        .onChange((value: number) => setSettings({ work: {
          mousePersistance: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          fogDensity: 0,
          groundEnabled: false,
          groundColor: "",
          groundRoughness: 0,
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePressure: 0
        } }));
      work
        .add(settings.work, "mousePressure", 0.2, 2, 0.05)
        .onChange((value: number) => setSettings({ work: {
          mousePressure: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          fogDensity: 0,
          groundEnabled: false,
          groundColor: "",
          groundRoughness: 0,
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePersistance: 0
        } }));
      work
        .add(settings.work, "ambientIntensity", 0, 10, 0.1)
        .onChange((value: number) =>
          setSettings({ work: {
            ambientIntensity: value,
            onlyActiveVisible: false,
            spotIntensity: 0,
            fogEnabled: false,
            fogColor: "",
            fogDensity: 0,
            groundEnabled: false,
            groundColor: "",
            groundRoughness: 0,
            groundMetalness: 0,
            groundOpacity: 0,
            groundEnvIntensity: 0,
            groundY: 0,
            groundScale: 0,
            mouseFactor: 0,
            mouseLightness: 0,
            mouseThickness: 0,
            mousePersistance: 0,
            mousePressure: 0
          } })
        );
      work
        .add(settings.work, "spotIntensity", 0, 1200, 10)
        .onChange((value: number) =>
          setSettings({ work: {
            spotIntensity: value,
            onlyActiveVisible: false,
            ambientIntensity: 0,
            fogEnabled: false,
            fogColor: "",
            fogDensity: 0,
            groundEnabled: false,
            groundColor: "",
            groundRoughness: 0,
            groundMetalness: 0,
            groundOpacity: 0,
            groundEnvIntensity: 0,
            groundY: 0,
            groundScale: 0,
            mouseFactor: 0,
            mouseLightness: 0,
            mouseThickness: 0,
            mousePersistance: 0,
            mousePressure: 0
          } })
        );
      work
        .add(settings.work, "groundEnabled")
        .onChange((value: boolean) => setSettings({ work: {
          groundEnabled: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          fogDensity: 0,
          groundColor: "",
          groundRoughness: 0,
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));
      work
        .addColor(settings.work, "groundColor")
        .onChange((value: string) => setSettings({ work: {
          groundColor: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          fogDensity: 0,
          groundEnabled: false,
          groundRoughness: 0,
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));
      work
        .add(settings.work, "groundRoughness", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ work: {
          groundRoughness: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          fogDensity: 0,
          groundEnabled: false,
          groundColor: "",
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));
      work
        .add(settings.work, "groundMetalness", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ work: {
          groundMetalness: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          fogDensity: 0,
          groundEnabled: false,
          groundColor: "",
          groundRoughness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));
      work
        .add(settings.work, "groundOpacity", 0, 1, 0.01)
        .onChange((value: number) => setSettings({ work: {
          groundOpacity: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          fogDensity: 0,
          groundEnabled: false,
          groundColor: "",
          groundRoughness: 0,
          groundMetalness: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));
      work
        .add(settings.work, "groundEnvIntensity", 0, 3, 0.05)
        .onChange((value: number) =>
          setSettings({ work: {
            groundEnvIntensity: value,
            onlyActiveVisible: false,
            ambientIntensity: 0,
            spotIntensity: 0,
            fogEnabled: false,
            fogColor: "",
            fogDensity: 0,
            groundEnabled: false,
            groundColor: "",
            groundRoughness: 0,
            groundMetalness: 0,
            groundOpacity: 0,
            groundY: 0,
            groundScale: 0,
            mouseFactor: 0,
            mouseLightness: 0,
            mouseThickness: 0,
            mousePersistance: 0,
            mousePressure: 0
          } })
        );
      work
        .add(settings.work, "groundY", -10, 2, 0.1)
        .onChange((value: number) => setSettings({ work: {
          groundY: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          fogDensity: 0,
          groundEnabled: false,
          groundColor: "",
          groundRoughness: 0,
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundScale: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));
      work
        .add(settings.work, "groundScale", 0.5, 3, 0.1)
        .onChange((value: number) => setSettings({ work: {
          groundScale: value,
          onlyActiveVisible: false,
          ambientIntensity: 0,
          spotIntensity: 0,
          fogEnabled: false,
          fogColor: "",
          fogDensity: 0,
          groundEnabled: false,
          groundColor: "",
          groundRoughness: 0,
          groundMetalness: 0,
          groundOpacity: 0,
          groundEnvIntensity: 0,
          groundY: 0,
          mouseFactor: 0,
          mouseLightness: 0,
          mouseThickness: 0,
          mousePersistance: 0,
          mousePressure: 0
        } }));

      gui.add({ reset: () => resetSettings() }, "reset");
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "`" || (event.key.toLowerCase() === "g" && event.shiftKey)) {
        if (!gui) return;
        hidden = !hidden;
        gui.domElement.style.display = hidden ? "none" : "block";
      }
    };

    setup();
    window.addEventListener("keydown", handleKey);

    return () => {
      disposed = true;
      window.removeEventListener("keydown", handleKey);
      if (gui) {
        gui.destroy();
      }
    };
  }, []);

  return null;
}
