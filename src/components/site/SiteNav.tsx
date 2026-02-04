"use client";

import { usePathname } from "next/navigation";

// SiteNav 组件：
// 全局导航栏，位于页面左侧。
// 允许用户在 "Work" (首页) 和 "About" 页面之间切换。
export function SiteNav() {
  const pathname = usePathname();
  const isAbout = pathname.startsWith("/about");
  const isHome = !isAbout;

  return (
    <nav className="ui-nav">
      <div className="wrap">
        <div className="grid grid-cols-24 gap-24 items-end">
          <div className="ui-nav-items col-span-4 lg:col-span-2">
            
            {/* 首页/作品 链接 */}
            <div className="ui-nav-item">
              <a className={`ui-nav-a c-color${isHome ? " is-active" : ""}`} href="/" data-slug="home">
                <span className="ui-nav-a-inner">
                  <span className="ui-nav-a-icon">
                    {/* 小方块箭头图标 */}
                    <svg
                      className="c-icon-arrow-xs"
                      width="6"
                      height="6"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 6 6"
                    >
                      <rect rx="1" ry="1" width="2" height="2" fill="currentColor" strokeWidth="0" />
                      <rect
                        rx="1"
                        ry="1"
                        x="3.4"
                        y="2"
                        width="2"
                        height="2"
                        fill="currentColor"
                        strokeWidth="0"
                      />
                      <rect rx="1" ry="1" y="4" width="2" height="2" fill="currentColor" strokeWidth="0" />
                    </svg>
                  </span>
                  <span className="ui-nav-a-title">Work</span>
                </span>
              </a>
            </div>

            {/* 关于页面 链接 */}
            <div className="ui-nav-item">
              <a className={`ui-nav-a c-color${isAbout ? " is-active" : ""}`} href="/about/" data-slug="about">
                <span className="ui-nav-a-inner">
                  <span className="ui-nav-a-icon">
                    <svg
                      className="c-icon-arrow-xs"
                      width="6"
                      height="6"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 6 6"
                    >
                      <rect rx="1" ry="1" width="2" height="2" fill="currentColor" strokeWidth="0" />
                      <rect
                        rx="1"
                        ry="1"
                        x="3.4"
                        y="2"
                        width="2"
                        height="2"
                        fill="currentColor"
                        strokeWidth="0"
                      />
                      <rect rx="1" ry="1" y="4" width="2" height="2" fill="currentColor" strokeWidth="0" />
                    </svg>
                  </span>
                  <span className="ui-nav-a-title">About</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
