"use client";

import { useCallback, useEffect, useState } from "react";

type SoundStateDetail = {
  enabled: boolean;
};

// SoundToggle 组件：
// 全局声音开关按钮。
// 监听 "sound:state" 事件更新自身状态，并分发 "sound:toggle" 事件。
export function SoundToggle() {
  const [enabled, setEnabled] = useState(false);

  // 监听外部的声音状态变化（例如从 localStorage 读取初始状态后）
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

  // 处理点击：分发切换事件
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
      {/* 声音图标 SVG */}
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 静态背景圆圈 */}
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
        {/* 悬停时的背景圆圈 */}
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
        {/* 声音波形条（动画由 CSS 控制） */}
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
