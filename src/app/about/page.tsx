import { SiteShell } from "../../components/site/SiteShell";
import { AboutView } from "../../components/site/AboutView";

// 强制此页面为静态生成。
// 即使包含动态内容，也会在构建时生成静态 HTML。
export const dynamic = "force-static";

// "About" 页面组件 (/about)。
// 渲染 AboutView 组件，包裹在 SiteShell 布局中。
export default function AboutPage() {
  return (
    <SiteShell>
      <AboutView />
    </SiteShell>
  );
}
