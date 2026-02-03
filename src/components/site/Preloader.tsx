"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type ProgressDetail = {
  loaded: number;
  total: number;
  progress: number;
};

type SoundSetDetail = {
  enabled: boolean;
};

const CIRCLE_RADIUS = 230;
const CIRCLE_OUTLINE_RADIUS = 224;

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const handleProgress = (event: Event) => {
      const detail = (event as CustomEvent<ProgressDetail>).detail;
      if (!detail) return;
      const nextProgress = Math.min(1, Math.max(0, detail.progress));
      setProgress(nextProgress);
      if (nextProgress >= 1) {
        setReady(true);
      }
    };

    const handleComplete = () => {
      setProgress(1);
      setReady(true);
    };

    window.addEventListener("assets:progress", handleProgress as EventListener);
    window.addEventListener("assets:complete", handleComplete);

    return () => {
      window.removeEventListener("assets:progress", handleProgress as EventListener);
      window.removeEventListener("assets:complete", handleComplete);
    };
  }, []);

  const percent = Math.round(progress * 100);

  const circleVars = useMemo(() => {
    const circumference = Math.PI * 2 * CIRCLE_RADIUS;
    const dashOffset = circumference * (1 - progress);

    return {
      "--circle-dash-array-static": `${circumference}`,
      "--circle-dash-offset-static": `${dashOffset}`,
      "--circle-dash-array-hover": `${circumference}`,
      "--circle-dash-offset-hover": `${dashOffset}`,
      "--circle-r1-hover": `${CIRCLE_RADIUS + 2}`,
      "--circle-r2-hover": `${CIRCLE_OUTLINE_RADIUS + 2}`,
    } as CSSProperties;
  }, [progress]);

  const handleEnter = (withSound: boolean) => {
    if (!ready) return;
    setEntered(true);
    const detail: SoundSetDetail = { enabled: withSound };
    window.dispatchEvent(new CustomEvent<SoundSetDetail>("sound:set", { detail }));
  };

  return (
    <div
      className={`preloader c-color${ready ? " is-ready" : ""}${entered ? " is-hidden" : ""}`}
      style={circleVars}
    >
      <div className="preloader-progress" style={{ opacity: 1 }}>
        <div
          className={`preloader-cta${ready ? " is-active" : ""}`}
          data-sound="true"
          role="button"
          tabIndex={ready ? 0 : -1}
          onClick={() => handleEnter(true)}
        >
          <div className="preloader-cta-text">
            <div className="preloader-cta-text-inner">
              <div className="preloader-cta-text-static">Enter</div>
              <div className="preloader-cta-text-hover">Enter</div>
            </div>
          </div>
        </div>
        <svg
          className="preloader-progress-circles"
          width="462"
          height="462"
          viewBox="0 0 462 462"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="preloader-progress-outline"
            opacity="0.4"
            cx="231"
            cy="231"
            r="224"
            stroke="currentColor"
            strokeDasharray="2 2"
          />
          <circle
            className="preloader-progress-circle"
            opacity="0.5"
            cx="231"
            cy="231"
            r="230"
            stroke="currentColor"
          />
        </svg>
        <div className="preloader-progress-text" style={{ opacity: ready ? 0 : 1 }}>
          <div className="preloader-progress-text-inner">
            <div className="preloader-progress-text-percent">{percent}</div>%
          </div>
        </div>

        <div
          className={`preloader-cta-2${ready ? " is-active" : ""}`}
          data-sound="false"
          role="button"
          tabIndex={ready ? 0 : -1}
          onClick={() => handleEnter(false)}
        >
          <div className="preloader-cta-2-text">
            <div className="preloader-cta-text-2-inner">Enter without sound</div>
          </div>
        </div>
      </div>
      <div className="preloader-footer">
        <div className="wrap">
          <div className="flex justify-end">
            <div className="preloader-footer-text">
              <div className="preloader-footer-text-inner">Loading<span className="preloader-footer-text-dots">...</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
