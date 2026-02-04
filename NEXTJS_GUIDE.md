# Next.js 16 指南 (React 开发者版)

这份文档旨在帮助熟悉 React 但不熟悉 Next.js 的开发者快速理解本项目的架构和 Next.js 的核心概念。我们将结合本项目 (`rogier-portfolio`) 的实际代码进行讲解。

## 1. 核心概念：App Router (应用路由器)

在传统的 React 应用（如 Create React App）中，路由通常由 `react-router` 管理。而在 Next.js 中，**文件系统即路由**。

### 文件夹结构即 URL
在 `src/app` 目录下，每一个文件夹代表一个 URL 路径段，而文件夹中的 `page.tsx` 文件则是该路径的入口 UI。

*   `src/app/page.tsx` -> 对应首页 `/`
*   `src/app/about/page.tsx` -> 对应 `/about`
*   `src/app/[slug]/page.tsx` -> 对应动态路由，如 `/demorgen`, `/engaged`

**代码示例：**
查看 `src/app/page.tsx`，它导出了一个默认的 React 组件 `HomePage`，这就是用户访问首页时看到的内容。

## 2. 服务端组件 vs 客户端组件 (Server vs Client Components)

这是 Next.js 13+ (App Router) 最大的思维转变。

### 服务端组件 (Server Components) - 默认
在 `src/app` 目录下的所有组件**默认都是在服务端渲染的**。
*   **优势**：直接读取数据库/文件系统，发送给浏览器的 JS 更少，首屏加载更快，SEO 更好。
*   **限制**：不能使用 hooks (`useState`, `useEffect`)，不能使用浏览器 API (`window`, `document`)。

**本项目的例子**：
`src/app/page.tsx` 和 `src/app/[slug]/page.tsx` 都是服务端组件。它们获取数据（在本例中是静态数据），并渲染 HTML。

### 客户端组件 (Client Components)
如果你需要交互（点击事件、状态管理、动画），你需要显式地声明组件为客户端组件。
*   **方法**：在文件顶部添加 `"use client";` 指令。

**本项目的例子**：
查看 `src/components/site/UiStateProvider.tsx`：
```typescript
"use client"; // <--- 标记为客户端组件

import { useState, useEffect } from "react";
// ...
```
因为它使用了 `useState` 和 `useEffect` 来管理 UI 状态，所以必须是客户端组件。

## 3. 动态路由与静态生成 (SSG)

本项目使用了动态路由 `[slug]` 来展示不同的项目详情页。

### 动态参数
文件 `src/app/[slug]/page.tsx` 中的 `[slug]` 是一个占位符。
当用户访问 `/demorgen` 时，Next.js 会把 `"demorgen"` 作为参数传递给页面组件。

```typescript
// src/app/[slug]/page.tsx

// 页面组件接收 params 参数 (Next.js 15+ 中 params 是 Promise)
export default async function ProjectFallbackPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const resolvedParams = await params; // 等待参数解析
  const slug = resolvedParams.slug;    // 获取 "demorgen"
  // ...根据 slug 获取数据渲染页面
}
```

### 静态生成 (generateStaticParams)
为了高性能，我们在构建时就知道有哪些项目（存储在 `projects` 对象中）。我们可以告诉 Next.js 提前把这些页面生成好 HTML。

```typescript
// src/app/[slug]/page.tsx

export function generateStaticParams() {
  // 告诉 Next.js：请为 projects 对象里的每个 key 生成一个静态页面
  return Object.keys(projects).map((slug) => ({ slug }));
}
```
结合 `export const dynamic = "force-static";`，这确保了所有项目详情页都是纯静态 HTML，加载速度极快。

## 4. 布局 (Layouts)

`layout.tsx` 用于定义多个页面共享的 UI（如导航栏、页脚）。

*   **根布局 (`src/app/layout.tsx`)**：
    这是最外层的包装器，包含 `<html>` 和 `<body>` 标签。它包裹了应用中的所有页面。
    ```typescript
    export default function RootLayout({ children }) {
      return (
        <html lang="en">
          <body>
            <UiStateProvider>{children}</UiStateProvider>
          </body>
        </html>
      );
    }
    ```
    注意 `UiStateProvider` 被放在这里，意味着整个应用共享同一个 UI 状态上下文。

## 5. 元数据 (Metadata) - 替代 React Helmet

Next.js 内置了 SEO 管理。你不再需要 `react-helmet`。

**本项目的例子**：
在 `src/app/layout.tsx` 中：
```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rogier de Boeve - Portfolio 2024",
  description: "...",
  openGraph: { ... },
};
```
Next.js 会自动将其转换为 HTML `<head>` 中的 `<title>` 和 `<meta>` 标签。

## 6. 总结：React 开发者如何上手本项目

1.  **找页面**：去 `src/app` 找对应的文件夹。
2.  **找逻辑**：
    *   如果是数据获取或页面结构，看 `page.tsx` (服务端组件)。
    *   如果是交互组件（如按钮、3D 画布挂载点），看 `src/components` 下带有 `"use client"` 的文件。
3.  **理解 3D 结合**：
    *   Next.js 负责渲染 DOM 结构（`ProjectView` 等）。
    *   `src/components/ExperienceMount.tsx` (客户端组件) 负责启动 Three.js 引擎。
    *   两者并行运行，Next.js 处理路由跳转，同时通知 Three.js 切换场景。

这个架构利用了 Next.js 的**静态生成 (SSG)** 能力来保证首屏速度和 SEO，同时利用 React 的**客户端组件**来管理复杂的 WebGL 交互。
