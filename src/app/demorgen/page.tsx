import { SiteShell } from "../../components/site/SiteShell";
import { ProjectView } from "../../components/site/ProjectView";

export const dynamic = "force-static";

export default function DeMorgenPage() {
  return (
    <SiteShell>
      <ProjectView
        slug="demorgen"
        title="De Morgen"
        description="Interactive year review for Belgian newspaper De Morgen, featuring a month-by-month breakdown of significant events, highlighting major global and local stories."
        liveUrl="https://2020-dm.com/"
        info={[
          { title: "Client:", description: "De Morgen" },
          { title: "Agency:", description: "Mortierbrigade" },
          { title: "Role:", description: "Full-stack dev" },
          { title: "Year:", description: "2021 / 2022" },
        ]}
        mediaDesktop={[
          {
            src: "/content/demorgen/images/01.webp",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-start-7 lg:col-span-12",
          },
          {
            src: "/content/demorgen/images/02.webp",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-span-18",
          },
          {
            src: "/content/demorgen/videos/01.mp4",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-span-18",
            poster: "/content/demorgen/images/01.webp",
          },
          {
            src: "/content/demorgen/videos/02.mp4",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-span-18",
            poster: "/content/demorgen/images/02.webp",
          },
        ]}
        mediaMobile={[
          {
            type: "picture",
            src: "/content/demorgen/images/02.webp",
            alt: "de morgen - year overview",
            width: 1600,
            height: 1140,
          },
          {
            type: "image",
            src: "/content/demorgen/images/01.webp",
            alt: "project media",
            width: 1600,
            height: 1140,
          },
          {
            type: "image",
            src: "/content/demorgen/images/02.webp",
            alt: "project media",
            width: 1600,
            height: 1140,
          },
        ]}
        next={{
          slug: "glenncatteeuw",
          title: "Glenn Catteeuw",
          alt: "Glenn Catteeuw portfolio",
          image: {
            src: "/content/glenncatteeuw/images/01.webp",
            width: 1600,
            height: 1140,
            className: "",
          },
        }}
      />
    </SiteShell>
  );
}
