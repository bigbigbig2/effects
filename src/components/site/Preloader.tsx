export function Preloader() {
  return (
    <div className="preloader c-color">
      <div className="preloader-progress">
        <div className="preloader-cta" data-sound="true">
          <div className="preloader-cta-text">
            <div className="preloader-cta-text-inner">
              <div className="preloader-cta-text-static">Enter</div>
              <div className="preloader-cta-text-hover">Enter</div>
            </div>
          </div>
        </div>
        <svg
          className="preloader-progress-circles"
          width="462"
          height="462"
          viewBox="0 0 462 462"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="preloader-progress-outline"
            opacity="0.4"
            cx="231"
            cy="231"
            r="224"
            stroke="currentColor"
            strokeDasharray="2 2"
          />
          <circle
            className="preloader-progress-circle"
            opacity="0.5"
            cx="231"
            cy="231"
            r="230"
            stroke="currentColor"
          />
        </svg>
        <div className="preloader-progress-text">
          <div className="preloader-progress-text-inner">
            <div className="preloader-progress-text-percent">0</div>%
          </div>
        </div>

        <div className="preloader-cta-2" data-sound="false">
          <div className="preloader-cta-2-text">
            <div className="preloader-cta-text-2-inner">
              <div className="preloader-cta-text-2-static">Enter without sound</div>
            </div>
          </div>
        </div>
      </div>
      <div className="preloader-footer">
        <div className="wrap">
          <div className="flex justify-end">
            <div className="preloader-footer-text">
              <div className="preloader-footer-text-inner">
                Loading<span className="preloader-footer-text-dots">...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
