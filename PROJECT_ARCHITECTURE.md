# 项目架构与文档

## 1. 概览
本项目是一个高性能的个人作品集网站，基于 **Next.js 16 (App Router)** 和自定义的 **Three.js** 引擎构建。它采用了一种混合架构：React 负责处理 UI 和 DOM 元素，而一个专门的 TypeScript 引擎负责管理 WebGL 3D 体验。

## 2. 技术栈
- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **3D 引擎**: Three.js (自定义实现，未使用 React Three Fiber)
- **动画**: GSAP (GreenSock Animation Platform)
- **平滑滚动**: Lenis
- **样式**: CSS / 全局样式 (Global Styles)
- **音频**: Howler.js

## 3. 目录结构

### `src/app` (Next.js App Router)
处理路由和页面结构。
- `layout.tsx`: 根布局，包含全局提供者 (`UiStateProvider`) 和 CSS。
- `page.tsx`: 首页，渲染 `HomeView`。
- `[slug]/page.tsx`: 动态项目详情页，渲染 `ProjectView`。
- 特定项目文件夹 (如 `demorgen`, `engaged`): 可能用于特定路由覆盖或静态生成配置。

### `src/components` (React 组件)
- **`site/`**: 核心站点结构 (头部, 导航, 页脚, 视图)。
- **`ui/`**: 可复用 UI 元素 (按钮, 遮罩层, 加载屏)。
- **`experience/`**: 与 3D 引擎相关的组件 (例如 `ExperienceMount`, `ExperienceGate`)。
- **`dev/`**: 开发工具 (例如 `DebugGui`)。

### `src/experience` (3D 引擎)
核心 WebGL 逻辑，与 React 解耦。
- **`Experience.ts`**: 主入口点/控制器类。初始化渲染器、循环和场景。
- **`core/`**: 底层系统 (渲染器, 时间循环, 输入, 资源加载)。
- **`scenes/`**: 独立的 3D 场景 (例如用于主画廊的 `WorkScene`, `MediaScene`, `WavvesScene`)。
- **`pipeline/`**: 后处理效果 (合成器, Passes)。
- **`motion/`**: 动画驱动器 (滚动, Tween)。
- **`world/`**: 3D 对象和材质。

### `src/data`
包含项目的静态数据 (`projects.ts`, `projects.json`)。

## 4. 核心架构原则

### 混合渲染策略 (Hybrid Rendering Strategy)
本项目使用 **混合方法**：
1.  **React (Next.js)**: 管理 DOM、导航、SEO 和可访问的 UI 覆盖层。
2.  **Three.js (命令式)**: 在单个 `<canvas>` 元素中运行 (由 `ExperienceMount` 管理)。它在 React 渲染周期之外运行，以获得最大性能。

### 桥接 (React <-> Three.js)
React 和 3D 引擎之间的通信依赖于 **自定义事件 (Custom Events)** 和挂载组件。

1.  **挂载**:
    - `ExperienceMount.tsx` 在组件挂载时创建 `Experience` 类的实例。
    - 它将 canvas 和容器的 ref 传递给引擎。

2.  **事件总线 (Event Bus)**:
    - `Experience` 类监听窗口级事件 (例如 `ui:select`, `resize`)。
    - React 组件分发这些事件以控制 3D 场景 (例如，导航到项目会触发事件以动画化 3D 视图)。
    - `UiStateProvider` 管理全局 UI 状态 (例如 "entered", "locked") 并分发像 `sound:set` 这样的事件。

### 导航与过渡
- **Next.js Link**: 处理 URL 变更。
- **Lenis**: 管理 DOM 上的平滑滚动。
- **ScrollDriver**: 将 DOM 滚动位置与 3D 场景同步 (例如，根据滚动移动相机或对象)。

## 5. 关键流程

### 初始化
1.  用户访问站点。
2.  `layout.tsx` 加载。
3.  `ExperienceMount` 初始化 `Experience` 类。
4.  `Assets` 加载器获取纹理和模型。
5.  加载完成后，`Preloader` 隐藏，`HomeView` 或 `ProjectView` 变为可交互状态。

### 项目导航
1.  用户点击画廊中的一个项目。
2.  Next.js 导航到 `/project-slug`。
3.  路由变更更新 UI。
4.  同时，一个自定义事件通知 `Experience` 引擎转换 3D 场景 (例如，缩放到项目缩略图)。

## 6. 数据管理
项目数据静态存储在 `src/data` 中。此数据被以下部分引用：
- **Next.js Pages**: 用于渲染标题、描述和元数据。
- **3D 引擎**: 用于加载相应的纹理并为每个项目创建 3D 对象。
