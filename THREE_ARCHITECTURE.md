# Three.js 架构与渲染流程说明（当前分支）

本文档仅覆盖当前分支中 **Three.js 相关部分**，强调实现原理、渲染流程与模块组织。当前架构已精简为 **Work 即最终输出**，不再经过额外的最终合成器。

**范围**  
仅包含 `src/experience` 与 Three.js 相关的 `src/components/dev/DebugGui.tsx`，不包含 React 页面结构与数据渲染细节。

---
**1. 总览**

当前 Three.js 主干由以下核心模块构成：
- `src/experience/Experience.ts`：主控制器（初始化、主循环、事件）。
- `src/experience/pipeline/RenderPipeline.ts`：渲染管线调度（WorkScene + WorkThumbScene）。
- `src/experience/scenes/WorkScene.ts`：主 3D 场景（工作视图）。
- `src/experience/pipeline/WorkRenderManager.ts`：Work 的渲染与后处理（Bloom / Luminosity / MouseSim）。
- `src/experience/pipeline/AdvancedRenderManager.ts`：后处理与离屏管线底座。
- `src/experience/scenes/WorkThumbScene.ts`：缩略图离屏渲染（提供 SpotLight 投影纹理）。
- `src/experience/world/*`：Work 相关世界对象（WorkScreen / WorkEnvironment / WorkFloor 等）。
- `src/experience/core/*`：Renderer / Input / Time / Assets / MouseSim / BufferSim。

当前已经移除：
- `MainComposite` 最终合成器
- `Media/Wavves/Sky` 等场景
- 复杂 Layer/Display Debug 视图

WorkRenderManager 直接 `renderToScreen`，因此 **Work 即最终画面**。

---
**2. 目录组织（Three.js 相关）**

- `src/experience/core/`
  - `Renderer.ts`：WebGLRenderer 封装。
  - `Time.ts`：主循环驱动。
  - `Input.ts`：鼠标与指针输入采集。
  - `Assets.ts`：纹理/资源加载。
  - `MouseSim.ts`：鼠标轨迹模拟（基于 BufferSim 的 ping-pong FBO）。
  - `BufferSim.ts`：通用 ping-pong 离屏模拟器。
- `src/experience/motion/`
  - `ScrollDriver.ts`：滚动驱动。
  - `TweenDriver.ts`：滚动到场景进度的缓动。
- `src/experience/pipeline/`
  - `RenderPipeline.ts`：渲染链路调度（Work + WorkThumb）。
  - `AdvancedRenderManager.ts`：后处理 / Bloom / Blur / Luminosity / FXAA 的通用实现。
  - `WorkRenderManager.ts`：Work 专用 RenderManager（组合 Shader + 参数）。
  - `WorkThumbRenderManager.ts`：缩略图投影纹理的离屏渲染。
- `src/experience/scenes/`
  - `WorkScene.ts`：主场景（网格块 / 地面 / 环境 / 灯光）。
  - `WorkThumbScene.ts`：缩略图离屏场景（SpotLight 投影纹理）。
- `src/experience/world/`
  - `WorkScreen.ts`：实例化立方体阵列（核心视觉组件）。
  - `WorkInstancedMaterial.ts`：自定义 Instanced 材质（接入自定义 Shader）。
  - `WorkEnvironment.ts`：环境圆柱背景（自定义 Shader）。
  - `WorkFloor.ts` + `Reflector.ts`：地面反射与法线扰动。
  - `shaders.ts`：Work/Env/Floor 自定义 Shader 片段。
- `src/experience/data/`
  - `projects.ts`：项目数据（颜色、纹理路径、缩略图参数）。

---
**3. 启动与初始化流程**

入口：
- `src/experience/index.ts` → `createExperience(...)`  
  创建 `Experience` 实例并挂在页面。

`Experience` 构造流程（`src/experience/Experience.ts`）：
1. 初始化 `Renderer / Input / Assets / ScrollDriver / TweenDriver / Soundscape`。
2. 创建 `RenderPipeline`。
3. 设置初始 `activeIndex` 与主题色。
4. 绑定事件与启动 `Time` 主循环。
5. 调用 `resize()`。

`RenderPipeline` 构造流程（`src/experience/pipeline/RenderPipeline.ts`）：
1. 创建 `WorkScene` + `WorkThumbScene`。
2. `WorkThumbScene.texture` 作为 `SpotLight.map` 投影贴图。
3. 加载核心纹理：
   - `blue-noise.png` → MouseSim 噪声。
   - `perlin-1.webp` → Work 屏幕扰动 + 环境背景噪声。
   - `floor-normal.webp` → 地面法线。
