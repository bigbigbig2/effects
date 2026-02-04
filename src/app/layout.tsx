import type { Metadata } from "next";
import "../styles/bundle.87ba3613.css";
import "../styles/bundle.ee0b1c10.css";
import "../styles/overrides.css";
import "./globals.css";
import { UiStateProvider } from "../components/site/UiStateProvider";


// 定义页面的元数据（SEO 信息）。
// Next.js 会自动将这些信息注入到生成的 HTML <head> 中。
export const metadata: Metadata = {
  title: "Rogier de Boeve - Portfolio 2024",
  description: "Portfolio case study recreation with Next.js + Three.js",
  openGraph: {
    title: "Rogier de Boeve - Portfolio 2024",
    description: "Portfolio case study recreation with Next.js + Three.js",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rogier de Boeve - Portfolio 2024",
    description: "Portfolio case study recreation with Next.js + Three.js",
  },
};

// 定义视口设置，用于响应式设计。
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// 根布局组件 (RootLayout)。
// 它是整个应用的最外层包装器，必须包含 <html> 和 <body> 标签。
// 所有页面都会作为 children 渲染在其中。
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // is-locked 类可能用于初始加载时的滚动锁定或样式控制
    <html lang="en" className="is-locked">
      <body>
        {/* UiStateProvider 是一个客户端组件 (Client Component)，
            用于管理全局 UI 状态（如是否进入了 3D 场景）。
            因为它包裹了 children，所以整个应用都可以访问这个状态。 */}
        <UiStateProvider>{children}</UiStateProvider>
      </body>
    </html>
  );
}
