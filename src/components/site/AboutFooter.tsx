// AboutFooter 组件：
// 关于页面的底部。
// 包含版权信息、社交媒体链接和联系方式。
export function AboutFooter() {
  return (
    <footer className="ui-footer">
      <div className="ui-footer-primary">
        <div className="wrap">
          <div className="lg:grid grid-cols-24 gap-24 items-end">
            {/* 版权信息 */}
            <div className="ui-footer-credits">
              <span className="ts-m c-color" data-modal-trigger="credits" data-sound="" data-sound-click="">
                Rogier de Boeve (c) 2025
              </span>
            </div>

            {/* 社交媒体链接 */}
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
            
            {/* 联系方式 */}
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
