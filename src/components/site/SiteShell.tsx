import type { ReactNode } from "react";
import { Preloader } from "./Preloader";
import { SiteHeader } from "./SiteHeader";
import { SiteNav } from "./SiteNav";
import { SoundToggle } from "./SoundToggle";
import { ExperienceGate } from "./ExperienceGate";
import { DebugGui } from "../dev/DebugGui";

type SiteShellProps = {
  children: ReactNode;
};

// SiteShell 组件：
// 应用的主外壳，包含了所有页面共用的 UI 元素。
// 如：头部、导航、加载器、声音开关、调试工具以及 3D 体验的入口 (ExperienceGate)。
export function SiteShell({ children }: SiteShellProps) {
  return (
    <>
      {/* ExperienceGate 负责挂载 3D 场景 (ExperienceMount) */}
      <ExperienceGate />
      
      {/* 主要 UI 容器 */}
      <div className="ui">
        {/* 站点头部 */}
        <SiteHeader />
        
        {/* 页面主要内容区域 (children) */}
        <main className="ui-main">{children}</main>
        
        {/* 站点导航 */}
        <SiteNav />
        
        {/* 声音开关按钮 */}
        <SoundToggle />
        
        {/* 预加载画面 */}
        <Preloader />
        
        {/* 开发调试 GUI (通常只在开发模式下显示或通过特定方式触发) */}
        <DebugGui />
      </div>
    </>
  );
}
