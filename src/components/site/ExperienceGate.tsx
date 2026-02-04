"use client";

import { usePathname } from "next/navigation";
import { ExperienceMount } from "../ExperienceMount";
import { useUiState } from "./UiStateProvider";

// ExperienceGate 组件：
// 3D 体验的"大门"。控制何时渲染 3D 画布。
// 这里的逻辑似乎是：只在首页且已经“进入”状态下才渲染 ExperienceMount。
// *注意*: 这可能是一个优化的点。如果 3D 场景需要在所有页面背景中运行，
// 这里的逻辑可能需要调整。目前的逻辑意味着在项目详情页 3D 场景会被卸载？
// 或者这只是控制“挂载”行为，而 3D 场景一旦创建就不会轻易销毁（取决于 ExperienceMount 的实现）。
// 
// 回看 ExperienceMount，它在卸载时会调用 destroy()。
// 这意味着如果 ExperienceGate 返回 null，3D 场景会被销毁。
// 这对于性能是好的（非首页不渲染 3D），但意味着切换页面会有重新加载的过程。
export function ExperienceGate() {
  const pathname = usePathname();
  const { entered } = useUiState();
  const isHome = pathname === "/";

  // 只有在首页且用户已点击“进入”后，才加载 3D 体验
  if (!isHome || !entered) {
    return null;
  }

  return <ExperienceMount />;
}
