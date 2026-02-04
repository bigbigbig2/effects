import { SiteShell } from "../../components/site/SiteShell";
import { ProjectView } from "../../components/site/ProjectView";

// 强制此页面为静态生成。
export const dynamic = "force-static";

// "Engaged" 项目详情页 (/engaged)。
// 这是一个硬编码的路由，可能优先于动态路由 [slug] 生效，或者用于特殊定制。
export default function EngagedPage() {
  return (
    <SiteShell>
      <ProjectView
        slug="engaged"
        title="Engaged"
        description="Engaged is a Belgium-based omnichannel activation agency helping brands get results by engaging with people in memorable experiences."
        liveUrl="https://engaged.be/"
        info={[
          { title: "Client:", description: "Engaged" },
          { title: "Role:", description: "Full-stack dev" },
          { title: "Year:", description: "2023" },
        ]}
        mediaDesktop={[
          {
            src: "/content/engaged/images/01.webp",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-start-7 lg:col-span-12",
          },
          {
            src: "/content/engaged/images/02.webp",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-span-18",
          },
          {
            src: "/content/engaged/videos/01.mp4",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-span-18",
            poster: "/content/engaged/images/01.webp",
          },
          {
            src: "/content/engaged/videos/02.mp4",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-span-18",
            poster: "/content/engaged/images/02.webp",
          },
          {
            src: "/content/engaged/videos/03.mp4",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-span-18",
            poster: "/content/engaged/images/03.webp",
          },
        ]}
        mediaMobile={[
          {
            type: "picture",
            src: "/content/engaged/images/02.webp",
            alt: "Engaged collage",
            width: 1600,
            height: 1140,
          },
          {
            type: "image",
            src: "/content/engaged/images/01.webp",
            alt: "project media",
            width: 1600,
            height: 1140,
          },
          {
            type: "image",
            src: "/content/engaged/images/02.webp",
            alt: "project media",
            width: 1600,
            height: 1140,
          },
          {
            type: "image",
            src: "/content/engaged/images/03.webp",
            alt: "project media",
            width: 1600,
            height: 1140,
          },
        ]}
        next={{
          slug: "spritexmarvel",
          title: "Sprite x Marvel",
          alt: "Sprite X Marvel",
          image: {
            src: "/content/spritexmarvel/images/01.webp",
            width: 1600,
            height: 1140,
            className: "",
          },
        }}
      />
    </SiteShell>
  );
}
