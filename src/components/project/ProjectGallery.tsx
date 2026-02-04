import type { ProjectMedia } from "../../types";

type ProjectGalleryProps = {
  media: ProjectMedia[];
};

// ProjectGallery 组件：
// 用于展示项目的媒体库（图片或视频）。
// 这是一个展示型组件，接收媒体数组并渲染。
export function ProjectGallery({ media }: ProjectGalleryProps) {
  return (
    <section className="project-gallery">
      {media.map((item, index) => (
        // 使用 src 和 index 组合作为 key，确保唯一性
        <figure key={`${item.src}-${index}`}>
          {item.type === "image" ? (
            <img src={item.src} alt={item.alt ?? "Project media"} />
          ) : (
            // 视频自动播放设置：controls, muted, playsInline (兼容移动端)
            <video src={item.src} controls muted playsInline />
          )}
        </figure>
      ))}
    </section>
  );
}
