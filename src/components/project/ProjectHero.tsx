import type { Project } from "../../types";

type ProjectHeroProps = {
  project: Project;
};

// ProjectHero 组件：
// 项目详情页的头部区域 (Hero Section)。
// 展示项目的标题、描述、角色、年份以及封面图。
export function ProjectHero({ project }: ProjectHeroProps) {
  return (
    <section className="project-hero">
      {/* 项目元数据：年份和角色 */}
      <div className="meta">
        <span>{project.year}</span>
        <span>{project.role}</span>
      </div>
      
      {/* 项目标题 */}
      <h1>{project.title}</h1>
      
      {/* 项目描述 */}
      <p>{project.description}</p>
      
      {/* 项目封面图 */}
      <div className="cover">
        <img src={project.cover} alt={`${project.title} cover`} />
      </div>
    </section>
  );
}
