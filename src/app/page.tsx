import { SiteShell } from "../components/site/SiteShell";
import { HomeView } from "../components/site/HomeView";

// 强制此页面为静态生成。
// Next.js 会在构建时生成 HTML，而不是在每次请求时在服务器端运行。
// 这对于着陆页来说非常好，可以提供最快的加载速度。
export const dynamic = "force-static";

// 默认导出的是 React 组件，这代表了首页 ("/") 的内容。
// 这里的 HomePage 是一个服务端组件 (Server Component)，因为它没有 "use client" 指令。
export default function HomePage() {
  return (
    // SiteShell 是一个布局包装器，包含导航栏、页脚等公共部分。
    <SiteShell>
      {/* HomeView 包含了首页的具体内容，如 3D 场景的触发器或特定的 UI */}
      <HomeView />
    </SiteShell>
  );
}
