"use client";

import { useState } from "react";
import type { Project } from "../types";
import { TopNav } from "./ui/TopNav";
import { SideIndex } from "./ui/SideIndex";
import { Loading } from "./ui/Loading";
import { EnterOverlay } from "./ui/EnterOverlay";

type HUDProps = {
  projects: Project[];
};

// HUD (Heads-Up Display) 组件：
// 一个整合了多个 UI 元素的容器组件。
// 似乎是早期版本或备用方案，包含了顶部导航、侧边索引、加载动画和进入遮罩。
// *注意*：当前 `SiteShell` 中似乎没有直接使用这个组件，而是分散使用了类似的组件。
export function HUD({ projects }: HUDProps) {
  const [enterVisible, setEnterVisible] = useState(true);
  const [soundOn, setSoundOn] = useState(false);

  // 处理进入体验的交互
  const handleEnter = (withSound: boolean) => {
    setSoundOn(withSound);
    setEnterVisible(false);
  };

  return (
    <>
      <TopNav soundOn={soundOn} />
      <SideIndex projects={projects} />
      <Loading />
      <EnterOverlay
        isVisible={enterVisible}
        onEnter={() => handleEnter(true)}
        onEnterSilent={() => handleEnter(false)}
      />
    </>
  );
}
