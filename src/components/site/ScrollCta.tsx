type ScrollCtaProps = {
  align?: "left" | "right";
};

export function ScrollCta({ align = "left" }: ScrollCtaProps) {
  const columnClass =
    align === "right"
      ? "lg:col-start-14 lg:col-span-10 xl:col-span-8 xl:col-start-14"
      : "lg:col-start-5 lg:col-span-10 xl:col-span-8 xl:col-start-5";

  return (
    <div className="c-scroll-cta c-color">
      <div className="wrap wrap--md">
        <div className="lg:grid grid-cols-24 gap-24">
          <div className={columnClass}>
            <div className="c-scroll-cta-inner">
              <div className="c-scroll-cta-icon">
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
                  <rect
                    rx="1"
                    ry="1"
                    y="4"
                    width="2"
                    height="2"
                    fill="currentColor"
                    strokeWidth="0"
                  />
                </svg>
              </div>
              <div className="c-scroll-cta-text ts-m">Scroll Down</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
