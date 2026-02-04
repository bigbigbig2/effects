"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

// 定义声音设置事件的详细信息结构
type SoundSetDetail = {
  enabled: boolean;
};

// UI 状态上下文的结构定义
type UiState = {
  entered: boolean; // 是否已进入主体验（通常指点击了“进入”按钮或加载完成）
  enter: (withSound: boolean) => void; // 进入体验的函数，可选择是否开启声音
};

// 创建上下文
const UiStateContext = createContext<UiState | null>(null);

// UiStateProvider 组件：
// 管理全局 UI 状态，如是否“进入”了网站。
// 同时也负责根据路由变化更新 HTML 根元素的类名。
export function UiStateProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // 判断当前是否在首页
  const isHome = pathname === "/";
  // 状态：是否已进入
  const [entered, setEntered] = useState(false);

  // 副作用：根据 entered 状态和当前路由更新 documentElement (<html>) 的类名
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // 如果不是在首页（例如在项目详情页），默认视为已进入状态
    // 移除锁定类，添加已进入类
    if (!isHome) {
      root.classList.remove("is-locked");
      root.classList.add("is-entered");
      return;
    }

    // 如果在首页，根据 entered 状态切换类名
    if (entered) {
      root.classList.remove("is-locked");
      root.classList.add("is-entered");
    } else {
      // 未进入时锁定页面（通常用于显示 Preloader 或 Enter 界面）
      root.classList.add("is-locked");
      root.classList.remove("is-entered");
    }
  }, [entered, isHome]);

  // 进入函数：更新状态并分发 "sound:set" 事件
  const enter = useCallback((withSound: boolean) => {
    setEntered(true);
    const detail: SoundSetDetail = { enabled: withSound };
    // 派发自定义事件，通知其他组件（如 3D 引擎或音频管理器）声音设置已更改
    window.dispatchEvent(new CustomEvent<SoundSetDetail>("sound:set", { detail }));
  }, []);

  // 缓存上下文值，避免不必要的重渲染
  const value = useMemo(
    () => ({
      entered,
      enter,
    }),
    [entered, enter]
  );

  return <UiStateContext.Provider value={value}>{children}</UiStateContext.Provider>;
}

// 自定义 Hook：方便组件访问 UI 状态
export function useUiState() {
  const context = useContext(UiStateContext);
  if (!context) {
    throw new Error("useUiState must be used within UiStateProvider");
  }
  return context;
}
