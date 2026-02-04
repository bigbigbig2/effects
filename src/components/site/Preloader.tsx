"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { useUiState } from "./UiStateProvider";
import { Assets } from "../../experience/core/Assets";
import { projects } from "../../experience/data/projects";

type ProgressDetail = {
  loaded: number;
  total: number;
  progress: number;
};

// 预加载圆环的尺寸常量
const CIRCLE_RADIUS = 230;
const CIRCLE_OUTLINE_RADIUS = 224;

// Preloader 组件：
// 负责在首次访问首页时预加载核心资源（主要是纹理）。
// 显示一个圆形的进度条，加载完成后自动隐藏。
export function Preloader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { entered, enter } = useUiState();
  const [progress, setProgress] = useState(0); // 当前显示的进度 (0-1)
  const [targetProgress, setTargetProgress] = useState(0); // 目标进度 (0-1)，实际加载进度
  const [ready, setReady] = useState(false); // 是否加载完成
  const hasPreloaded = useRef(false); // 标记是否已经执行过预加载
  const startTimeRef = useRef<number | null>(null);
  const MIN_DURATION = 1400; // 最小加载显示时间，防止加载太快一闪而过

  useEffect(() => {
    // 仅在首页执行预加载
    if (!isHome) return;

    // 监听资源加载进度事件
    const handleProgress = (event: Event) => {
      const detail = (event as CustomEvent<ProgressDetail>).detail;
      if (!detail) return;
      const nextProgress = Math.min(1, Math.max(0, detail.progress));
      setTargetProgress(nextProgress);
    };

    // 监听加载完成事件
    const handleComplete = () => {
      setTargetProgress(1);
    };

    window.addEventListener("assets:progress", handleProgress as EventListener);
    window.addEventListener("assets:complete", handleComplete);

    // 触发预加载逻辑
    if (!hasPreloaded.current) {
      hasPreloaded.current = true;
      const assets = new Assets();
      // 并行加载所有项目的纹理
      Promise.all(
        projects.map((project) => assets.loadTexture(project.texture, project.fallbackTexture))
      ).finally(() => {
        assets.destroy(); // 预加载用的 Asset 实例可以销毁
        setTargetProgress(1);
      });
    }

    return () => {
      window.removeEventListener("assets:progress", handleProgress as EventListener);
      window.removeEventListener("assets:complete", handleComplete);
    };
  }, [isHome]);

  // 动画循环：平滑过渡进度条
  // 确保进度条至少显示 MIN_DURATION 毫秒
  useEffect(() => {
    if (!isHome) return;

    let raf = 0;
    const tick = (time: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = time;
      }

      const elapsed = time - startTimeRef.current;
      const timeProgress = Math.min(1, elapsed / MIN_DURATION);
      // 最终进度是 "实际加载进度" 和 "时间进度" 的最小值
      // 这保证了即使加载瞬间完成，进度条也会花 MIN_DURATION 走完
      const desired = Math.min(targetProgress, timeProgress);

      setProgress((prev) => {
        // 缓动效果
        const next = prev + (desired - prev) * 0.1;
        if (Math.abs(next - desired) < 0.001) {
          return desired;
        }
        return next;
      });

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [isHome, targetProgress]);

  // 当进度达到 100% 时，设置就绪状态
  useEffect(() => {
    if (targetProgress >= 1 && progress >= 0.999) {
      setReady(true);
    }
  }, [progress, targetProgress]);

  if (!isHome) {
    return null;
  }

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
    enter(withSound);
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
