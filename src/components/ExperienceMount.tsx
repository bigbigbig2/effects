"use client";

import { useEffect, useRef } from "react";
import { createExperience } from "../experience";

// ExperienceMount 组件：
// 负责挂载和初始化 Three.js 体验 (Experience)。
// 这是一个客户端组件 (use client)，因为它需要访问 DOM (canvas, div) 和 window 对象。
export function ExperienceMount() {
  // 容器 div 的引用，用于监听尺寸变化等
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Canvas 元素的引用，Three.js 将在这里渲染
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 确保 DOM 元素已经挂载
    if (!containerRef.current || !canvasRef.current) return;

    // 初始化 Experience 类（这是 3D 引擎的入口）
    // 传入 canvas 和 container
    const experience = createExperience({
      canvas: canvasRef.current,
      container: containerRef.current,
    });

    // 清理函数：组件卸载时销毁 Experience 实例，释放资源 (WebGL 上下文、事件监听器等)
    return () => {
      experience.destroy();
    };
  }, []); // 空依赖数组，确保只在组件首次挂载时执行一次

  return (
    // 3D 场景的容器，通常是全屏或固定定位
    <div className="gl" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
