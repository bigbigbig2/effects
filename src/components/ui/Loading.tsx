// Loading 组件：
// 简单的加载指示器。
// 显示 "Loading" 文本和百分比。
// *注意*：这是一个静态的 UI 组件，实际的进度逻辑可能在 Preloader 或 HUD 中控制。
export function Loading() {
  return (
    <section className="loading" data-state="idle">
      <div className="label">Loading</div>
      <div className="progress">
        <span className="value">0</span>
        <span className="unit">%</span>
      </div>
    </section>
  );
}
