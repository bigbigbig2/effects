// 这个文件用于定义 <head> 中的内容。
// 注意：在 Next.js 13+ (App Router) 中，推荐使用 metadata API (在 layout.tsx 或 page.tsx 中导出 metadata 对象)。
// 这个 head.tsx 可能是为了兼容旧习惯或特定需求保留的，但在新项目中通常不需要。
// 这里的代码主要用于引入 favicon 和 manifest 文件。
export default function Head() {
  return (
    <>
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </>
  );
}