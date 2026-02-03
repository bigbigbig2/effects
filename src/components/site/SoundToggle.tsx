"use client";

import { useCallback, useEffect, useState } from "react";

type SoundStateDetail = {
  enabled: boolean;
};

export function SoundToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const handleState = (event: Event) => {
      const detail = (event as CustomEvent<SoundStateDetail>).detail;
      if (!detail) return;
      setEnabled(detail.enabled);
    };

    window.addEventListener("sound:state", handleState as EventListener);

    return () => {
      window.removeEventListener("sound:state", handleState as EventListener);
    };
  }, []);

  const handleToggle = useCallback(() => {
    window.dispatchEvent(new Event("sound:toggle"));
  }, []);

  return (
    <div
      className={`ui-sound-toggle c-color${enabled ? " is-active" : ""}`}
      data-sound-click=""
      role="button"
      tabIndex={0}
      aria-pressed={enabled}
      onClick={handleToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleToggle();
        }
      }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect
          className="ui-sound-toggle-static"
          x="0.5"
          y="0.5"
          width="27"
          height="27"
          rx="13.5"
          stroke="currentColor"
          strokeOpacity="0.5"
          strokeDasharray="2 2"
        />
        <g className="ui-sound-toggle-hover-wrap">
          <rect
            className="ui-sound-toggle-hover"
            x="0.5"
            y="0.5"
            width="27"
            height="27"
            rx="13.5"
            stroke="currentColor"
            strokeOpacity="1"
          />
        </g>
        <g className="ui-sound-toggle-rects">
          <rect x="6.125" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="7" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="7.875" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="8.75" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="9.625" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="10.5" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="11.375" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="12.25" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="13.125" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="14" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="14.875" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="15.75" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="16.625" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="17.5" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="18.375" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="19.25" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
          <rect x="20.125" y="14" width="1.75" height="1.75" rx="0.875" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
}
