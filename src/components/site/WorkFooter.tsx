// WorkFooter 组件：
// 作品展示页面的底部（类似于 AboutFooter，但可能内容略有不同）。
// 目前包含社交链接和联系方式。
export function WorkFooter() {
  return (
    <footer className="ui-footer">
      <div className="ui-footer-primary">
        <div className="wrap">
          <div className="lg:grid grid-cols-24 gap-24 items-end">
            {/* 社交链接 */}
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
