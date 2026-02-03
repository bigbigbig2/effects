export function AboutFooter() {
  return (
    <footer className="ui-footer">
      <div className="ui-footer-primary">
        <div className="wrap">
          <div className="lg:grid grid-cols-24 gap-24 items-end">
            <div className="ui-footer-credits">
              <span className="ts-m c-color" data-modal-trigger="credits" data-sound="" data-sound-click="">
                Rogier de Boeve (c) 2025
              </span>
            </div>

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
  );
}
