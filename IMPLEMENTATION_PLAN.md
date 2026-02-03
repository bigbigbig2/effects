# 复刻实现方案（Rogier de Boeve Portfolio 2024）

> 目标：Next.js + React + Three.js + GSAP + Lenis + Howler，包含项目详情页，仅优化桌面端。

## 0. 目标与范围

**目标体验（对齐原站核心机制）**

- **主视觉**：把项目图片/视频“投影”到由透明立方体组成的网格屏幕上，并通过 alpha 结构化随机营造深度。
- **导航方式**：不移动相机，改为让“屏幕环”沿圆弧摆放，通过旋转这些屏幕完成场景切换（避免复杂 camera logic）。
- **投影视差**：投影内容与“相机/视角”同步但稍微偏移，产生 parallax。
- **性能策略**：屏幕移出视野时隐藏（减少 draw call / fillrate）。
- **渲染管线**：强调“像 Photoshop 图层一样”的渲染顺序控制（多层/多 pass）。
- **技术栈迁移**：作者用 Astro + Vite；改为 Next.js（App Router），其余可保持（Three.js、Lenis、GSAP、Howler、Alien.js）。

## 1. 技术选型（Next.js 版本）

**核心库**

- Next.js（App Router）：页面/路由/SEO/静态内容、资源组织、部署（Vercel 等）
- Three.js：WebGL 场景与渲染基础（作者也用）
- Alien.js（可选但推荐）：提供 Three.js 工具、材质、shader、后期、物理等“3D utilities”，并且有不同入口（/three、/ogl 等）
- Lenis：把离散滚轮变成连续平滑值（作者用）
- GSAP：数值驱动/时间线（作者用）
- Howler.js：音频播放/参数控制（作者用）

**Next.js 里关键架构原则**

- 所有 WebGL 都必须在 Client Component 中初始化（因为需要 DOM/Canvas/WebAudio）。
- 用 “Experience 单例 + 状态机” 管理渲染循环，避免 React 反复 re-render 干扰帧循环。
- UI（React）与 3D（Three）通过事件/订阅或轻量 store（如 zustand）沟通，不要把 Three 对象塞进 React state。

## 2. 项目结构设计（推荐目录）

```
src/
  app/
    layout.tsx
    page.tsx                  // 首页（静态内容 + ExperienceMount）
    projects/[slug]/page.tsx  // 项目详情（可选）
  components/
    ExperienceMount.tsx       // 只负责挂载 canvas、启动/销毁 Experience
    HUD.tsx                   // sci-fi UI（按钮、标题、滚动提示等）
  experience/
    index.ts                  // createExperience()
    Experience.ts             // 单例：init/update/destroy
    core/
      Renderer.ts             // WebGLRenderer + resize + DPR
      Scene.ts                // scene graph
      Camera.ts               // 简化相机逻辑
      Time.ts                 // requestAnimationFrame + delta
      Input.ts                // pointer + wheel 接入（wheel 交给 Lenis）
      Assets.ts               // textures/videos loader
    world/
      ScreenRing.ts           // 圆弧屏幕排布 & 旋转导航
      CubeGridScreen.ts       // 透明立方体网格 + alpha 结构化随机
      ProjectionMaterial.ts   // 投影贴图/视频 + parallax 偏移
    pipeline/
      Composer.ts             // 后期/多 pass
      Passes.ts
    audio/
      Soundscape.ts           // Howler：环境音 + 速度映射 pitch/volume
    motion/
      ScrollDriver.ts         // Lenis -> progress
      TweenDriver.ts          // GSAP -> smoothing/ease
```

## 3. 分步实现计划（你按阶段做就能跑）

### Phase A：Next.js 基础壳（1 天）

目标：页面能打开、SEO 正常、Canvas 能挂载，且 WebGL 不阻塞首屏。

- `app/layout.tsx`：写好 meta、OG、字体加载等
- `app/page.tsx`：上半部是静态文案/导航，下半部放 `<ExperienceMount />`
- `ExperienceMount.tsx`：
  - `useEffect` 里 `createExperience({ canvas, container })`
  - unmount 时 `experience.destroy()`（释放 WebGL、事件监听、音频）

这一步对应作者用 Astro 做“SSG 壳”的角色，你用 Next.js 一样能做到：页面内容 SSR/SSG，WebGL 延迟初始化。

### Phase B：Three.js 渲染循环与 Resize（半天）

目标：空场景正常渲染、DPR 控制、窗口缩放不糊。

- Renderer：
  - `setPixelRatio(Math.min(devicePixelRatio, 2))`
  - `setSize(width, height)`
- Time：
  - `requestAnimationFrame`
  - `delta`（秒）用于动画稳定

### Phase C：实现“圆弧屏幕 + 旋转导航”的骨架（1–2 天）

作者的关键点：不动相机，旋转屏幕。

**设计**

- `ScreenRing` 管理 N 个“屏幕”
- 每个屏幕放在圆周上（半径 R），朝向圆心
- 用户滚动 → 目标角度 `targetTheta` → 平滑到 `currentTheta`
- 当前选中屏幕对齐视野（例如正前方）

**伪代码（核心公式）**

```js
// theta: 全局旋转角
for (let i = 0; i < N; i++) {
  const a = i * (Math.PI * 2 / N);
  const x = Math.cos(a) * R;
  const z = Math.sin(a) * R;
  screen[i].position.set(x, 0, z);
  screen[i].lookAt(0, 0, 0);
}
ring.rotation.y = currentTheta; // 旋转整个环
```

