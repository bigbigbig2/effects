"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TopNavProps = {
  soundOn?: boolean;
};

// TopNav 组件：
// 顶部导航栏（备用/HUD版）。
// 包含品牌名、主要页面链接 (Work, About) 和声音状态指示器。
export function TopNav({ soundOn = false }: TopNavProps) {
  const pathname = usePathname();

  return (
    <header className="top-nav">
      {/* 品牌 Logo 区域 */}
      <div className="brand">
        <span>Rogier de Boeve</span>
        <span className="role">Portfolio 2024</span>
      </div>
      
      {/* 导航链接 */}
      <nav className="links">
        <Link className={pathname === "/" ? "is-active" : ""} href="/">
          Work
        </Link>
        <Link className={pathname === "/about" ? "is-active" : ""} href="/about">
          About
        </Link>
      </nav>
      
      {/* 右侧元数据/状态 */}
      <div className="meta">
        <span className="dot"></span>
        <span>Sound {soundOn ? "On" : "Off"}</span>
      </div>
    </header>
  );
}
