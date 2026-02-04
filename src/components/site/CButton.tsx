type ArrowIconProps = {
  line?: "left" | "right"; // 箭头是否带有延伸线，以及线的方向
};

// ArrowIcon 组件：
// 通用的箭头图标，可选带有一条水平延伸线。
// 常用于链接或按钮中，指示方向。
export function ArrowIcon({ line }: ArrowIconProps) {
  const lineX = line === "left" ? 0 : 28;

  return (
    <svg
      className="c-icon-arrow"
      width="28"
      height="28"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 28 28"
      xmlSpace="preserve"
    >
      {/* 箭头的点状图案 */}
      <g className="c-icon-arrow-shape" fill="currentColor">
        <rect rx="1" ry="1" x="11.3" y="11" width="2" height="2" />
        <rect rx="1" ry="1" x="14.7" y="13" width="2" height="2" />
        <rect rx="1" ry="1" x="11.3" y="15" width="2" height="2" />
      </g>
      {/* 可选的延伸线（虚线） */}
      {line ? (
        <line
          stroke="currentColor"
          strokeDasharray="2 2"
          strokeWidth="1"
          x1={lineX}
          y1="1"
          x2={lineX}
          y2="26"
        />
      ) : null}
    </svg>
  );
}

type CButtonContentProps = {
  label: string; // 按钮文本
};

// CButtonContent 组件：
// 自定义按钮的内容结构。
// 包含复杂的 SVG 边框动画效果和悬停状态的文本切换。
// 这里的 "C" 可能代表 "Custom" 或 "Circle" (尽管这里是矩形)。
export function CButtonContent({ label }: CButtonContentProps) {
  return (
    <>
      {/* 按钮背景边框动画 */}
      <span className="c-button-bg">
        <svg width="150" height="28" viewBox="0 0 150 28">
          {/* 悬停时的实线边框 */}
          <rect className="c-button-bg-hover" fill="none" stroke="currentColor" strokeWidth="1" x="0" y="0" width="155" height="28" />
          {/* 默认的虚线边框 */}
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
      
      {/* 左侧箭头 */}
      <span className="c-button-icon c-button-icon--before">
        <ArrowIcon line="right" />
      </span>
      
      {/* 按钮文本容器，用于实现文本滚动切换效果 */}
      <span className="c-button-text">
        <span className="c-button-text-outer">
          <span className="c-button-text-inner">
            <span className="c-button-text-static">
              <span>{label}</span>
            </span>
            <span className="c-button-text-hover">
              <span>{label}</span>
            </span>
          </span>
        </span>
      </span>
      
      {/* 右侧箭头 */}
      <span className="c-button-icon c-button-icon--after">
        <ArrowIcon line="left" />
      </span>
    </>
  );
}
