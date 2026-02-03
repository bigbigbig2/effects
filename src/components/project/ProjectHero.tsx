import type { Project } from "../../types";

type ProjectHeroProps = {
  project: Project;
};

export function ProjectHero({ project }: ProjectHeroProps) {
  return (
    <section className="project-hero">
      <div className="meta">
        <span>{project.year}</span>
        <span>{project.role}</span>
      </div>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      <div className="cover">
        <img src={project.cover} alt={`${project.title} cover`} />
      </div>
    </section>
  );
}