4. 加载 cubemap 并设置 scene environment。
5. 创建一个 1x1 黑色 `displacementTexture`（目前作为占位）。

---
**4. 帧循环与更新流程**

`Experience.update(...)`（`src/experience/Experience.ts`）：
1. `ScrollDriver.update()`  
2. 处理滚动节拍（step logic）并更新 `TweenDriver`。
3. `Soundscape.update(...)`  
4. `RenderPipeline.update(...)`

`RenderPipeline.update(...)`（`src/experience/pipeline/RenderPipeline.ts`）：
1. `applySettings(...)`：把 GUI / settings 写入场景与 RenderManager。
2. `WorkScene.update(...)`
3. `WorkThumbScene.update(-tween.progress)`（缩略图投影纹理滚动）

---
**4.1 每帧渲染流程（详细拆解）**

下面描述单帧内 WebGL 的完整路径，便于定位效果与性能瓶颈。

**A. 逻辑更新阶段**
1. `Experience.update`  
   - 计算滚动状态、节拍切换、动画进度（`ScrollDriver` / `TweenDriver`）。
2. `RenderPipeline.applySettings`  
   - 同步 settings → `WorkScene`（灯光/地面/雾/环境/鼠标参数）。
   - 同步 settings → `WorkRenderManager`（Bloom/Luminosity/Darken/Saturation）。
3. `WorkScene.update`  
   - 更新场景旋转角度、可见性裁剪。
   - 更新每个 `WorkScreen` 的实例动画、鼠标模拟纹理。
   - 更新环境材质时间、灯光位置。
4. `WorkThumbScene.update`  
   - 更新缩略图滚动进度并渲染离屏纹理（供 SpotLight 投影）。

**B. 渲染阶段（WorkRenderManager / AdvancedRenderManager）**
> WorkRenderManager 继承自 AdvancedRenderManager，其流程本质相同：

1. **主场景渲染**  
   - `renderTargetA` ← `renderer.render(scene, camera)`
2. **可选 Blur（如启用）**  
   - `renderTargetBlurA` ← 横向模糊  
   - `renderTargetBlurB` ← 纵向模糊  
3. **可选 Luminosity（亮部提取）**  
   - `renderTargetBright` ← `tScene` 亮度阈值提取  
4. **Bloom Mip Chain**  
   - 多级下采样 + 横纵模糊 → `renderTargetsHorizontal/Vertical`  
   - `BloomMaterial` 合成结果 → `tBloom`  
5. **MouseSim 更新（若启用）**  
   - `MouseSim.update` → `tMouseSim`  
6. **WorkComposite 合成**  
   - 采样 `tScene / tBloom / tMouseSim`  
   - 应用暗化/饱和度  
7. **输出到屏幕**  
   - `renderToScreen = true` → `renderer.render(screenQuad)`  
   - 结果即最终画面

---
**4.2 GPU 纹理/RT 依赖关系（文本图）**

```
WorkScene (3D)
  -> renderTargetA (tScene)
  -> [Luminosity] -> renderTargetBright
  -> [Bloom mips] -> renderTargetsHorizontal/Vertical -> tBloom

MouseSim (global)
  -> BufferSim ping-pong -> tMouseSim

WorkComposite (screen quad)
  inputs: tScene + tBloom + tMouseSim
  output: Screen
```

---
**4.3 帧内性能与质量影响点**

- `bloomEnabled / bloomStrength / bloomRadius`
  - 直接决定 Bloom mip chain 的分辨率级联与合成强度。
- `luminosityEnabled / threshold`
  - 控制 Bloom 输入亮部区域，影响对比与氛围。
- `mouseFactor / thickness / persistance`
  - 影响鼠标模拟纹理的写入范围与衰减。
- `work.onlyActiveVisible`
  - 降低同时渲染的实例量，直接影响 GPU 负载。

---
**5. WorkScene 架构与核心渲染**

文件：`src/experience/scenes/WorkScene.ts`

构成：
- `WorkScreen` 网格块阵列（InstancedMesh）
- `WorkFloor` 地面反射
- `WorkEnvironment` 环境圆柱背景
- `SpotLight + Ambient + Directional` 光源

关键点：
1. **网格块阵列**
   - `WorkScreen` 使用 `InstancedMesh` + `WorkInstancedMaterial` 实现 3D 块阵列。
   - 每个块的动画/变形来自自定义 Shader + 鼠标模拟纹理。

2. **鼠标交互**
   - `WorkScreen` 内部使用 `MouseSim`。
   - `MouseSim` 通过 `BufferSim` 实现 ping-pong FBO，输出纹理给材质采样。

3. **场景旋转**
   - 场景旋转由 `TweenDriver.progress` 驱动，形成环形排列 + 旋转切换。

