import Link from "next/link";
import type { Project } from "../../types";

type SideIndexProps = {
  projects: Project[];
};

export function SideIndex({ projects }: SideIndexProps) {
  return (
    <aside className="side-index">
      <div className="label">Index</div>
      <ol>
        {projects.map((project, index) => (
          <li key={project.slug}>
            <Link href={`/project/${project.slug}`}>
              <span className="num">{String(index + 1).padStart(2, "0")}</span>
              <span className="title">{project.title}</span>
              <span className="year">{project.year}</span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
