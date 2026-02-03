type ArrowIconProps = {
  line?: "left" | "right";
};

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
      <g className="c-icon-arrow-shape" fill="currentColor">
        <rect rx="1" ry="1" x="11.3" y="11" width="2" height="2" />
        <rect rx="1" ry="1" x="14.7" y="13" width="2" height="2" />
        <rect rx="1" ry="1" x="11.3" y="15" width="2" height="2" />
      </g>
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
  label: string;
};

export function CButtonContent({ label }: CButtonContentProps) {
  return (
    <>
      <span className="c-button-bg">
        <svg width="150" height="28" viewBox="0 0 150 28">
          <rect className="c-button-bg-hover" fill="none" stroke="currentColor" strokeWidth="1" x="0" y="0" width="155" height="28" />
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
        <ArrowIcon line="right" />
      </span>
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
      <span className="c-button-icon c-button-icon--after">
        <ArrowIcon line="left" />
      </span>
    </>
  );
}
