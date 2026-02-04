"use client";

type EnterOverlayProps = {
  isVisible: boolean; // 是否显示遮罩
  onEnter: () => void; // 点击"进入"的回调
  onEnterSilent: () => void; // 点击"静音进入"的回调
};

// EnterOverlay 组件：
// 网站的入口遮罩层。
// 强制用户进行交互（点击）以解锁音频上下文（浏览器限制）。
// 包含 "Enter Experience" 和 "Enter without sound" 两个选项。
export function EnterOverlay({ isVisible, onEnter, onEnterSilent }: EnterOverlayProps) {
  if (!isVisible) return null;

  return (
    <section className="enter" data-visible="true">
      <div className="frame">
        <div className="title">Enter</div>
        {/* 有声进入 */}
        <button className="enter-btn" onClick={onEnter} type="button">
          Enter Experience
        </button>
        {/* 静音进入 */}
        <button className="enter-btn ghost" onClick={onEnterSilent} type="button">
          Enter without sound
        </button>
      </div>
    </section>
  );
}
