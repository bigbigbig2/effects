import { AboutFooter } from "./AboutFooter";
import { ScrollCta } from "./ScrollCta";

export function AboutView() {
  return (
    <div data-view="about" className="ui-about">
      <div className="wrap wrap--md">
        <div className="ui-about-hero lg:grid grid-cols-24 gap-24">
          <div className="ui-about-hero-visual lg:col-span-8 lg:col-start-6 xl:col-span-7 xl:col-start-6" />
          <div className="lg:col-start-14 lg:col-span-10 xl:col-span-8 xl:col-start-14">
            <h1 className="ui-title ts-m c-color">
              <span className="ui-title-inner">About me</span>
            </h1>
            <div className="ui-about-intro" data-split-articles="">
              <p className="ts-1">Independent Freelance Creative Developer & Digital Designer</p>
              <p className="ts-p">
                Belgium-based creative developer and digital designer, passionate about digital art, creative coding, and 3D animation.
              </p>
              <p className="ts-p">Always looking for interesting freelance opportunities to develop beautiful digital experiences.</p>
            </div>
          </div>
        </div>

        <div className="ui-about-collab flex flex-col md:grid md:grid-cols-24">
          <div className="ui-about-brands md:col-span-9 lg:col-span-8 lg:col-start-6 xl:col-start-6">
            <h2 className="ts-m">Brands I&apos;ve worked for</h2>
            <p className="ts-p">
              Marvel Studios, Coca-Cola, Nike,<br />
              Jaeger-LeCoultre, ABC TV, <br />
              T-Mobile, Postman, De Morgen, <br />
              DreamWorks, On Running.<br />
            </p>
          </div>
          <div className="ui-about-agencies md:col-span-9 md:col-start-13 lg:col-span-8 lg:col-start-14 xl:col-start-14">
            <h2 className="ts-m">Agencies I&apos;ve worked with</h2>
            <p className="ts-p">
              Dogstudio, Immersive Garden,<br />
              North Kingdom, Thoughtlab,<br />
              Reflektor Digital, Mortierbrigade, <br />
              Powster, ToyFight.
            </p>
          </div>
        </div>

        <div className="ui-about-recognition lg:grid grid-cols-24 gap-24">
          <div className="col-span-16 col-start-6">
            <h2 className="ts-m">Recognition</h2>
            <div className="c-list ts-m">
              <div className="c-list-section md:grid grid-cols-16 gap-x-24 gap-y-12">
                <div className="c-list-section-title">Awwwards</div>
                <div className="c-list-items">
                  <div className="c-list-item">
                    <div className="c-list-item-title">Site of the Month</div>
                    <div className="c-list-item-amount">x1</div>
                  </div>
                  <div className="c-list-item">
                    <div className="c-list-item-title">Site of the Day</div>
                    <div className="c-list-item-amount">x12</div>
                  </div>
                  <div className="c-list-item">
                    <div className="c-list-item-title">Developer Award</div>
                    <div className="c-list-item-amount">x12</div>
                  </div>
                  <div className="c-list-item">
                    <div className="c-list-item-title">Mobile Of The Week</div>
                    <div className="c-list-item-amount">x3</div>
                  </div>
                  <div className="c-list-item">
                    <div className="c-list-item-title">Mobile Excellence</div>
                    <div className="c-list-item-amount">x3</div>
                  </div>
                </div>
              </div>

              <div className="c-list-section md:grid grid-cols-16 gap-x-24 gap-y-12">
                <div className="c-list-section-title">Webby Awards</div>
                <div className="c-list-items">
                  <div className="c-list-item">
                    <div className="c-list-item-title">Webby Winner</div>
                    <div className="c-list-item-amount">x1</div>
                  </div>
                  <div className="c-list-item">
                    <div className="c-list-item-title">People&apos;s Voice Winner</div>
                    <div className="c-list-item-amount">x1</div>
                  </div>
                </div>
              </div>

              <div className="c-list-section md:grid grid-cols-16 gap-x-24 gap-y-12">
                <div className="c-list-section-title">Behance</div>
                <div className="c-list-items">
                  <div className="c-list-item">
                    <div className="c-list-item-title">Adobe new creatives</div>
                    <div className="c-list-item-amount">x1</div>
                  </div>
                  <div className="c-list-item">
                    <div className="c-list-item-title">Best of Behance</div>
                    <div className="c-list-item-amount">x2</div>
                  </div>
                  <div className="c-list-item">
                    <div className="c-list-item-title">Digital Art Gallery</div>
                    <div className="c-list-item-amount">x3</div>
                  </div>
                  <div className="c-list-item">
                    <div className="c-list-item-title">Editorial Gallery</div>
                    <div className="c-list-item-amount">x1</div>
                  </div>
                </div>
              </div>

              <div className="c-list-section md:grid grid-cols-16 gap-x-24 gap-y-12">
                <div className="c-list-section-title">FWA</div>
                <div className="c-list-items">
                  <div className="c-list-item">
                    <div className="c-list-item-title">Site of the Month</div>
                    <div className="c-list-item-amount">x2</div>
                  </div>
                  <div className="c-list-item">
                    <div className="c-list-item-title">Site of the Day</div>
                    <div className="c-list-item-amount">x13</div>
                  </div>
                </div>
              </div>

              <div className="c-list-section md:grid grid-cols-16 gap-x-24 gap-y-12">
                <div className="c-list-section-title">CSSDA</div>
                <div className="c-list-items">
                  <div className="c-list-item">
                    <div className="c-list-item-title">Site of the month</div>
                    <div className="c-list-item-amount">x2</div>
                  </div>
                  <div className="c-list-item">
                    <div className="c-list-item-title">Site of the Day</div>
                    <div className="c-list-item-amount">x12</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ui-about-contact lg:grid grid-cols-24">
          <div className="col-span-7 col-start-6">
            <h2 className="ts-m">Services</h2>
            <ul className="ts-p">
              <li>WebGL Development</li>
              <li>Frontend Development</li>
              <li>Digital Design</li>
              <li>Motion Design</li>
            </ul>
          </div>

          <div className="lg:col-span-10 lg:col-start-14 xl:col-span-8 xl:col-start-14">
            <h2 className="ts-m">Contact</h2>
            <p className="ts-2">
              Reach out for<br />
              freelance collaborations<br />
              or just to <a href="mailto:hello@rogierdeboeve.com">say hi</a>.
            </p>
          </div>
        </div>
      </div>

      <ScrollCta align="right" />
      <AboutFooter />
      <div className="ui-scrollbar c-color">
        <div className="ui-scrollbar-thumb">
          <div className="ui-scrollbar-thumb-inner" />
        </div>
        <div className="ui-scrollbar-total" />
      </div>

      <div className="c-modal" style={{ opacity: 0, pointerEvents: "none" }} data-modal="credits">
        <div className="c-modal-outer">
          <div className="c-modal-inner">
            <div className="wrap wrap--md">
              <div className="ui-about-credits-main lg:grid grid-cols-24 gap-24">
                <div className="col-span-7 col-start-6">
                  <h2 className="ts-3">Tools</h2>
                  <h3 className="ts-m">Development</h3>
                  <ul className="ts-p">
                    <li>Astro</li>
                    <li>Alien.js</li>
                    <li>GSAP</li>
                    <li>Howler.js</li>
                    <li>Lenis</li>
                    <li>Three.js</li>
                  </ul>

                  <h3 className="ts-m">Design</h3>
                  <ul className="ts-p">
                    <li>Figma</li>
                    <li>Photoshop</li>
                  </ul>
                </div>

                <div className="lg:col-span-10 lg:col-start-14 xl:col-span-8 xl:col-start-14">
                  <h2 className="ts-3">Resources</h2>
                  <h3 className="ts-m">Fonts</h3>
                  <ul className="ts-p">
                    <li>Jet Brains Mono</li>
                    <li>Neue Haas Grotesk</li>
                  </ul>

                  <h3 className="ts-m">Sound fx</h3>
                  <ul className="ts-p">
                    <li>Generative.fm</li>
                    <li>Ava Music Group</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <span className="c-link c-modal-close" data-sound="" data-sound-click="">
          <span className="c-link-icon">
            <span className="c-link-icon-bg">
              <svg className="c-icon-arrow" width="28" height="28" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" xmlSpace="preserve">
                <rect
                  className="c-icon-arrow-border"
                  x="0"
                  y="0"
                  width="28"
                  height="28"
                  fill="transparent"
                  stroke="currentColor"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <rect
                  className="c-icon-arrow-border-hover"
                  x="0"
                  y="0"
                  width="28"
                  height="28"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            </span>
            <span className="c-link-icon">
              <svg className="c-icon-close" width="6" height="6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6 6">
                <rect rx="1" ry="1" x="4" width="2" height="2" fill="currentColor" strokeWidth="0" />
                <rect rx="1" ry="1" width="2" height="2" fill="currentColor" strokeWidth="0" />
                <rect rx="1" ry="1" x="2" y="2" width="2" height="2" fill="currentColor" strokeWidth="0" />
                <rect rx="1" ry="1" y="4" x="4" width="2" height="2" fill="currentColor" strokeWidth="0" />
                <rect rx="1" ry="1" y="4" width="2" height="2" fill="currentColor" strokeWidth="0" />
              </svg>
            </span>
          </span>
          <span className="c-link-text">
            <span className="c-link-text-outer">
              <span className="c-link-text-inner">
                <span className="c-link-text-static">
                  <span>Close</span>
                </span>
                <span className="c-link-text-hover">
                  <span>Close</span>
                </span>
              </span>
            </span>
          </span>
        </span>
      </div>
    </div>
  );
}
