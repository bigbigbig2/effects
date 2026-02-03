export function SiteHeader() {
  return (
    <header className="ui-header">
      <div className="ui-header-bg" />
      <div className="ui-header-secondary">
        <div className="wrap">
          <div className="grid grid-cols-24 gap-24">
            <div className="col-span-4">
              <div className="ui-header-version ts-m">
                <a href="/" className="c-color">
                  V-004
                </a>
              </div>
            </div>
            <div className="col-span-7 xl:col-span-6 lg:col-start-17 xl:col-start-19">
              <div className="ui-header-availability ts-m c-color">
                <span className="ui-header-part-inner">Available for freelance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ui-header-primary">
        <div className="wrap">
          <div className="grid grid-cols-24 gap-24">
            <div className="col-span-4">
              <a href="/" className="ui-header-name c-color" aria-label="Rogier de Boeve">
                <span className="ui-header-part-outer">
                  <span className="ui-header-part-inner">Rogier</span>
                </span>
                <span className="ui-header-part-outer">
                  <span className="ui-header-part-inner">de Boeve</span>
                </span>
              </a>
            </div>
            <div className="col-span-4 col-start-5">
              <div className="ui-header-description c-color">
                <span className="ui-header-part-outer">
                  <span className="ui-header-part-inner">Creative</span>
                </span>
                <span className="ui-header-part-outer">
                  <span className="ui-header-part-inner">Developer</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ui-header-mobile lg:hidden">
        <div className="ui-nav-mobile c-color">
          <div className="ui-nav-mobile-toggle">
            <div className="wrap">
              <svg
                className="ui-nav-mobile-toggle-icon"
                width="56"
                height="56"
                viewBox="0 0 56 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  className="ui-nav-mobile-toggle-icon-rect"
                  x="-0.5"
                  y="0.5"
                  width="55"
                  height="55"
                  transform="matrix(-1 0 0 1 55 0)"
                  stroke="currentColor"
                  strokeOpacity="0.4"
                  strokeDasharray="2 2"
                />
                <g className="ui-nav-mobile-toggle-icon-lines">
                  <line
                    className="ui-nav-mobile-toggle-icon-line ui-nav-mobile-toggle-icon-line-1"
                    x1="20"
                    y1="23.5"
                    x2="36"
                    y2="23.5"
                    stroke="currentColor"
                  />
                  <line
                    className="ui-nav-mobile-toggle-icon-line ui-nav-mobile-toggle-icon-line-2"
                    x1="20"
                    y1="27.5"
                    x2="36"
                    y2="27.5"
                    stroke="currentColor"
                  />
                  <line
                    className="ui-nav-mobile-toggle-icon-line ui-nav-mobile-toggle-icon-line-3"
                    x1="20"
                    y1="31.5"
                    x2="36"
                    y2="31.5"
                    stroke="currentColor"
                  />
                </g>
              </svg>
            </div>
          </div>

          <div className="ui-nav-mobile-content-bg" />

          <div className="ui-nav-mobile-content">
            <div className="ui-nav-mobile-content-main">
              <div className="wrap">
                <a className="ui-nav-mobile-a c-color" href="/" data-slug="home">
                  <span className="ui-nav-mobile-a-inner">
                    <span className="ui-nav-mobile-a-title">Work</span>
                  </span>
                </a>
                <a className="ui-nav-mobile-a c-color" href="/about/" data-slug="about">
                  <span className="ui-nav-mobile-a-inner">
                    <span className="ui-nav-mobile-a-title">About</span>
                  </span>
                </a>
              </div>
            </div>

            <div className="ui-nav-mobile-content-footer">
              <div className="wrap">
                <ul className="ui-nav-mobile-content-footer-links ts-m">
                  <li className="ui-nav-mobile-content-footer-link">
                    <a
                      className="social-a c-color"
                      href="https://twitter.com/rogierdeboeve"
                      target="_blank"
                      rel="noopener"
                    >
                      <span>Twitter</span>
                    </a>
                  </li>
                  <li className="ui-nav-mobile-content-footer-link">
                    <a
                      className="social-a c-color"
                      href="https://www.instagram.com/rdboeve/"
                      target="_blank"
                      rel="noopener"
                    >
                      <span>Instagram</span>
                    </a>
                  </li>
                  <li className="ui-nav-mobile-content-footer-link">
                    <a className="social-a c-color" href="mailto:hello@rogierdeboeve.com">
                      <span>E-mail</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
