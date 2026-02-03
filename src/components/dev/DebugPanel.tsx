"use client";

import { useEffect, useState } from "react";
import {
  getSettings,
  resetSettings,
  setSettings,
  subscribeSettings,
} from "../../experience/settings";

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [settings, setSettingsState] = useState(getSettings());

  useEffect(() => subscribeSettings(setSettingsState), []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "`" || (event.key.toLowerCase() === "g" && event.shiftKey)) {
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!open) return null;

  const update = (partial: Parameters<typeof setSettings>[0]) => setSettings(partial);

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <div className="debug-panel-title">DEBUG</div>
        <div className="debug-panel-actions">
          <button className="debug-panel-btn" onClick={() => resetSettings()}>
            Reset
          </button>
          <button className="debug-panel-btn" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </div>

      <div className="debug-panel-section">
        <div className="debug-panel-section-title">Interaction</div>
        <label className="debug-panel-field">
          <span>Step Velocity</span>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={settings.controls.stepVelocity}
            onChange={(e) =>
              update({
                controls: { ...settings.controls, stepVelocity: Number(e.target.value) },
              })
            }
          />
          <span>{settings.controls.stepVelocity.toFixed(2)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Step Distance</span>
          <input
            type="range"
            min="0.001"
            max="0.05"
            step="0.001"
            value={settings.controls.stepDistance}
            onChange={(e) =>
              update({
                controls: { ...settings.controls, stepDistance: Number(e.target.value) },
              })
            }
          />
          <span>{settings.controls.stepDistance.toFixed(3)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Step Cooldown</span>
          <input
            type="range"
            min="0.05"
            max="1.2"
            step="0.05"
            value={settings.controls.stepCooldown}
            onChange={(e) =>
              update({
                controls: { ...settings.controls, stepCooldown: Number(e.target.value) },
              })
            }
          />
          <span>{settings.controls.stepCooldown.toFixed(2)}s</span>
        </label>
        <label className="debug-panel-field">
          <span>Step Duration</span>
          <input
            type="range"
            min="0.2"
            max="1.6"
            step="0.05"
            value={settings.controls.stepDuration}
            onChange={(e) =>
              update({
                controls: { ...settings.controls, stepDuration: Number(e.target.value) },
              })
            }
          />
          <span>{settings.controls.stepDuration.toFixed(2)}s</span>
        </label>
        <label className="debug-panel-field">
          <span>Settle Threshold</span>
          <input
            type="range"
            min="0.0005"
            max="0.02"
            step="0.0005"
            value={settings.controls.settleThreshold}
            onChange={(e) =>
              update({
                controls: { ...settings.controls, settleThreshold: Number(e.target.value) },
              })
            }
          />
          <span>{settings.controls.settleThreshold.toFixed(4)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Unlock Velocity</span>
          <input
            type="range"
            min="0.005"
            max="0.2"
            step="0.005"
            value={settings.controls.unlockVelocity}
            onChange={(e) =>
              update({
                controls: { ...settings.controls, unlockVelocity: Number(e.target.value) },
              })
            }
          />
          <span>{settings.controls.unlockVelocity.toFixed(3)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Lock Scroll</span>
          <input
            type="checkbox"
            checked={settings.controls.lockScroll}
            onChange={(e) =>
              update({
                controls: { ...settings.controls, lockScroll: e.target.checked },
              })
            }
          />
        </label>
      </div>

      <div className="debug-panel-section">
        <div className="debug-panel-section-title">Render</div>
        <label className="debug-panel-field">
          <span>Darken</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.render.darken}
            onChange={(e) =>
              update({ render: { ...settings.render, darken: Number(e.target.value) } })
            }
          />
          <span>{settings.render.darken.toFixed(2)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Saturation</span>
          <input
            type="range"
            min="0.4"
            max="2"
            step="0.05"
            value={settings.render.saturation}
            onChange={(e) =>
              update({
                render: { ...settings.render, saturation: Number(e.target.value) },
              })
            }
          />
          <span>{settings.render.saturation.toFixed(2)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Bloom Strength</span>
          <input
            type="range"
            min="0"
            max="0.6"
            step="0.01"
            value={settings.render.bloomStrength}
            onChange={(e) =>
              update({
                render: { ...settings.render, bloomStrength: Number(e.target.value) },
              })
            }
          />
          <span>{settings.render.bloomStrength.toFixed(2)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Bloom Radius</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={settings.render.bloomRadius}
            onChange={(e) =>
              update({
                render: { ...settings.render, bloomRadius: Number(e.target.value) },
              })
            }
          />
          <span>{settings.render.bloomRadius.toFixed(2)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Bloom Enabled</span>
          <input
            type="checkbox"
            checked={settings.render.bloomEnabled}
            onChange={(e) =>
              update({
                render: { ...settings.render, bloomEnabled: e.target.checked },
              })
            }
          />
        </label>
        <label className="debug-panel-field">
          <span>Luminosity Enabled</span>
          <input
            type="checkbox"
            checked={settings.render.luminosityEnabled}
            onChange={(e) =>
              update({
                render: { ...settings.render, luminosityEnabled: e.target.checked },
              })
            }
          />
        </label>
        <label className="debug-panel-field">
          <span>Luminosity Threshold</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.render.luminosityThreshold}
            onChange={(e) =>
              update({
                render: {
                  ...settings.render,
                  luminosityThreshold: Number(e.target.value),
                },
              })
            }
          />
          <span>{settings.render.luminosityThreshold.toFixed(2)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Luminosity Smoothing</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.render.luminositySmoothing}
            onChange={(e) =>
              update({
                render: {
                  ...settings.render,
                  luminositySmoothing: Number(e.target.value),
                },
              })
            }
          />
          <span>{settings.render.luminositySmoothing.toFixed(2)}</span>
        </label>
      </div>

      <div className="debug-panel-section">
        <div className="debug-panel-section-title">Composite</div>
        <label className="debug-panel-field">
          <span>Contrast</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={settings.composite.contrast}
            onChange={(e) =>
              update({
                composite: { ...settings.composite, contrast: Number(e.target.value) },
              })
            }
          />
          <span>{settings.composite.contrast.toFixed(2)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Perlin</span>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.01"
            value={settings.composite.perlin}
            onChange={(e) =>
              update({
                composite: { ...settings.composite, perlin: Number(e.target.value) },
              })
            }
          />
          <span>{settings.composite.perlin.toFixed(2)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Fluid Strength</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.composite.fluidStrength}
            onChange={(e) =>
              update({
                composite: { ...settings.composite, fluidStrength: Number(e.target.value) },
              })
            }
          />
          <span>{settings.composite.fluidStrength.toFixed(2)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Media Reveal</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.composite.mediaReveal}
            onChange={(e) =>
              update({
                composite: { ...settings.composite, mediaReveal: Number(e.target.value) },
              })
            }
          />
          <span>{settings.composite.mediaReveal.toFixed(2)}</span>
        </label>
        <label className="debug-panel-field">
          <span>BG Color</span>
          <input
            type="color"
            value={settings.composite.bgColor}
            onChange={(e) =>
              update({
                composite: { ...settings.composite, bgColor: e.target.value },
              })
            }
          />
        </label>
      </div>

      <div className="debug-panel-section">
        <div className="debug-panel-section-title">Work Scene</div>
        <label className="debug-panel-field">
          <span>Only Active Visible</span>
          <input
            type="checkbox"
            checked={settings.work.onlyActiveVisible}
            onChange={(e) =>
              update({
                work: { ...settings.work, onlyActiveVisible: e.target.checked },
              })
            }
          />
        </label>
        <label className="debug-panel-field">
          <span>Ambient Intensity</span>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={settings.work.ambientIntensity}
            onChange={(e) =>
              update({
                work: { ...settings.work, ambientIntensity: Number(e.target.value) },
              })
            }
          />
          <span>{settings.work.ambientIntensity.toFixed(1)}</span>
        </label>
        <label className="debug-panel-field">
          <span>Spot Intensity</span>
          <input
            type="range"
            min="0"
            max="1200"
            step="10"
            value={settings.work.spotIntensity}
            onChange={(e) =>
              update({
                work: { ...settings.work, spotIntensity: Number(e.target.value) },
              })
            }
          />
          <span>{settings.work.spotIntensity.toFixed(0)}</span>
        </label>
      </div>

      <div className="debug-panel-hint">Toggle: ` or Shift+G</div>
    </div>
  );
}
