import { ArrowIcon } from "./CButton";
import { ScrollCta } from "./ScrollCta";
import { WorkFooter } from "./WorkFooter";

// 项目信息项类型（如 Client, Agency, Role 等）
type ProjectInfoItem = {
  title: string;
  description: string;
};

// 桌面端媒体资源类型
type ProjectMedia = {
  src: string;
  width: number;
  height: number;
  className: string;
  poster?: string; // 视频封面图
  parallax?: "" | "bottom"; // 视差效果配置
};

// 移动端媒体资源类型
type ProjectMobileMedia = {
  type: "picture" | "image";
  src: string;
  alt: string;
  width: number;
  height: number;
};

// 下一个项目预览信息类型
type ProjectNext = {
  slug: string;
  title: string;
  image: ProjectMedia;
  alt: string;
};

// ProjectView 组件的 Props 定义
type ProjectViewProps = {
  slug: string;
  title: string;
  description: string;
  liveUrl?: string; // 可选的实时链接
  info: ProjectInfoItem[];
  mediaDesktop: ProjectMedia[];
  mediaMobile: ProjectMobileMedia[];
  next: ProjectNext;
};

// 子组件：显示单个信息项
function ProjectInfoItemView({ title, description }: ProjectInfoItem) {
  return (
    <div className="ui-project-info-item">
      <div className="ui-project-info-item-title">
        <span>{title}</span>
      </div>
      <div className="ui-project-info-item-description">
        <span>{description}</span>
      </div>
    </div>
  );
}

// 子组件：返回首页的链接
function ProjectBackLink() {
  return (
    <a href="/" data-transition="work" className="c-link" data-sound="" data-sound-click="">
      <span className="c-link-icon">
        <span className="c-link-icon-bg">
          {/* 箭头 SVG */}
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
        <span className="c-link-icon-static">
          <ArrowIcon />
        </span>
        <span className="c-link-icon-hover">
          <ArrowIcon />
        </span>
      </span>
      <span className="c-link-text">
        <span className="c-link-text-outer">
          <span className="c-link-text-inner">
            <span className="c-link-text-static">
              <span>To index</span>
            </span>
            <span className="c-link-text-hover">
              <span>To index</span>
            </span>
          </span>
        </span>
      </span>
    </a>
  );
}

export function ProjectView({ slug, title, description, liveUrl, info, mediaDesktop, mediaMobile, next }: ProjectViewProps) {
  return (
    <div data-view="project" className="ui-project" data-project={slug}>
      <div className="ui-project-header c-color">
        <div className="wrap">
          <ProjectBackLink />
        </div>
      </div>
      <div className="wrap wrap--md">
        <div className="lg:grid grid-cols-24 gap-24">
          <div className="col-span-24 lg:col-span-20 lg:col-start-5 ui-project-content">
            <div className="ui-project-content-header">
              <div className="ui-project-text">
                <div className="lg:grid lg:grid-cols-20 gap-24">
                  <div className="col-span-24 lg:col-span-6">
                    <h2 className="ts-2 c-color">
                      <span>{title}</span>
                    </h2>
                  </div>

                  <div className="ui-project-media-mobile lg:hidden" style={{ aspectRatio: "1600 / 1140" }}>
                    <picture>
                      <source srcSet={mediaMobile[0].src} type="image/webp" />
                      <img src={mediaMobile[0].src} loading="lazy" alt={mediaMobile[0].alt} />
                    </picture>
                  </div>
                  <div className="col-span-24 lg:col-span-12 lg:col-start-7 grid grid-cols-12 gap-x-24 c-color" data-split-articles>
                    <p className="ts-p col-span-12 lg:col-span-11 xl:col-span-10">{description}</p>
                  </div>
                </div>
                <div className="ui-project-info lg:grid lg:grid-cols-20 gap-24">
                  {liveUrl ? (
                    <div className="tablet:hidden lg:col-span-6">
                      <div className="ui-project-links c-color">
                        <a href={liveUrl} target="_blank" rel="noopener" className="c-button" data-sound="" data-sound-click="">
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
                                  <span>View live</span>
                                </span>
                                <span className="c-button-text-hover">
                                  <span>View live</span>
                                </span>
                              </span>
                            </span>
                          </span>
                          <span className="c-button-icon c-button-icon--after">
                            <ArrowIcon line="left" />
                          </span>
                        </a>
                      </div>
                    </div>
                  ) : null}
                  <div className="ui-project-info-items lg:col-start-7 lg:col-span-12 c-color">
                    {info.map((item) => (
                      <ProjectInfoItemView key={item.title} title={item.title} description={item.description} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="ui-project-media-items lg:grid lg:grid-cols-20 tablet:hidden">
              {mediaDesktop.map((media, index) => (
                <div
                  key={`${media.src}-${index}`}
                  className={`ui-project-media ${media.className}`}
                  data-media=""
                  data-media-parallax={media.parallax ?? ""}
                  data-media-width={media.width}
                  data-media-height={media.height}
                  data-media-src={media.src}
                  style={{
                    aspectRatio: `${media.width} / ${media.height}`,
                    backgroundImage: `url(${media.poster ?? media.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ))}
            </div>

            <div className="ui-project-media-items lg:hidden">
              {mediaMobile.map((media, index) => (
                <div key={`${media.src}-${index}`} className="ui-project-media-mobile" style={{ aspectRatio: `${media.width} / ${media.height}` }}>
                  {media.type === "picture" ? (
                    <picture>
                      <source srcSet={media.src} type="image/webp" />
                      <img src={media.src} loading="lazy" alt={media.alt} />
                    </picture>
                  ) : (
                    <img
                      src={media.src}
                      loading="lazy"
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      alt={media.alt}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="ui-project-next" data-project-slug={next.slug}>
              <div className="lg:grid grid-cols-20 gap-24">
                <div className="lg:col-span-6 lg:col-start-10">
                  <a href={`/${next.slug}/`} className="ui-project-next-link c-color">
                    <span className="ts-m">Next project</span>
                    <h3 className="ts-3">{next.title}</h3>

                    <div
                      className="ui-project-next-image tablet:hidden"
                      data-media=""
                      data-media-parallax="bottom"
                      data-media-width={next.image.width}
                      data-media-height={next.image.height}
                      data-media-src={next.image.src}
                      style={{
                        aspectRatio: `${next.image.width} / ${next.image.height}`,
                        backgroundImage: `url(${next.image.poster ?? next.image.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />

                    <div className="ui-project-media-mobile lg:hidden" style={{ aspectRatio: `${next.image.width} / ${next.image.height}` }}>
                      <picture>
                        <source srcSet={next.image.src} type="image/webp" />
                        <img src={next.image.src} loading="lazy" alt={next.alt} />
                      </picture>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScrollCta align="left" />
      <WorkFooter />
      <div className="ui-scrollbar c-color">
        <div className="ui-scrollbar-thumb">
          <div className="ui-scrollbar-thumb-inner" />
        </div>
        <div className="ui-scrollbar-total" />
      </div>
    </div>
  );
}
