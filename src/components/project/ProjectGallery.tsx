import type { ProjectMedia } from "../../types";

type ProjectGalleryProps = {
  media: ProjectMedia[];
};

export function ProjectGallery({ media }: ProjectGalleryProps) {
  return (
    <section className="project-gallery">
      {media.map((item, index) => (
        <figure key={`${item.src}-${index}`}>
          {item.type === "image" ? (
            <img src={item.src} alt={item.alt ?? "Project media"} />
          ) : (
            <video src={item.src} controls muted playsInline />
          )}
        </figure>
      ))}
    </section>
  );
}
