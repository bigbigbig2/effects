import Link from "next/link";
import type { Project } from "../../types";

type SideIndexProps = {
  projects: Project[];
};

// SideIndex 组件：
// 侧边栏索引列表。
// 列出所有项目，包含序号、标题和年份。
export function SideIndex({ projects }: SideIndexProps) {
  return (
    <aside className="side-index">
      <div className="label">Index</div>
      <ol>
        {projects.map((project, index) => (
          <li key={project.slug}>
            <Link href={`/project/${project.slug}`}>
              {/* 格式化序号，如 01, 02 */}
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