4. **地面反射**
   - `WorkFloor` 通过 `Reflector` 渲染虚拟相机视角作为反射纹理。

5. **环境背景**
   - `WorkEnvironment` 使用自定义 Shader + Perlin 噪声生成动态背景。

---
**6. WorkRenderManager（最终输出）**

文件：`src/experience/pipeline/WorkRenderManager.ts`

现在 Work 直接作为最终画面输出，`renderToScreen = true`。  
渲染流程由 `AdvancedRenderManager` 执行，核心步骤如下：

1. 主场景渲染到 `renderTargetA`
2. 可选 Blur（`renderTargetBlurA/B`）
3. 可选 Luminosity（亮部提取）
4. Bloom Mip Chain（多级下采样模糊）
5. `WorkCompositeMaterial` 合成：
   - 采样 `tScene`（主场景）
   - 采样 `tBloom`（Bloom 结果）
   - 采样 `tMouseSim`（全局鼠标模拟）
   - 可选暗化/饱和度
6. 如果 `renderToScreen = true`，最终直接输出到屏幕

`WorkCompositeMaterial` 的片段着色器位于 `src/experience/pipeline/WorkRenderManager.ts`。

---
**7. 缩略图投影（SpotLight gobo）**

文件：
- `src/experience/scenes/WorkThumbScene.ts`
- `src/experience/pipeline/WorkThumbRenderManager.ts`

机制：
1. `WorkThumbScene` 使用正交相机渲染缩略图序列。
2. `WorkThumbRenderManager` 将缩略图做暗化/饱和处理。
3. 输出纹理通过 `WorkScene.setSpotLightMap(...)` 赋给 `SpotLight.map`。
4. 实现投影效果（类似 gobo）。

---
**8. MouseSim 与 BufferSim**

文件：
- `src/experience/core/MouseSim.ts`
- `src/experience/core/BufferSim.ts`

原理：
- `BufferSim` 维护两个 `WebGLRenderTarget` 做 ping-pong。
- `MouseSim` 通过 Shader 模拟轨迹扩散，并输出纹理供材质采样。
- `WorkScreen` 使用局部 MouseSim；`WorkRenderManager` 可用全局 MouseSim 叠加。

---
**9. 关键数据流示意**

```
Input/Pointer
  -> MouseSim (WorkScreen) -> tMouseSim -> WorkInstancedMaterial
  -> MouseSim (WorkRenderManager) -> tMouseSim -> WorkComposite

Assets
  -> perlin-1.webp -> WorkInstancedMaterial / WorkEnvironment
  -> blue-noise.png -> MouseSim (noise)
  -> floor-normal.webp -> WorkFloor
  -> cubemap -> scene.environment

WorkThumbScene -> WorkThumbRenderManager -> texture -> SpotLight.map

WorkScene -> WorkRenderManager (AdvancedRenderManager)
  -> renderTargetA -> Bloom/Luminosity -> WorkComposite -> Screen
```

---
**10. 设置系统与调试**

文件：
- `src/experience/settings.ts`
- `src/components/dev/DebugGui.tsx`

当前设置分为三类：
- `controls`：滚动与切换节奏
- `render`：Bloom / Darken / Saturation / Luminosity
- `work`：灯光、雾、地面、环境、鼠标交互

Debug GUI 只保留这些有效参数。

---
**11. 可扩展性建议**

如果你计划在 Work 分支继续扩展效果：
- 新效果推荐挂到 `WorkRenderManager` 或 `WorkScene` 中，避免再次引入全局合成器。
- 若需要叠加多层纹理，可在 `WorkCompositeMaterial` 增加纹理通道。
- 若需要额外离屏特效，可仿照 `WorkThumbRenderManager` 新增专用离屏模块。

---
**12. 关键文件索引**

- 入口与主循环：`src/experience/Experience.ts`
- 渲染调度：`src/experience/pipeline/RenderPipeline.ts`
- Work 场景：`src/experience/scenes/WorkScene.ts`
- Work 渲染管理：`src/experience/pipeline/WorkRenderManager.ts`
- RenderManager 通用实现：`src/experience/pipeline/AdvancedRenderManager.ts`
- 视觉核心：`src/experience/world/WorkScreen.ts`
- 自定义材质：`src/experience/world/WorkInstancedMaterial.ts`
- 环境背景：`src/experience/world/WorkEnvironment.ts`
- 地面反射：`src/experience/world/WorkFloor.ts`, `src/experience/world/Reflector.ts`
- 鼠标模拟：`src/experience/core/MouseSim.ts`, `src/experience/core/BufferSim.ts`
