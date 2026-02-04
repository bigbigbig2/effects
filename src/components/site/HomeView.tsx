"use client";

import { useEffect, useMemo, useState } from "react";

// 自定义事件详情类型：当 3D 场景中的活动项改变时触发
type UiActiveDetail = {
  index: number;
  progress: number;
};

// HomeView 组件：
// 首页视图，主要包含项目列表（索引）。
// 这是一个客户端组件，因为它需要响应 3D 场景的事件 (ui:active) 并分发选择事件 (ui:select)。
export function HomeView() {
  // 定义项目列表数据
  const items = useMemo(
    () => [
      { slug: "following-wildfire", title: "Following Wildfire" },
      { slug: "engaged", title: "Engaged" },
      { slug: "spritexmarvel", title: "Sprite x Marvel" },
      { slug: "filmsecession", title: "Film Secession" },
      { slug: "theroger", title: "The Roger" },
      { slug: "poppr", title: "Poppr" },
      { slug: "demorgen", title: "De Morgen" },
      { slug: "glenncatteeuw", title: "Glenn Catteeuw" },
      { slug: "thoughtlab", title: "Thoughtlab" },
    ],
    []
  );

  // 当前激活的项目索引（与 3D 场景同步）
  const [activeIndex, setActiveIndex] = useState(0);

  // 监听 "ui:active" 事件：当用户在 3D 场景中滚动切换项目时，更新 React 端的 activeIndex
  useEffect(() => {
    const handleActive = (event: Event) => {
      const detail = (event as CustomEvent<UiActiveDetail>).detail;
      if (!detail) return;
      setActiveIndex(detail.index);
    };

    window.addEventListener("ui:active", handleActive as EventListener);

    return () => {
      window.removeEventListener("ui:active", handleActive as EventListener);
    };
  }, []);

  // 处理项目选择：当用户点击列表项时，分发 "ui:select" 事件通知 3D 场景
  const handleSelect = (index: number) => {
    window.dispatchEvent(new CustomEvent("ui:select", { detail: { index } }));
  };

  return (
    <div data-view="home" className="ui-work">
      <div className="ui-work-content">
        <div className="ui-work-container" />
        <div className="wrap">
          <div className="lg:grid grid-cols-24 gap-24">
            {/* 项目列表区域 */}
            <div className="col-span-12 xl:col-span-10 col-start-12 lg:col-start-13 xl:col-start-15">
              <div className="ui-title ts-m c-color">
                <span className="ui-title-inner">Index</span>
              </div>
              <ul className="ui-work-ul">
                {items.map((item, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={item.slug}
                      className={`c-color${isActive ? " is-active" : ""}`}
                      data-slug={item.slug}
                    >
                      {/* 列表项点击区域 */}
                      <div
                        className="ui-work-a"
                        data-sound=""
                        data-sound-click=""
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelect(index)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleSelect(index);
                          }
                        }}
                      >
                        <span>{item.title}</span>
                      </div>
                      {/* "查看项目" 按钮 */}
                      <a href={`/${item.slug}/`} data-transition="project" className="ui-work-cta">
                        <span className="c-button" data-sound="" data-sound-click="">
                          <span className="c-button-bg">
                            <svg width="150" height="28" viewBox="0 0 150 28">
                              <rect
                                className="c-button-bg-hover"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                x="0"
                                y="0"
                                width="155"
                                height="28"
                              />
                              <rect
                                className="c-button-bg-static"
                                fill="none"
                                stroke="currentColor"
                                strokeDasharray="2 2"
                                strokeWidth="1"
                                x="0"
                                y="0"
                                width="155"
                                height="28"
                              />
                            </svg>
                          </span>
                          <span className="c-button-icon c-button-icon--before">
                            <svg
                              className="c-icon-arrow"
                              width="28"
                              height="28"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 28 28"
                              xmlSpace="preserve"
                            >
                              <g className="c-icon-arrow-shape" fill="currentColor">
                                <rect rx="1" ry="1" x="11.3" y="11" width="2" height="2" />
                                <rect rx="1" ry="1" x="14.7" y="13" width="2" height="2" />
                                <rect rx="1" ry="1" x="11.3" y="15" width="2" height="2" />
                              </g>
                              <line
                                stroke="currentColor"
                                strokeDasharray="2 2"
                                strokeWidth="1"
                                x1="28"
                                y1="1"
                                x2="28"
                                y2="26"
                              />
                            </svg>
                          </span>
                          <span className="c-button-text">
                            <span className="c-button-text-outer">
                              <span className="c-button-text-inner">
                                <span className="c-button-text-static">
                                  <span>View project</span>
                                </span>
                                <span className="c-button-text-hover">
                                  <span>View project</span>
                                </span>
                              </span>
                            </span>
                          </span>
                          <span className="c-button-icon c-button-icon--after">
                            <svg
                              className="c-icon-arrow"
                              width="28"
                              height="28"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 28 28"
                              xmlSpace="preserve"
                            >
                              <g className="c-icon-arrow-shape" fill="currentColor">
                                <rect rx="1" ry="1" x="11.3" y="11" width="2" height="2" />
                                <rect rx="1" ry="1" x="14.7" y="13" width="2" height="2" />
                                <rect rx="1" ry="1" x="11.3" y="15" width="2" height="2" />
                              </g>
                              <line
                                stroke="currentColor"
                                strokeDasharray="2 2"
                                strokeWidth="1"
                                x1="0"
                                y1="1"
                                x2="0"
                                y2="26"
                              />
                            </svg>
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <footer className="ui-footer">
          <div className="ui-footer-primary">
            <div className="wrap">
              <div className="lg:grid grid-cols-24 gap-24 items-end">
                <div className="ui-footer-socials">
                  <ul className="socials ts-m">
                    <li className="social">
                      <a
                        className="social-a c-color"
                        href="https://twitter.com/rogierdeboeve"
                        target="_blank"
                        rel="noopener"
                        data-sound=""
                        data-sound-click=""
                      >
                        <span>Twitter</span>
                      </a>
                    </li>
                    <li className="social">
                      <a
                        className="social-a c-color"
                        href="https://www.instagram.com/rdboeve/"
                        target="_blank"
                        rel="noopener"
                        data-sound=""
                        data-sound-click=""
                      >
                        <span>Instagram</span>
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="ui-footer-contact">
                  <a className="ts-m c-color" href="mailto:hello@rogierdeboeve.com" data-sound="" data-sound-click="">
                    <span>hello@rogierdeboeve.com</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>

        <div className="ui-progressbar ui-progressbar--work c-color">
          <div className="ui-progressbar-items">
            {items.map((item, index) => (
              <div
                key={item.slug}
                className={`ui-progressbar-item${index === activeIndex ? " is-active" : ""}`}
                data-slug={item.slug}
                data-sound=""
                data-sound-click=""
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelect(index);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="scroll-spacer" />
    </div>
  );
}