### Phase D：透明立方体网格屏幕（2–4 天）

作者描述：把图片/视频投影到透明 cube grid，并且 alpha 不是完全随机，而是“每行（z轴）带结构 + 每个 cube 再随机”以平衡秩序与随机。

**设计方案（实用且可控）**

- 每个屏幕由 W × H 个小立方体组成（instanced mesh）
- alpha 生成：
  - 先给每一行（z）一个 `rowAlpha`（低频随机/噪声）
  - 每个 cube 再乘一个 `cubeAlpha`（高频随机）
  - 得到最终 alpha：`alpha = mix(rowAlpha, cubeAlpha, k)` 或 `alpha = rowAlpha * (0.5 + 0.5*cubeRand)`

**性能建议**

- 用 `THREE.InstancedMesh`（非常关键）
- alpha 放到 instance attribute，shader 里读
- 贴图采样按 instance UV 计算（或按 cube 在网格中的坐标计算）

### Phase E：投影贴图/视频 + 视差偏移（1–3 天）

作者：投影与相机同步但略有 offset 形成 parallax。

**设计**

- 每个屏幕绑定一张 texture（图片或 video texture）
- 用自定义 `ShaderMaterial`：
  - 根据 cube 的网格坐标计算 UV
  - 加上 `parallaxOffset`（跟随 ring rotation / scroll velocity）

**示意**

```glsl
vec2 uv = baseUV + parallax * vec2(offsetX, offsetY);
vec4 tex = texture2D(uTex, uv);
float a = tex.a * instanceAlpha; // 叠加你的透明度策略
```

### Phase F：出视野隐藏（半天）

作者：屏幕 out of view 就隐藏以提升性能。

**设计**

- 对每个屏幕计算与相机前向的夹角
- 超过阈值就 `screen.visible = false`
- 或更平滑：alpha 淡出（但仍要考虑 draw call）

**伪代码**

```js
const forward = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
const dir = screen.position.clone().sub(camera.position).normalize();
const dot = forward.dot(dir);

screen.visible = dot > 0.2; // 阈值自己调
```

### Phase G：滚动驱动（Lenis）+ 数值缓动（GSAP）（1 天）

作者技术栈里同时列了 Lenis 和 GSAP。

**推荐结构**

- `ScrollDriver`：从 Lenis 得 rawProgress
- `TweenDriver`：`currentProgress = lerp(currentProgress, rawProgress, ease)` 或 `gsap.ticker` 驱动

### Phase H：声音随运动变化（Howler）（0.5–1 天）

作者强调声音设计“反映场景运动与交互”。

**简化版**

- 环境底噪循环播放
- `velocity = abs(currentTheta - lastTheta) / delta`
- 映射到：`howl.volume(clamp(map(velocity)))`
- （可选）用 `playbackRate` 做“音高变化”

### Phase I：分层渲染管线（2–5 天）

作者强调“可精确控制渲染顺序的 pipeline”，像图层一样。

**三档策略**

- 档 1：先不做后期（最快落地）
  - `renderer.render(scene, camera)`
- 档 2：Three EffectComposer
  - `RenderPass`（主渲染）
  - `BloomPass` / `FilmPass` / `ColorCorrection`
  - 叠加 grain / RGB shift
- 档 3：引入 Alien.js 的 shader/program 工具（更贴作者生态）

## 4. Next.js 与 Astro 的“等价替换点”

作者用 Astro 的原因是：内容更新与 SSG 壳很适配，不接 CMS。
你换 Next.js 时建议这样对齐：

- 静态页面：`generateStaticParams` + `export const dynamic = 'force-static'`（如适用）
- SEO：用 Next `metadata` / `generateMetadata`
- 资源：图片/视频走 `public/` 或 CDN；大资源延迟加载
- WebGL 延迟初始化：`IntersectionObserver` 进入视野再 `import()` Experience（首屏更快）

## 5. 同类方案对比（你知道自己在选什么）

**“Alien.js 框架层”同类**

- 自建 Three.js 架构：最自由，但你要自己写 pipeline/loader/input/motion
- Theatre.js：偏“可视化时间线编辑”，适合动画制作流程；不替代 pipeline
- Babylon / PlayCanvas：更完整引擎，但抽象更重，做“作者级渲染管线”会受限
- Alien.js：偏“工具/材质/shader/物理 + 例子很多”，适合视觉实验站；且提供 three/ogl/oimophysics 入口

**“站点外壳”同类（你现在选 Next）**

- Astro：静态优先、岛屿架构轻（作者选它）
- Next：更应用化、生态大、路由/数据能力更强（你选它完全 OK）

## 6. 交付里程碑（建议你按这个验收）

- **M1**：Next 页面 + Canvas 挂载 + 空场景渲染
- **M2**：圆弧屏幕排布 + 滚动旋转导航（无材质）
- **M3**：Cube Grid（instanced）+ alpha 结构化随机
- **M4**：投影贴图/视频 + parallax offset
- **M5**：出视野隐藏 + 资源懒加载（性能达标）
- **M6**：后期管线（Bloom/Grain/RGB shift 任选）
- **M7**：音频随 velocity 变化 + UI 打磨
